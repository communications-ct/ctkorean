#!/usr/bin/env node
/**
 * Fetch latest JSON from GAS and write to ./data/*.json, to be run manually or via CI.
 */
const fs = require('fs');
const path = require('path');

const CONFIG = {
  ANNOUNCEMENTS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=ann',
  BULLETINS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=bulletin',
  ALBUMS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=albums',
};

async function fetchJson(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${url}\n${text.slice(0, 200)}`);
  }
  if (!ct.includes('application/json')) {
    const text = await res.text();
    // Try to parse anyway
    try { return JSON.parse(text); } catch (_e) {
      throw new Error(`Non-JSON content-type (${ct}) from ${url}\nPreview: ${text.slice(0, 200)}`);
    }
  }
  return res.json();
}

async function main() {
  const outDir = path.resolve(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results = { ann: [], bul: [], alb: [] };
  try { results.ann = await fetchJson(CONFIG.ANNOUNCEMENTS_URL); }
  catch (e) { console.error('ANN fetch failed:', e.message); }
  try { results.bul = await fetchJson(CONFIG.BULLETINS_URL); }
  catch (e) { console.error('BUL fetch failed:', e.message); }
  try { results.alb = await fetchJson(CONFIG.ALBUMS_URL); }
  catch (e) { console.error('ALB fetch failed:', e.message); }

  fs.writeFileSync(path.join(outDir, 'announcements.json'), JSON.stringify(results.ann || [], null, 2));
  fs.writeFileSync(path.join(outDir, 'bulletins.json'), JSON.stringify(results.bul || [], null, 2));
  fs.writeFileSync(path.join(outDir, 'albums.json'), JSON.stringify(results.alb || [], null, 2));

  console.log('Published data to ./data/*.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
