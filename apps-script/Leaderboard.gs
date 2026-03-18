const SETTINGS = {
  // Paste your private Google Sheet ID here.
  GOOGLE_SHEET_ID: '1ToFEmROeg1Fgshezvh2Yb8rc5MjTUED5mW6P661CTdg',
  PUBLIC_SHEET: 'public',
  PRIVATE_SHEET: 'private',
  SUSPECT_SHEET: 'suspect',
  AUTO_PROMOTE_CLEAN: true,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
  MAX_NAME_LENGTH: 10,
  MAX_SCORE_HARD: 999999,
  MAX_CHAIN_SOFT: 99,
  MAX_HERD_SOFT: 99,
  MIN_DURATION_MS: 8000,
  MAX_DURATION_MS: 24 * 60 * 60 * 1000,
  TIMESTAMP_WARN_MS: 15 * 60 * 1000,
  TIMESTAMP_REJECT_MS: 7 * 24 * 60 * 60 * 1000,
  MIN_MS_PER_POINT: 35,
  RATE_LIMIT_WINDOW_SEC: 10 * 60,
  RATE_LIMIT_BURST: 6,
  RATE_LIMIT_PREFIX: 'angry-wolves-score'
}

const BLOCKED_NAME_PATTERNS = [
  /F+U*C+K+(?:Y+O+U+)?/,
  /S+H+I+T+/,
  /B+I+T+C+H+/,
  /A+S+S+H+O+L+E?/,
  /M+O+T+H+E+R*F+U*C+K+E*R*/,
  /D+I+C+K+/,
  /C+O+C+K+/,
  /P+U+S+S+Y+/,
  /P+E+N+I+S+/,
  /C+U+N+T+/,
  /J+I+Z+Z+/,
  /C+U+M+/,
  /T+I+T+S?/,
  /N+I+G+G+E*R+/,
  /F+A+G+G*O*T+/
]

const PRIVATE_HEADERS = [
  'submitted_at',
  'status',
  'player_name',
  'score',
  'game_mode',
  'mission_title',
  'best_chain',
  'biggest_herd_count',
  'biggest_herd_animal',
  'herds_cleared',
  'pace',
  'duration_ms',
  'nonce',
  'client_timestamp',
  'version',
  'suspicious',
  'reason',
  'promoted'
]

const PUBLIC_HEADERS = [
  'approved_at',
  'player_name',
  'score',
  'game_mode',
  'mission_title',
  'best_chain',
  'biggest_herd_count',
  'biggest_herd_animal',
  'herds_cleared',
  'pace',
  'duration_ms',
  'version',
  'source_nonce'
]

const SUSPECT_HEADERS = [
  'flagged_at',
  'status',
  'player_name',
  'score',
  'game_mode',
  'mission_title',
  'best_chain',
  'biggest_herd_count',
  'biggest_herd_animal',
  'herds_cleared',
  'pace',
  'duration_ms',
  'nonce',
  'client_timestamp',
  'version',
  'reason'
]

function doGet(e) {
  try {
    const limit = clampLimit(e && e.parameter && e.parameter.limit)
    const requestedMode = sanitizeMode(e && e.parameter && e.parameter.gameMode)
    const rows = getPublicLeaderboardRows(limit, requestedMode)
    return jsonResponse({
      ok: true,
      entries: rows
    })
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : 'Could not load leaderboard.'
    })
  }
}

function doPost(e) {
  try {
    const payload = parsePayload(e)
    if (!payload) {
      return jsonResponse({
        ok: false,
        status: 'rejected',
        reasons: ['missing_payload'],
        message: 'Missing JSON payload.'
      })
    }

    const submission = sanitizeSubmission(payload)
    const classification = classifySubmission(submission)

    if (classification.writeable) {
      writePrivateRow(submission, classification)
      if (classification.status !== 'accepted') {
        writeSuspectRow(submission, classification)
      } else if (SETTINGS.AUTO_PROMOTE_CLEAN) {
        writePublicRow(submission)
      }
    }

    return jsonResponse({
      ok: classification.status !== 'rejected',
      status: classification.status,
      suspicious: classification.status !== 'accepted',
      promoted: classification.status === 'accepted' && SETTINGS.AUTO_PROMOTE_CLEAN,
      reasons: classification.reasons,
      message: classificationMessage_(classification)
    })
  } catch (err) {
    return jsonResponse({
      ok: false,
      status: 'rejected',
      reasons: ['server_error'],
      message: err && err.message ? err.message : 'Unexpected leaderboard error.'
    })
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SETTINGS.GOOGLE_SHEET_ID)
}

