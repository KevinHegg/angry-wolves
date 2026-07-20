# Angry Wolves: Moonlit Rescue

A mobile-first falling-block rescue puzzle. Make **seven matching animals touch** to get a herd safely home before the wolf clock fills.

## Play

Open `index.html` through any static web server, or visit the GitHub Pages deployment. The game has no build step.

- Tap the field to rotate. Swipe left/right to steer and swipe down to drop.
- Keyboard: arrows or A/D, `X`/`Z` to rotate, `Space` to drop, `C` to swap with Next.
- Clear Calls to choose a Lantern, Shepherd's Whistle, or Water Bucket.

## Development

```sh
npm test
```

Useful deterministic review links:

- `?seed=review-1`
- `?night=full-moon`
- `?debugCall=wolf-warning`
- `?mute=1`

The current game is static browser-native ES modules. `src/engine.js` is deliberately DOM-free so rescue rules, threats, tools, and seeded replays are testable. `src/content.js` contains the five authored Nights. The existing Apps Script leaderboard endpoint remains compatible and receives `game_mode=night-rescue-v1`.

## Rollback

The original V2 prototype is preserved on the `firstattempt` branch.
