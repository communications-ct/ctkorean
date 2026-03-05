#!/usr/bin/env node
/**
 * Fetch latest JSON from GAS, download thumbnails/PDFs, and strip Drive URLs.
 * Writes sanitized JSON to public/data/ (Astro) and data/ (legacy).
 *
 * Security: Google Drive URLs are stripped from the served JSON.
 * - Thumbnails: downloaded to public/images/thumbs/{fileId}.jpg
 * - Bulletin PDFs: downloaded to public/data/pdfs/{fileId}.pdf
 * - Announcement images: downloaded to public/images/announcements/{fileId}.jpg
 * - Album folder URLs: stored as ID only, never full URL
 */
const fs = require('fs');
const path = require('path');

const CONFIG = {
  ANNOUNCEMENTS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=ann',
  BULLETINS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=bulletin',
  ALBUMS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=albums',
  BASE_PATH: '/ctkorean',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${url}\n${text.slice(0, 200)}`);
  }
  if (!ct.includes('application/json')) {
    const text = await res.text();
    try { return JSON.parse(text); } catch (_e) {
      throw new Error(`Non-JSON content-type (${ct}) from ${url}\nPreview: ${text.slice(0, 200)}`);
    }
  }
  return res.json();
}

function extractFileId(url) {
  if (!url) return null;
  const m = url.match(/\/d\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function extractFolderId(url) {
  if (!url) return null;
  const m = url.match(/\/folders\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      console.warn(`  Download failed (${res.status}): ${url}`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) {
      console.warn(`  Download too small (${buffer.length}B), skipping: ${url}`);
      return false;
    }
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (e) {
    console.warn(`  Download error: ${e.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Transform & Download
// ---------------------------------------------------------------------------

async function processAlbums(albums, thumbsDir) {
  const processed = [];
  for (const item of albums) {
    const thumbId = extractFileId(item.thumbUrl);
    const folderId = extractFolderId(item.albumUrl);

    let localThumb = null;
    if (thumbId) {
      const destFile = path.join(thumbsDir, `${thumbId}.jpg`);
      // Use lh3 format (most stable Google thumbnail URL)
      const thumbUrl = `https://lh3.googleusercontent.com/d/${thumbId}=w400`;
      if (!fs.existsSync(destFile)) {
        console.log(`  Downloading album thumb: ${thumbId}`);
        const ok = await downloadFile(thumbUrl, destFile);
        if (ok) localThumb = `${CONFIG.BASE_PATH}/images/thumbs/${thumbId}.jpg`;
      } else {
        localThumb = `${CONFIG.BASE_PATH}/images/thumbs/${thumbId}.jpg`;
      }
    }

    processed.push({
      date: item.date,
      title: item.title,
      albumId: folderId || null,
      thumbUrl: localThumb || null,
      // NOTE: albumUrl (full Drive URL) is intentionally NOT included
    });
  }
  return processed;
}

async function processBulletins(bulletins, pdfsDir) {
  const processed = [];
  for (const item of bulletins) {
    const fileId = extractFileId(item.previewUrl || item.fileUrl);

    let localPdf = null;
    if (fileId) {
      const destFile = path.join(pdfsDir, `${fileId}.pdf`);
      if (!fs.existsSync(destFile)) {
        // Download PDF via Drive export
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log(`  Downloading bulletin PDF: ${fileId}`);
        const ok = await downloadFile(downloadUrl, destFile);
        if (ok) localPdf = `${CONFIG.BASE_PATH}/data/pdfs/${fileId}.pdf`;
      } else {
        localPdf = `${CONFIG.BASE_PATH}/data/pdfs/${fileId}.pdf`;
      }
    }

    processed.push({
      date: item.date,
      title: item.title,
      type: item.type || 'pdf',
      fileUrl: localPdf || null,
      previewUrl: localPdf || null,
      // NOTE: original Drive URLs intentionally stripped
    });
  }
  return processed;
}

async function processAnnouncements(announcements, imagesDir) {
  const processed = [];
  for (const item of announcements) {
    const images = [];

    if (item.images && Array.isArray(item.images)) {
      for (const imgUrl of item.images) {
        const fileId = extractFileId(imgUrl);
        if (!fileId) continue;

        const destFile = path.join(imagesDir, `${fileId}.jpg`);
        const localPath = `${CONFIG.BASE_PATH}/images/announcements/${fileId}.jpg`;

        if (!fs.existsSync(destFile)) {
          const downloadUrl = `https://lh3.googleusercontent.com/d/${fileId}=w800`;
          console.log(`  Downloading announcement image: ${fileId}`);
          const ok = await downloadFile(downloadUrl, destFile);
          if (ok) images.push(localPath);
        } else {
          images.push(localPath);
        }
      }
    }

    processed.push({
      date: item.date,
      title: item.title,
      body: item.body,
      link: item.link,
      urgent: item.urgent,
      images: images.length > 0 ? images : undefined,
      // NOTE: original Drive image URLs intentionally stripped
    });
  }
  return processed;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const root = path.resolve(__dirname, '..');
  const publicDir = path.resolve(root, 'public', 'data');
  const legacyDir = path.resolve(root, 'data');
  const thumbsDir = path.resolve(root, 'public', 'images', 'thumbs');
  const annImagesDir = path.resolve(root, 'public', 'images', 'announcements');
  const pdfsDir = path.resolve(root, 'public', 'data', 'pdfs');

  // Ensure directories
  for (const dir of [publicDir, legacyDir, thumbsDir, annImagesDir, pdfsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // Fetch raw data from GAS
  console.log('Fetching data from GAS...');
  const raw = { ann: [], bul: [], alb: [] };
  try { raw.ann = await fetchJson(CONFIG.ANNOUNCEMENTS_URL); }
  catch (e) { console.error('ANN fetch failed:', e.message); }
  try { raw.bul = await fetchJson(CONFIG.BULLETINS_URL); }
  catch (e) { console.error('BUL fetch failed:', e.message); }
  try { raw.alb = await fetchJson(CONFIG.ALBUMS_URL); }
  catch (e) { console.error('ALB fetch failed:', e.message); }

  // Process: download assets & strip Drive URLs
  console.log('Processing albums (downloading thumbnails)...');
  const albums = await processAlbums(raw.alb || [], thumbsDir);

  console.log('Processing bulletins (downloading PDFs)...');
  const bulletins = await processBulletins(raw.bul || [], pdfsDir);

  // Announcements: download images, strip Drive URLs
  console.log('Processing announcements (downloading images)...');
  const announcements = await processAnnouncements(raw.ann || [], annImagesDir);

  // Write sanitized JSON
  const files = [
    ['announcements.json', announcements],
    ['bulletins.json', bulletins],
    ['albums.json', albums],
  ];

  for (const [filename, data] of files) {
    const json = JSON.stringify(data || [], null, 2);
    fs.writeFileSync(path.join(publicDir, filename), json);
    fs.writeFileSync(path.join(legacyDir, filename), json);
  }

  const annImageCount = announcements.reduce((n, a) => n + (a.images ? a.images.length : 0), 0);
  console.log(`Published data:
  - ${announcements.length} announcements (${annImageCount} images downloaded)
  - ${bulletins.length} bulletins (PDFs downloaded)
  - ${albums.length} albums (thumbnails downloaded)
  - Drive URLs stripped from all served JSON`);
}

main().catch((e) => { console.error(e); process.exit(1); });
