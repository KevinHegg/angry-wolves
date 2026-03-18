# Angry Wolves Leaderboard Setup

This game uses a lightweight trusted flow:

`GitHub Pages game -> Google Apps Script web app -> private Google Sheet`

The browser never writes directly to the sheet, and no sheet secrets live in client-side code.

## 1. Google Sheet Tabs

Use the existing three tabs exactly as named:

- `public`
- `private`
- `suspect`

The Apps Script will initialize header rows automatically if a tab is empty.

## 2. Column Layout

The original suggested columns were extended slightly so you can tune missions later and inspect more context around runs.

Added fields:

- `status`
- `mission_title`
- `best_chain`
- `biggest_herd_count`
- `biggest_herd_animal`
- `herds_cleared`
- `pace`

### `private`

Use these columns, in this order:

1. `submitted_at`
2. `status`
3. `player_name`
4. `score`
5. `game_mode`
6. `mission_title`
7. `best_chain`
8. `biggest_herd_count`
9. `biggest_herd_animal`
10. `herds_cleared`
11. `pace`
12. `duration_ms`
13. `nonce`
14. `client_timestamp`
15. `version`
16. `suspicious`
17. `reason`
18. `promoted`

### `public`

Use these columns, in this order:

1. `approved_at`
2. `player_name`
3. `score`
4. `game_mode`
5. `mission_title`
6. `best_chain`
7. `biggest_herd_count`
8. `biggest_herd_animal`
9. `herds_cleared`
10. `pace`
11. `duration_ms`
12. `version`
13. `source_nonce`

### `suspect`

Use these columns, in this order:

1. `flagged_at`
2. `status`
3. `player_name`
4. `score`
5. `game_mode`
6. `mission_title`
7. `best_chain`
8. `biggest_herd_count`
9. `biggest_herd_animal`
10. `herds_cleared`
11. `pace`
12. `duration_ms`
13. `nonce`
14. `client_timestamp`
15. `version`
16. `reason`

## 3. Apps Script File

The backend source lives in:

- [apps-script/Leaderboard.gs](/Users/kevinhegg/Documents/angry-wolves/apps-script/Leaderboard.gs)

## 4. Paste The Sheet ID

Open your Google Sheet and copy the spreadsheet ID from the URL:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

Paste that ID into:

- [apps-script/Leaderboard.gs](/Users/kevinhegg/Documents/angry-wolves/apps-script/Leaderboard.gs)

Replace:

```javascript
GOOGLE_SHEET_ID: '1ToFEmROeg1Fgshezvh2Yb8rc5MjTUED5mW6P661CTdg'
```

## 5. Create The Apps Script Project

1. Open [script.new](https://script.new).
2. Replace the default code with the contents of `apps-script/Leaderboard.gs`.
3. Save the project.

## 6. Deploy The Apps Script Web App

1. In Apps Script, click `Deploy`.
2. Choose `New deployment`.
3. Select `Web app`.
4. Set `Execute as` to `Me`.
5. Set access to `Anyone`.
6. Deploy.
7. Copy the web app URL.

## 7. Paste The Deployment URL Into The Game Repo

Open:

- [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js)

Find:

```javascript
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAgQNERb-xsiBTOT7PqjcV1afxD4GGASoop3MCFMh93XAYkk8RXqodP324iW0HpsLHPQ/exec"
```

Replace it with your deployed Apps Script web app URL.

## 8. Public / Private / Suspect Flow

### POST submission

The game sends:

- `playerName`
- `score`
- `gameMode`
- `missionTitle`
- `bestChain`
- `biggestHerdCount`
- `biggestHerdAnimal`
- `herdsCleared`
- `pace`
- `durationMs`
- `nonce`
- `clientTimestamp`
- `version`

The Apps Script then:

1. sanitizes the payload
2. checks name, score, duration, timestamp freshness, nonce reuse, and rate-limit hints
3. writes parsed submissions to `private`
4. writes suspicious or rejected parsed submissions to `suspect`
5. auto-promotes clean submissions to `public`
6. serves leaderboard reads from `public` only

### GET leaderboard

The game reads approved entries only from `public`.

Supported query params:

- `limit`
- `gameMode`

## 9. Anti-Abuse Notes

This setup is intentionally lightweight, not perfect.

Implemented friction:

- timestamp freshness checks
- nonce replay checks
- score hard cap
- duration plausibility checks
- suspicious classification instead of always rejecting
- lightweight server-side rate limit via Apps Script cache

Important:

- client-side payloads are still user-controlled
- no client checksum should be treated as real security
- suspicious runs are separated for review instead of silently trusted

## 10. Manual Moderation Later

Right now clean runs auto-promote because this constant is `true`:

```javascript
AUTO_PROMOTE_CLEAN: true
```

To switch to manual moderation later:

1. change `AUTO_PROMOTE_CLEAN` to `false`
2. leave `private` writes enabled
3. review rows from `private`
4. manually copy approved rows into `public`

No client code changes are required for that switch.

## 11. Client Notes

The game uses a simple `text/plain` POST body containing JSON when submitting scores. That keeps the request lightweight and avoids unnecessary browser preflight complexity for a static GitHub Pages client.
