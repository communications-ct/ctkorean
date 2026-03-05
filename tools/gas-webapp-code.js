/**
 * Google Apps Script — 예수성심 천주교 커네티컷 성당 CMS Backend
 *
 * 이 코드는 Google Apps Script (GAS) 프로젝트에 복사하여 사용합니다.
 * Node.js 환경이 아닌 GAS 환경에서 실행됩니다.
 *
 * 기능:
 *   - Public API: ?type=ann|bulletin|albums (기존 호환)
 *   - Admin Panel: ?mode=admin (HTML Service CMS)
 *   - CRUD: 공지사항 생성/수정/삭제
 *   - 이미지 업로드: Google Drive 저장
 *   - 자동 인덱싱: 10,000행 초과 시 새 시트 생성
 *   - GitHub 연동: repository_dispatch (데이터 변경 시 자동 빌드)
 *
 * Script Properties 필수 설정:
 *   - ADMIN_PASSWORD: 관리자 패널 비밀번호
 *   - GH_TOKEN: GitHub Personal Access Token (repo scope)
 *   - GH_REPO: communications-ct/ctkorean
 *
 * Google Drive 폴더 ID:
 *   - 공지사항 이미지: 1kxntITty41lImTQs8nw_ddT2OSU34urb
 *   - 앨범: 1TCbyyWEBZr3Tifid8yhqMg7F-FbQkX3X
 *   - 주보: 1rkKcIU165hbu-ovgbjVKKKijAZI9LXpq
 */

// =============================================================================
// Configuration
// =============================================================================

var DRIVE_FOLDERS = {
  ANNOUNCEMENTS_IMAGES: '1kxntITty41lImTQs8nw_ddT2OSU34urb',
  ALBUMS: '1TCbyyWEBZr3Tifid8yhqMg7F-FbQkX3X',
  BULLETINS: '1rkKcIU165hbu-ovgbjVKKKijAZI9LXpq'
};

var SHEET_PREFIX = '공지사항';
var MAX_ROWS_PER_SHEET = 10000;

// =============================================================================
// Web App Entry Points
// =============================================================================

/**
 * GET handler — Public API or Admin Panel
 */
function doGet(e) {
  var params = e.parameter || {};

  // Admin panel
  if (params.mode === 'admin') {
    return HtmlService
      .createHtmlOutputFromFile('gas-admin-panel')
      .setTitle('성당 관리자 패널')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY);
  }

  // Public API (기존 호환)
  var type = params.type || '';
  var data;

  switch (type) {
    case 'ann':
      data = getAnnouncements_();
      break;
    case 'bulletin':
      data = getBulletins_();
      break;
    case 'albums':
      data = getAlbums_();
      break;
    default:
      data = { error: 'Unknown type. Use ?type=ann|bulletin|albums or ?mode=admin' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST handler — Admin CRUD operations
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var password = payload.password;

    // Authenticate
    if (!verifyPassword_(password)) {
      return jsonResponse_({ success: false, error: '비밀번호가 올바르지 않습니다.' });
    }

    var result;
    switch (action) {
      case 'login':
        result = { success: true };
        break;
      case 'list':
        result = { success: true, data: getAnnouncements_() };
        break;
      case 'create':
        result = createPost_(payload);
        break;
      case 'update':
        result = updatePost_(payload);
        break;
      case 'delete':
        result = deletePost_(payload);
        break;
      case 'uploadImage':
        result = uploadImage_(payload);
        break;
      default:
        result = { success: false, error: '알 수 없는 action: ' + action };
    }

    // Trigger GitHub rebuild on data change
    if (result.success && ['create', 'update', 'delete'].indexOf(action) !== -1) {
      try { checkAndDispatch_(); } catch (err) {
        Logger.log('GitHub dispatch failed: ' + err.message);
      }
    }

    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({ success: false, error: err.message });
  }
}

// =============================================================================
// Authentication
// =============================================================================

function verifyPassword_(password) {
  var stored = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!stored) {
    Logger.log('WARNING: ADMIN_PASSWORD not set in Script Properties');
    return false;
  }
  return password === stored;
}

// =============================================================================
// Public Data Endpoints
// =============================================================================

/**
 * 공지사항 — 모든 공지사항 시트에서 읽기
 */
function getAnnouncements_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var all = [];

  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name.indexOf(SHEET_PREFIX) === 0) {
      var rows = readAnnouncementSheet_(sheets[i]);
      all = all.concat(rows);
    }
  }

  // Sort by date descending
  all.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  return all;
}

/**
 * 주보 — Drive 폴더 기반
 */
function getBulletins_() {
  var folder = DriveApp.getFolderById(DRIVE_FOLDERS.BULLETINS);
  var files = folder.getFiles();
  var bulletins = [];

  while (files.hasNext()) {
    var file = files.next();
    var name = file.getName();
    var match = name.match(/^(\d{4}[-.]?\d{2}[-.]?\d{2})/);
    var dateStr = match ? match[1].replace(/\./g, '-') : file.getDateCreated().toISOString().slice(0, 10);

    bulletins.push({
      date: dateStr,
      title: name.replace(/\.\w+$/, ''),
      type: file.getMimeType().indexOf('pdf') !== -1 ? 'pdf' : 'image',
      previewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      fileUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view'
    });
  }

  bulletins.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });

  return bulletins;
}

