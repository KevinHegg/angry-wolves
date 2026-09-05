# Rescue 2.0 — wolf pressure, Pip's rest, Safari, and scores

## Rules and scoring

- Exactly 3 animals: wolves approach by **two** steps.
- Exactly 4: one step closer. 5–7: stay put. 8+: one step back.
- Pip's final rest bonus: 0 / 100 / 250 / 500 for 0 / 1 / 2 / 3 rested fields.
- Bark usage survives a retry. Retrying restores a playable bark but does not erase the fact that Pip worked in that field. Rest bonuses pay once at the final victory.
- Biggest herd records its count and animal. Failed-attempt herds and points do not enter the final score; successful prior chapters do.
- A new local best-score key (`aw-rescue-best-v2`) and leaderboard category (`rescue-v2`) keep the revised economy separate.

The proposed rest bonuses were retained after 1,000 seeded whole-adventure simulations per policy. With goal-aware herd selection and an emergency bark at two steps, 651 adventures finished, with median base score 2,014 and mean rest bonus 317. Never barking finished 305, with median base 1,988 plus the promised 500 bonus. These simulations do not retry failed fields. This makes the maximum bonus about 25% of a typical successful base score, rewarding the harder choice without replacing herd scoring. Actual player experience may differ.

## Safari fixes

The game sizes its square board from the remaining **visible** viewport after reserving header, goals, wolf track, feedback, and both action buttons. Resize and visual-viewport scroll events update that measurement. Safe-area insets are included. Dialogs also follow the visible viewport when the keyboard appears; the initials input is large enough to avoid automatic input zoom. See [MDN's VisualViewport reference](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) for the layout versus visual viewport distinction.

Chapter completion now uses one transition screen with one gate action. There is no close/reopen cycle during the same tap. Touch-release activation is deduplicated against Safari's subsequent synthesized click, with checks for scrolling and stale dialog actions. Mouse and keyboard activation remain supported.

Sound now defaults on unless the player explicitly stored a mute preference, and the mobile control visibly shows 🔊 or 🔇. The output is unlocked on a real gesture, waits for resume before scheduling tones, and is recreated after backgrounding or interruption. Help includes an explicit sound test. The approach addresses the interrupted-context behavior described in [WebKit's issue tracker](https://bugs.webkit.org/show_bug.cgi?id=273511); actual iPhone 17 audio still needs a device check. Phone volume and Silent Mode can affect Web Audio playback.

## Existing sheet and new leaderboard

The deployed Apps Script endpoint already supports the necessary fields and mode filtering, so no new sheet access or backend deployment was required. Existing backend source edits were left untouched.

Player identity is presented as **ABC 🐕**, chosen from ten badges. Because the existing backend accepts alphanumeric names, the sheet stores `ABC0` through `ABC9`; `rescue-services.js` defines the permanent digit-to-emoji map. Do not reorder it. Displayed names are decoded safely. Scores are loaded only for `rescue-v2` and ranked as the top 20 completed adventures.

The payload uses the existing columns for the final score, true elapsed duration, biggest herd count/animal, successful herd count, game version, and a stable per-adventure nonce. The mission-title field describes Pip's rest count and bonus. Existing moderation remains authoritative: a saved-for-review score is not represented as a public ranking. A retry after an uncertain response reuses the same nonce.

One clearly labeled integration row was written and read back under **`rescue-v2-qa`**, a separate category that cannot appear on the player board. It used `TST0`, 30 points, and an `Integration test` description; the server returned accepted/promoted. Production leaderboard GET was also verified from the browser. No fabricated score was posted to the player category.

## Sharing

The results screen generates a 1200×630 PNG with the score, animals rescued, rest bonus, largest herd and its animal illustration, and the public game URL. Generation finishes before the share gesture so Safari can invoke native file sharing within user activation. If file sharing is unavailable, native text sharing is used; save-image and copy-caption options are also available. Sharing is always player initiated.

## Verification

- 24 automated checks: rules, scoring tiers, biggest-herd identity, audio resume/interruption/mute, touch-click deduplication, identity encoding, leaderboard filtering/moderation, and native-share payload/fallback.
- Full browser adventure: 126 animals, 1,864 base points, +250 rest bonus = **2,114**; biggest herd **10 pigs**. This run used Pip and then retried the first field, verifying the bonus cannot be reset by retry.
- Both chapter gates opened with a single click.
- Verified live Sheet QA write/read and browser leaderboard loading; checked three-letter validation and all ten badge choices.
- Share preview loaded at 1200×630 and displayed the correct 2,114 score, 10-pig illustration and public URL.
- The native-share request is covered by payload tests; a social post was not sent, and actual iPhone share-sheet completion was not verified.
- Actual viewport checks: 393×550, 393×650, 430×760, and 375×667. Page height equals viewport height in all four, with no vertical scrolling; action-row bottoms were 511, 611, 721, and 628 px respectively. Small viewports trade board size for always-visible controls. Physical iPhone Safari audio and browser chrome remain the final device acceptance check.