function getSheet_(name, headers) {
  const spreadsheet = getSpreadsheet_()
  let sheet = spreadsheet.getSheetByName(name)
  if (!sheet) sheet = spreadsheet.insertSheet(name)
  ensureHeaders_(sheet, headers)
  return sheet
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() > 0) return
  sheet.appendRow(headers)
  sheet.setFrozenRows(1)
}

function appendRow_(sheet, headers, values) {
  const row = headers.map(function(header) {
    return Object.prototype.hasOwnProperty.call(values, header) ? values[header] : ''
  })
  sheet.appendRow(row)
}

function parsePayload(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : ''
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (err) {
    return null
  }
}

function sanitizeSubmission(payload) {
  return {
    submittedAt: isoNow_(),
    playerName: sanitizePlayerName(payload.playerName || payload.player_name),
    score: toInt_(payload.score),
    gameMode: sanitizeMode(payload.gameMode || payload.game_mode || 'standard'),
    missionTitle: sanitizeText_(payload.missionTitle || payload.mission_title, 80),
    bestChain: toInt_(payload.bestChain || payload.best_chain),
    biggestHerdCount: toInt_(payload.biggestHerdCount || payload.biggest_herd_count),
    biggestHerdAnimal: sanitizeText_(payload.biggestHerdAnimal || payload.biggest_herd_animal, 8),
    herdsCleared: toInt_(payload.herdsCleared || payload.herds_cleared),
    pace: toInt_(payload.pace || payload.level),
    durationMs: toInt_(payload.durationMs || payload.duration_ms),
    nonce: sanitizeNonce_(payload.nonce),
    clientTimestamp: toInt_(payload.clientTimestamp || payload.client_timestamp),
    version: sanitizeText_(payload.version, 24)
  }
}

function sanitizePlayerName(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, SETTINGS.MAX_NAME_LENGTH)
}

function normalizeHandleForModeration_(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/3/g, 'E')
    .replace(/4/g, 'A')
    .replace(/5/g, 'S')
    .replace(/7/g, 'T')
    .replace(/[^A-Z0-9]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1')
}

function blockedNameReason_(playerName) {
  if (!playerName) return ''
  const normalized = normalizeHandleForModeration_(playerName)
  const isBlocked = BLOCKED_NAME_PATTERNS.some(function(pattern) {
    return pattern.test(normalized)
  })
  return isBlocked ? 'blocked_name' : ''
}

function classificationMessage_(classification) {
  if (!classification || !classification.reasons) return ''
  if (classification.reasons.indexOf('blocked_name') !== -1) {
    return 'That player name is not allowed.'
  }
  return ''
}

function sanitizeMode(value) {
  const cleaned = String(value || 'standard')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 24)
  return cleaned || 'standard'
}

function sanitizeText_(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength)
}

function sanitizeNonce_(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 128)
}

function toInt_(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}