/**
 * 앨범 — Drive 폴더 스캔
 */
function getAlbums_() {
  var parentFolder = DriveApp.getFolderById(DRIVE_FOLDERS.ALBUMS);
  var subFolders = parentFolder.getFolders();
  var albums = [];

  while (subFolders.hasNext()) {
    var folder = subFolders.next();
    var files = folder.getFiles();
    var thumbUrl = '';

    // Use first image as thumbnail
    while (files.hasNext()) {
      var file = files.next();
      if (file.getMimeType().indexOf('image') !== -1) {
        thumbUrl = 'https://drive.google.com/file/d/' + file.getId() + '/view';
        break;
      }
    }

    var name = folder.getName();
    var match = name.match(/^(\d{4}[-.]?\d{2}[-.]?\d{2})/);
    var dateStr = match ? match[1].replace(/\./g, '-') : folder.getDateCreated().toISOString().slice(0, 10);

    albums.push({
      date: dateStr,
      title: name,
      albumUrl: 'https://drive.google.com/drive/folders/' + folder.getId(),
      thumbUrl: thumbUrl
    });
  }

  albums.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });

  return albums;
}

// =============================================================================
// Sheet Helpers
// =============================================================================

/**
 * Read announcements from a single sheet.
 * Expected columns: A=date, B=title, C=body, D=link, E=urgent, F=images (JSON array of file IDs)
 */
function readAnnouncementSheet_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // header only

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue; // skip empty rows

    var dateVal = row[0];
    var dateStr;
    if (dateVal instanceof Date) {
      dateStr = dateVal.toISOString();
    } else {
      dateStr = String(dateVal);
    }

    var images = [];
    if (row[5]) {
      try {
        images = JSON.parse(row[5]);
      } catch (_e) {
        // Single ID as string
        if (typeof row[5] === 'string' && row[5].trim()) {
          images = [row[5].trim()];
        }
      }
    }

    rows.push({
      date: dateStr,
      title: String(row[1] || ''),
      body: String(row[2] || ''),
      link: String(row[3] || ''),
      urgent: row[4] || '',
      images: images.map(function(id) {
        return 'https://drive.google.com/file/d/' + id + '/view';
      })
    });
  }

  return rows;
}

/**
 * Get the active announcement sheet (most recent, under 10K rows).
 * Creates a new sheet if needed.
 */
function getActiveAnnouncementSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  // Find all announcement sheets, sorted by suffix number
  var annSheets = [];
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name === SHEET_PREFIX) {
      annSheets.push({ sheet: sheets[i], num: 0 });
    } else {
      var m = name.match(new RegExp('^' + SHEET_PREFIX + '_(\\d+)$'));
      if (m) {
        annSheets.push({ sheet: sheets[i], num: parseInt(m[1], 10) });
      }
    }
  }

  if (annSheets.length === 0) {
    // Create first sheet
    var newSheet = ss.insertSheet(SHEET_PREFIX);
    newSheet.appendRow(['date', 'title', 'body', 'link', 'urgent', 'images']);
    return newSheet;
  }

  // Sort by number descending — use the highest-numbered sheet
  annSheets.sort(function(a, b) { return b.num - a.num; });
  var latest = annSheets[0];

  if (latest.sheet.getLastRow() >= MAX_ROWS_PER_SHEET) {
    var newNum = latest.num + 1;
    var newName = SHEET_PREFIX + '_' + String(newNum).padStart(3, '0');
    var newSheet = ss.insertSheet(newName);
    newSheet.appendRow(['date', 'title', 'body', 'link', 'urgent', 'images']);
    Logger.log('Created new sheet: ' + newName);
    return newSheet;
  }

  return latest.sheet;
}

/**
 * Find a row by matching date + title across all announcement sheets.
 * Returns { sheet, rowIndex } or null.
 */
function findAnnouncementRow_(date, title) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name.indexOf(SHEET_PREFIX) !== 0) continue;

    var data = sheets[i].getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      var rowDate = data[r][0];
      var rowDateStr;
      if (rowDate instanceof Date) {
        rowDateStr = rowDate.toISOString().slice(0, 10);
      } else {
        rowDateStr = String(rowDate).slice(0, 10);
      }

      var targetDate = String(date).slice(0, 10);
      if (rowDateStr === targetDate && String(data[r][1]) === String(title)) {
        return { sheet: sheets[i], rowIndex: r + 1 }; // 1-based for Sheet API
      }
    }
  }

  return null;
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Create a new announcement
 */
