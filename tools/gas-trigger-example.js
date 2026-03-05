/**
 * Google Apps Script (GAS) — repository_dispatch trigger example.
 *
 * This code runs INSIDE Google Apps Script, NOT in this Node.js project.
 * Copy this into your GAS project and configure the Script Properties.
 *
 * Setup:
 *   1. Create a GitHub Personal Access Token (classic) with `repo` scope:
 *      https://github.com/settings/tokens/new
 *   2. In GAS: Project Settings → Script Properties → Add:
 *      - GH_TOKEN = ghp_xxxxxxxxxxxxxxxxxxxx
 *      - GH_REPO  = communications-ct/ctkorean
 *   3. In GAS: Triggers → Add Trigger:
 *      - Function: checkAndDispatch
 *      - Event source: Time-driven
 *      - Type: Minutes timer → Every 5 minutes
 *
 * How it works:
 *   - Every 5 minutes, GAS checks if data changed (via checksum)
 *   - If changed, sends repository_dispatch to GitHub → triggers deploy.yaml
 *   - deploy.yaml runs publish-data.cjs → Astro build → GitHub Pages deploy
 *   - Total latency from data change to live site: ~5-20 minutes
 */

// eslint-disable-next-line no-unused-vars
function checkAndDispatch() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GH_TOKEN');
  var repo = props.getProperty('GH_REPO') || 'communications-ct/ctkorean';

  if (!token) {
    Logger.log('GH_TOKEN not set in Script Properties');
    return;
  }

  // Check if data actually changed (simple hash comparison)
  var currentHash = computeDataHash_();
  var lastHash = props.getProperty('LAST_DATA_HASH') || '';

  if (currentHash === lastHash) {
    Logger.log('No data changes detected');
    return;
  }

  // Data changed — trigger GitHub rebuild
  var url = 'https://api.github.com/repos/' + repo + '/dispatches';
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    payload: JSON.stringify({
      event_type: 'gas-data-changed',
      client_payload: {
        timestamp: new Date().toISOString(),
        hash: currentHash,
      },
    }),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code === 204) {
    Logger.log('repository_dispatch sent successfully');
    props.setProperty('LAST_DATA_HASH', currentHash);
  } else {
    Logger.log('Dispatch failed: HTTP ' + code + ' - ' + response.getContentText());
  }
}

/**
 * Compute a simple hash of current data to detect changes.
 * Customize this based on your actual data source (Sheets, etc.)
 */
function computeDataHash_() {
  // Example: hash the first 100 rows of your announcements sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('announcements'); // adjust sheet name
  if (!sheet) return '';

  var data = sheet.getDataRange().getValues();
  var str = JSON.stringify(data);

  // Simple hash using Utilities.computeDigest
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str);
  return hash
    .map(function (b) {
      return ('0' + (b & 0xff).toString(16)).slice(-2);
    })
    .join('');
}