function classifySubmission(submission) {
  const rejectReasons = []
  const suspectReasons = []

  if (!submission.playerName) rejectReasons.push('invalid_name')
  const blockedNameReason = blockedNameReason_(submission.playerName)
  if (blockedNameReason) rejectReasons.push(blockedNameReason)
  if (!submission.nonce) rejectReasons.push('invalid_nonce')
  if (!Number.isFinite(submission.score) || submission.score < 0) rejectReasons.push('invalid_score')
  if (submission.score > SETTINGS.MAX_SCORE_HARD) rejectReasons.push('score_hard_cap')

  if (submission.nonce && nonceExists_(submission.nonce)) {
    rejectReasons.push('replay_nonce')
  }

  const timestampAssessment = assessTimestamp_(submission.clientTimestamp)
  rejectReasons.push.apply(rejectReasons, timestampAssessment.rejectReasons)
  suspectReasons.push.apply(suspectReasons, timestampAssessment.suspectReasons)

  const scoreAssessment = assessScorePlausibility_(submission)
  rejectReasons.push.apply(rejectReasons, scoreAssessment.rejectReasons)
  suspectReasons.push.apply(suspectReasons, scoreAssessment.suspectReasons)

  const rateReason = noteRateLimit_(submission.playerName)
  if (rateReason) suspectReasons.push(rateReason)

  const uniqueRejectReasons = unique_(rejectReasons)
  const uniqueSuspectReasons = unique_(suspectReasons)
  const allReasons = unique_(uniqueRejectReasons.concat(uniqueSuspectReasons))

  if (uniqueRejectReasons.length) {
    return {
      status: 'rejected',
      reasons: allReasons,
      suspicious: true,
      promoted: false,
      writeable: true
    }
  }

  if (uniqueSuspectReasons.length) {
    return {
      status: 'suspect',
      reasons: uniqueSuspectReasons,
      suspicious: true,
      promoted: false,
      writeable: true
    }
  }

  return {
    status: 'accepted',
    reasons: [],
    suspicious: false,
    promoted: SETTINGS.AUTO_PROMOTE_CLEAN,
    writeable: true
  }
}

function assessTimestamp_(clientTimestamp) {
  const rejectReasons = []
  const suspectReasons = []
  if (!clientTimestamp) {
    suspectReasons.push('missing_client_timestamp')
    return { rejectReasons: rejectReasons, suspectReasons: suspectReasons }
  }
  const skew = Math.abs(Date.now() - clientTimestamp)
  if (skew > SETTINGS.TIMESTAMP_REJECT_MS) {
    rejectReasons.push('timestamp_out_of_range')
  } else if (skew > SETTINGS.TIMESTAMP_WARN_MS) {
    suspectReasons.push('timestamp_stale')
  }
  return { rejectReasons: rejectReasons, suspectReasons: suspectReasons }
}

function assessScorePlausibility_(submission) {
  const rejectReasons = []
  const suspectReasons = []
  if (!submission.durationMs) {
    suspectReasons.push('missing_duration')
    return { rejectReasons: rejectReasons, suspectReasons: suspectReasons }
  }
  if (submission.durationMs < 0) rejectReasons.push('invalid_duration')
  if (submission.durationMs > SETTINGS.MAX_DURATION_MS) suspectReasons.push('duration_unusually_long')
  if (submission.durationMs < SETTINGS.MIN_DURATION_MS && submission.score > 0) {
    suspectReasons.push('duration_too_short')
  }
  if (submission.score > 0 && submission.durationMs < (submission.score * SETTINGS.MIN_MS_PER_POINT)) {
    suspectReasons.push('score_pace_fast')
  }
  if (submission.bestChain > SETTINGS.MAX_CHAIN_SOFT) suspectReasons.push('chain_unusually_high')
  if (submission.biggestHerdCount > SETTINGS.MAX_HERD_SOFT) suspectReasons.push('herd_unusually_high')
  return { rejectReasons: rejectReasons, suspectReasons: suspectReasons }
}

function noteRateLimit_(playerName) {
  const cache = CacheService.getScriptCache()
  const key = SETTINGS.RATE_LIMIT_PREFIX + ':' + (playerName || 'ANON')
  const current = Number(cache.get(key) || 0) || 0
  const next = current + 1
  cache.put(key, String(next), SETTINGS.RATE_LIMIT_WINDOW_SEC)
  return next > SETTINGS.RATE_LIMIT_BURST ? 'rate_limited' : ''
}

function nonceExists_(nonce) {
  const sheet = getSheet_(SETTINGS.PRIVATE_SHEET, PRIVATE_HEADERS)
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return false
  const nonceColumn = PRIVATE_HEADERS.indexOf('nonce') + 1
  return !!sheet
    .getRange(2, nonceColumn, lastRow - 1, 1)
    .createTextFinder(nonce)
    .matchEntireCell(true)
    .findNext()
}