function createPost_(payload) {
  var sheet = getActiveAnnouncementSheet_();
  var images = payload.images || [];

  sheet.appendRow([
    new Date(payload.date),
    payload.title,
    payload.body || '',
    payload.link || '',
    payload.urgent ? 1 : '',
    images.length > 0 ? JSON.stringify(images) : ''
  ]);

  return { success: true, message: '공지사항이 등록되었습니다.' };
}

/**
 * Update an existing announcement
 */
function updatePost_(payload) {
  var found = findAnnouncementRow_(payload.originalDate, payload.originalTitle);
  if (!found) {
    return { success: false, error: '해당 공지사항을 찾을 수 없습니다.' };
  }

  var images = payload.images || [];
  var row = [
    new Date(payload.date),
    payload.title,
    payload.body || '',
    payload.link || '',
    payload.urgent ? 1 : '',
    images.length > 0 ? JSON.stringify(images) : ''
  ];

  var range = found.sheet.getRange(found.rowIndex, 1, 1, row.length);
  range.setValues([row]);

  return { success: true, message: '공지사항이 수정되었습니다.' };
}

/**
 * Delete an announcement
 */
function deletePost_(payload) {
  var found = findAnnouncementRow_(payload.date, payload.title);
  if (!found) {
    return { success: false, error: '해당 공지사항을 찾을 수 없습니다.' };
  }

  found.sheet.deleteRow(found.rowIndex);
  return { success: true, message: '공지사항이 삭제되었습니다.' };
}

/**
 * Upload an image to the announcements Drive folder.
 * Expects payload.fileName and payload.data (base64 encoded).
 * Returns the file ID.
 */
function uploadImage_(payload) {
  var folder = DriveApp.getFolderById(DRIVE_FOLDERS.ANNOUNCEMENTS_IMAGES);
  var blob = Utilities.newBlob(
    Utilities.base64Decode(payload.data),
    payload.mimeType || 'image/jpeg',
    payload.fileName || 'image.jpg'
  );

  var file = folder.createFile(blob);
  // Set file to "anyone with link can view"
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    success: true,
    fileId: file.getId(),
    message: '이미지가 업로드되었습니다.'
  };
}

// =============================================================================
// GitHub Integration (from gas-trigger-example.js)
// =============================================================================

/**
 * Check for data changes and trigger GitHub repository_dispatch.
 * Called automatically after CRUD operations and via time-driven trigger.
 */
function checkAndDispatch_() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GH_TOKEN');
  var repo = props.getProperty('GH_REPO') || 'communications-ct/ctkorean';

  if (!token) {
    Logger.log('GH_TOKEN not set — skipping dispatch');
    return;
  }

  var currentHash = computeDataHash_();
  var lastHash = props.getProperty('LAST_DATA_HASH') || '';

  if (currentHash === lastHash) {
    Logger.log('No data changes detected');
    return;
  }

  var url = 'https://api.github.com/repos/' + repo + '/dispatches';
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: JSON.stringify({
      event_type: 'gas-data-changed',
      client_payload: {
        timestamp: new Date().toISOString(),
        hash: currentHash
      }
    }),
    muteHttpExceptions: true
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
 * Compute MD5 hash of all announcement data for change detection.
 */
function computeDataHash_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var allData = [];

  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name.indexOf(SHEET_PREFIX) === 0) {
      allData.push(sheets[i].getDataRange().getValues());
    }
  }

  var str = JSON.stringify(allData);
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str);
  return hash.map(function(b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}

// =============================================================================
// Time-Driven Trigger (public function for GAS trigger setup)
// =============================================================================

/**
 * Set up this function as a time-driven trigger (every 5 minutes).
 * GAS > Triggers > Add Trigger > checkAndDispatch > Time-driven > Minutes > 5
 */
// eslint-disable-next-line no-unused-vars
function checkAndDispatch() {
  checkAndDispatch_();
}

// =============================================================================
// HTML Service Client-to-Server Bridge
// =============================================================================

/**
 * Called from the admin panel via google.script.run.processAdminRequest(body).
 * This is required because HTML Service cannot call doPost() directly.
 */
function processAdminRequest(bodyString) {
  var payload = JSON.parse(bodyString);
  var password = payload.password;

  if (!verifyPassword_(password)) {
    return { success: false, error: '비밀번호가 올바르지 않습니다.' };
  }

  var action = payload.action;
  var result;

  switch (action) {
    case 'login':
      result = { success: true };
      break;
    case 'list':
      result = { success: true, data: getAnnouncements_() };
      break;
    case 'create':
      result = createPost_(payload);
      break;
    case 'update':
      result = updatePost_(payload);
      break;
    case 'delete':
      result = deletePost_(payload);
      break;
    case 'uploadImage':
      result = uploadImage_(payload);
      break;
    default:
      result = { success: false, error: '알 수 없는 action: ' + action };
  }

  // Trigger GitHub rebuild on data change
  if (result.success && ['create', 'update', 'delete'].indexOf(action) !== -1) {
    try { checkAndDispatch_(); } catch (err) {
      Logger.log('GitHub dispatch failed: ' + err.message);
    }
  }

  return result;
}

// =============================================================================
// Utility
// =============================================================================

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
