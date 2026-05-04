# Last Line

A mobile-first daily pattern puzzle web app.

## Setup

```bash
npm install
npm run dev
```

Then open the local Vite URL.

## Gameplay

- One shared daily puzzle seed based on local `YYYY-MM-DD`.
- 3 rounds per day.
- Choose one final line from A/B/C/D.
- Explanations appear after each answer.
- Streak increases only for perfect 3/3 completion days.

## Storage

Uses `localStorage` key `last-line-state-v1` for:
- daily completion lockout
- streak and aggregate stats
- recent history

## Dev mode

Use `?dev=1` to show **Dev Reset Today** button and replay/reset today.

## Mock leaderboard path

Current result screen logs a payload to console from the "Submit to Leaderboard (mock)" button.
This is the integration point for future Google Apps Script POST submission.

## Deterministic seed testing

In console:

```js
LastLineDebug.getTodayKey()
LastLineDebug.seededIndices('2026-05-04')
LastLineDebug.seededIndices('2026-05-04') // same output
```

## Screens

1. Start screen: daily card, start button, how-to.
2. Round screen: prompt, 4 touch choices, timer, submit, explanation.
3. Result screen: total score, time, streak, share, mock leaderboard.
4. Stats modal: played, perfect days, streak, best time.
5. How to play modal: concise rules.
