#!/usr/bin/env node
/**
 * Fetch latest JSON from GAS and write to ./data/*.json, to be run manually or via CI.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = {
  ANNOUNCEMENTS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=ann',
  BULLETINS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=bulletin',
  ALBUMS_URL: 'https://script.google.com/macros/s/AKfycbzivlp1VLwa6aIT9AksAkydRwOSp1kuThbBxl8UjzHt0ShMM56K91lpQIyRCDaW2kcsng/exec?type=albums',
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      let data = '';
      res.on('data', (d) => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const outDir = path.resolve(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const [ann, bul, alb] = await Promise.all([
    fetchJson(CONFIG.ANNOUNCEMENTS_URL).catch(() => []),
    fetchJson(CONFIG.BULLETINS_URL).catch(() => []),
    fetchJson(CONFIG.ALBUMS_URL).catch(() => []),
  ]);

  fs.writeFileSync(path.join(outDir, 'announcements.json'), JSON.stringify(ann, null, 2));
  fs.writeFileSync(path.join(outDir, 'bulletins.json'), JSON.stringify(bul, null, 2));
  fs.writeFileSync(path.join(outDir, 'albums.json'), JSON.stringify(alb, null, 2));

  console.log('Published data to ./data/*.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