function writePrivateRow(submission, classification) {
  const sheet = getSheet_(SETTINGS.PRIVATE_SHEET, PRIVATE_HEADERS)
  appendRow_(sheet, PRIVATE_HEADERS, {
    submitted_at: submission.submittedAt,
    status: classification.status,
    player_name: submission.playerName,
    score: submission.score,
    game_mode: submission.gameMode,
    mission_title: submission.missionTitle,
    best_chain: submission.bestChain,
    biggest_herd_count: submission.biggestHerdCount,
    biggest_herd_animal: submission.biggestHerdAnimal,
    herds_cleared: submission.herdsCleared,
    pace: submission.pace,
    duration_ms: submission.durationMs,
    nonce: submission.nonce,
    client_timestamp: submission.clientTimestamp,
    version: submission.version,
    suspicious: classification.suspicious,
    reason: classification.reasons.join(','),
    promoted: classification.promoted
  })
}

function writePublicRow(submission) {
  const sheet = getSheet_(SETTINGS.PUBLIC_SHEET, PUBLIC_HEADERS)
  appendRow_(sheet, PUBLIC_HEADERS, {
    approved_at: isoNow_(),
    player_name: submission.playerName,
    score: submission.score,
    game_mode: submission.gameMode,
    mission_title: submission.missionTitle,
    best_chain: submission.bestChain,
    biggest_herd_count: submission.biggestHerdCount,
    biggest_herd_animal: submission.biggestHerdAnimal,
    herds_cleared: submission.herdsCleared,
    pace: submission.pace,
    duration_ms: submission.durationMs,
    version: submission.version,
    source_nonce: submission.nonce
  })
}

function writeSuspectRow(submission, classification) {
  const sheet = getSheet_(SETTINGS.SUSPECT_SHEET, SUSPECT_HEADERS)
  appendRow_(sheet, SUSPECT_HEADERS, {
    flagged_at: isoNow_(),
    status: classification.status,
    player_name: submission.playerName,
    score: submission.score,
    game_mode: submission.gameMode,
    mission_title: submission.missionTitle,
    best_chain: submission.bestChain,
    biggest_herd_count: submission.biggestHerdCount,
    biggest_herd_animal: submission.biggestHerdAnimal,
    herds_cleared: submission.herdsCleared,
    pace: submission.pace,
    duration_ms: submission.durationMs,
    nonce: submission.nonce,
    client_timestamp: submission.clientTimestamp,
    version: submission.version,
    reason: classification.reasons.join(',')
  })
}

function getPublicLeaderboardRows(limit, requestedMode) {
  const sheet = getSheet_(SETTINGS.PUBLIC_SHEET, PUBLIC_HEADERS)
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return []

  const rows = sheet.getRange(2, 1, lastRow - 1, PUBLIC_HEADERS.length).getValues().map(function(row) {
    return rowToObject_(PUBLIC_HEADERS, row)
  }).filter(function(row) {
    return !requestedMode || row.game_mode === requestedMode
  })

  rows.sort(function(a, b) {
    return Number(b.score || 0) - Number(a.score || 0) || String(a.approved_at || '').localeCompare(String(b.approved_at || ''))
  })

  return rows.slice(0, limit).map(function(row, index) {
    return {
      rank: index + 1,
      playerName: row.player_name,
      score: Number(row.score || 0),
      gameMode: row.game_mode,
      missionTitle: row.mission_title,
      bestChain: Number(row.best_chain || 0),
      biggestHerdCount: Number(row.biggest_herd_count || 0),
      biggestHerdAnimal: row.biggest_herd_animal,
      herdsCleared: Number(row.herds_cleared || 0),
      pace: Number(row.pace || 0),
      durationMs: Number(row.duration_ms || 0),
      version: row.version
    }
  })
}

function rowToObject_(headers, row) {
  const out = {}
  headers.forEach(function(header, index) {
    out[header] = row[index]
  })
  return out
}

function clampLimit(value) {
  const parsed = Number(value) || SETTINGS.DEFAULT_LIMIT
  return Math.max(1, Math.min(SETTINGS.MAX_LIMIT, Math.round(parsed)))
}

function isoNow_() {
  return new Date().toISOString()
}

function unique_(values) {
  return Array.from(new Set((values || []).filter(Boolean)))
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}
