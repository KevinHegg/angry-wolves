# Hungry Wolf audit and launch plan

September 9, 2026 · implementation v2.34 · baseline v2.33 (`3dd0ed3`)

The game has a coherent core: choose a herd, weigh its effect on the wolf, then whistle. The carried board and three shared Pip barks create decisions across fields. Friends and family returning voluntarily is a useful signal; the next test is whether people outside that group understand it and come back.

This audit preserves the current difficulty and concentrates on reliability, readable feedback and mobile usability. It does not introduce ads, analytics, payments or new game modes.

## Fixed in this release

| Area | Verified problem | Change and evidence |
| --- | --- | --- |
| Mobile dialogs | At a 393×550 viewport, introductory content and the loss panel could put the primary button below the visible area. | Primary actions stay visible while dialog details scroll. The opening and replay buttons were checked in the browser. Changing dialog views resets the inner scroll position. |
| Desktop layout | Just above the compact laptop breakpoint, controls fell below the window. | Put the chapter heading in the story column, lift the playing area and reserve message space. At 1404×913 the board kept its approximately 512px size while Whistle, Pip and Restart game became visible. |
| Returning player | A saved player occupied the full editor, pushing scores down. Letter targets were only 36px high. | Saved players initially appear as a compact initials/badge row. Change player expands the editor; Save player collapses it. Letter controls are at least 44px high. A local browser submission sent the newly saved player correctly. |
| Legacy player data | An old one- or two-letter draft could leave a missing letter and crash the letter selector. | Normalize the editable draft to three letters. A regression test opens an old `AB` profile, changes its third letter and saves it. |
| Submission in progress | A player could change identity while a score request was in flight. A late failure could update a hidden status after returning to results. | Lock identity during submission, restore the correct editing state on failure, and show the error on the visible results screen. Tests cover the delayed request and first-submission failure. |
| Leaderboard refresh | An older, slower response could overwrite a newer board. | Ignore stale responses and reset the score list to its top on a completed refresh. Regression test resolves requests out of order. |
| Pip and dead-board recovery | The fallback for a board with no legal move manufactured a triple by replacing animals, changing species counts during a regroup. | Swap existing animals into a legal herd, preserving counts and special tiles. A deterministic test exercises the fallback rather than relying on a lucky shuffle. |
| Wolf feedback | Preview text promised retreat even when the wolf was already at the forest limit. Pip always announced three steps, even when only one or two were possible. | Preview and confirmation now report actual bounded movement. Tests cover the far endpoint and a one-step Pip retreat. |
| Field transitions | Leaderboard/help could interrupt the short wait after a completed field. | Hold the interaction lock until the transition panel opens. Test verifies that a competing dialog cannot open during that interval. |
| Restart audio | An abandoned adventure could leave its sound playing into a restart. | Restart resets the audio context as well as game state; existing generation guards cancel abandoned ending callbacks. |
| Language and sharing | Singular/plural inconsistencies, incomplete wolf sentences, stale fallback text and a total score labeled “HERDING POINTS.” | Use singular wolf copy, actual movement, “Pip barks used,” correct rescue pluralization and “TOTAL POINTS.” The README now describes current rules and the root URL instead of retired cats, old bonuses and an obsolete release path. |

Relevant source: [flow and UI](rescue.js), [rules](rescue-engine.js), [layout](rescue.css), [share card](rescue-share.js). Regression coverage lives in [flow tests](tests/rescue-flow.test.cjs), [engine tests](tests/rescue-engine.test.cjs) and [share tests](tests/rescue-share.test.cjs).

## What was verified

**93 automated tests pass.** Coverage includes opening with no selection, invalid groups, scoring and pressure boundaries, three shared barks, special-tile timing, carryover, replay, both endings, player persistence, asynchronous leaderboard responses, bounded network retry and release packaging. `git diff --check` passes.

Browser checks used the actual runtime plus temporary controls and a score-service stub outside the repository. No fabricated score was posted to production. The stub verified save/change/post with `PEW 🐮`, encoded as `PEWE` in the submitted payload.

- Mobile layouts were exercised at 393×650, 393×550 and 320×568. At the usual 393×650 test size the board stayed 292px square through the wind animation. At 320×568 the game had no horizontal overflow and both action buttons and Restart game remained visible. Very short screens still require a smaller board; this release does not reduce its existing viewport-based size.
- With animation enabled, the winning result panel opened about **2,009ms** after the wolf ending began; the loss panel opened about **2,003ms** afterward. Both corresponding howl calls reported successful audio startup. Whole tiles move during scattering, and input resumes after it settles.
- These were desktop browser tests at mobile viewport sizes, not a physical iPhone audio listening test. They verify execution and layout, not how the calls sound through the user's Safari/device combination.

A read-only request to the production score endpoint returned all 20 entries in about 2.6 seconds, with a cutoff of 3,312 at the time of checking. This confirms availability during the audit, not continuous availability or a repaired Google backend.

### Balance and animal distribution

The only rules change is the count-preserving regroup fix. These are complete adventures over the same 1,000 seeded runs per strategy, using the existing [balance script](tests/rescue-balance.cjs):

| Automated strategy | v2.33 wins | v2.34 wins |
| --- | ---: | ---: |
| Goal-aware, use Pip at danger | 846/1,000 | 853/1,000 |
| Goal-aware, never use Pip | 245/1,000 | 254/1,000 |

The difference is small. Pip has substantial value under these strategies. These figures are **not human win-rate estimates** and do not justify making the game harder without playtest evidence.

The [distribution audit](scripts/audit-animal-distribution.cjs) counted 81,336 first-field refills: sheep/pigs/hens were 32.96% / 33.41% / 33.63%, with no cows as intended. Across 128,264 orchard refills and 144,029 final-field refills, each of the four animals was within 24.88–25.09%. Final-field entry averaged 9.67 cows over 1,992 reached final fields in that audit. There is no observed systematic cow shortage in these samples.

The existing anti-farming pressure remains: from whistles 18 and 26 the wolf closes in faster. Tests verify that non-goal herds cannot stall forever, even with all three barks.

## Improvements to prioritize next

1. **Preserve an unfinished run and an unposted winning score.** Currently a reload loses both; only player identity and personal best persist. Save the complete run state, rule version and original submission nonce. Restore explicitly on return, and never create a second score for the same adventure. This is the most useful reliability improvement before a larger launch.
2. **Add a daily shared challenge.** Keep normal play, but offer the same seeded adventure to everyone each day, with a daily board and a date on the share card. Specify how retries and first attempts count. This creates a reason to return and a more meaningful “beat my score” invitation. It requires deterministic refill randomness and a versioned seed contract, not merely a fixed opening board.
3. **Give new players an attainable target.** Add a weekly board and highlight personal bests while retaining the all-time archive. The current all-time table mixes scores from earlier balance rules, and multiple entries from a few players can dominate its 20 places. Do not silently delete those scores.
4. **Measure the actual player experience.** Count starts, first successful whistles, field completions/losses, replay choices, Pip use, share attempts and next-day returns. Separate first-time players from returning ones. Do not send initials or badges with analytics. No tracking was added in this audit.
5. **Keep the bonus definition explicit.** Today, three barks used in one field still leave two rested fields and earn +300 on a win. That follows the existing field-based rule. If the intention becomes rewarding unused barks instead, treat that as a separate balance change and a new leaderboard season.

The Google Sheet remains appropriate for a small casual audience, with limits. The browser reports the score; backend plausibility checks are not an authoritative replay of the adventure. Cash-prize or paid competitive modes would require stronger validation. The deployed backend was not changed or exhaustively security-tested in this audit. Before a large promotion, plan a cached leaderboard service and pending-score recovery; Apps Script enforces quotas that can interrupt service. [Google's quota documentation](https://developers.google.com/apps-script/guides/services/quotas)

## Bring attention to it

Use one clear description consistently:

> **Hungry Wolf: Bring Them Home.** A cozy puzzle with an impatient wolf. Gather herds, time your whistle, and decide when to spend Pip's three barks.

Start with **50–100 people outside friends and family**. That is a proposed playtest cohort, not an industry success benchmark. Give them the link with one sentence, then watch whether they discover the first move, complete an adventure and voluntarily replay. Ask where they felt confused or cheated; watch behavior as well as collecting compliments.

Make three short portrait clips: a near-loss rescued by Pip; a dust devil scattering a promising herd; and a large herd sending the wolf back before the last gate shuts. Keep clips around 15–20 seconds, show the real interface, and end with the root link or share card. Ask existing players to challenge one friend. Share selectively in cozy-game and puzzle communities that permit self-promotion; broad repetitive posting is unlikely to help.

Create a playable **itch.io** page as the first public showcase, with a strong cover, three screenshots and the short description. itch accepts a ZIP with `index.html` and relative assets, supports browser play, and has a mobile-friendly fullscreen launch option. Its HTML5 payment flow supports voluntary donations. [itch HTML5 guide](https://itch.io/docs/creators/html5) A public playable page and cover image are part of its discovery requirements. [itch indexing guide](https://itch.io/docs/creators/getting-indexed)

Then consider **CrazyGames Basic Launch** for a larger external test. Its documented test lasts 7–21 days, ending after at least seven days and 500 plays, or at day 21. Measurement is automatic without an SDK; ads stay disabled during that phase. Strong results can lead to a monetized full launch with its SDK. Admission and income are not guaranteed. [CrazyGames launch guide](https://docs.crazygames.com/resources/basic-launch-metrics/)

Poki is another option, but compare its terms before committing: its preferred deal is web-exclusive, while existing non-exclusive games can receive a flat license offer without revenue sharing. Do not assume the same game can participate in every publisher's revenue program simultaneously. [Poki partnership terms](https://developers.poki.com/guide/revenue-deal-types)

## Monetize without weakening the game

| Option | When to try it | Fit for Hungry Wolf |
| --- | --- | --- |
| Voluntary support | First public release | “Buy Pip a biscuit” with a suggested $3–$5 contribution. Keep the whole current game free. This is my suggested price test, not a revenue forecast. |
| Portal advertising | After an external playtest shows repeat play | Let a portal supply discovery and advertising infrastructure. If the agreement allows it, place ads between adventures; protect the uninterrupted thinking and herding loop. |
| Supporter cosmetics | After players request more | A small optional pack of tile themes, Pip looks or decorative barns. Preserve scoring fairness and the free game. Test willingness to pay before building a store. |

Avoid paid extra Pips, score multipliers or revives feeding the normal leaderboard. They would undermine its meaning. A mobile app is a later distribution choice, not the first thing to build just to accept money.

Advertising needs scale. As an illustration only, 1,000 daily players × two completed adventures × one ad × 75% fill ÷ 1,000 × an assumed $5 eCPM × 30 days yields **$225/month gross**, before platform share and other costs. None of these figures is a forecast or a claimed market rate. Early donations and portal testing are more informative than buying traffic before retention is known.

Before introducing a commercial storefront or making this a business, move the public site to hosting intended for commercial use and choose a memorable domain. The code repository can stay on GitHub. GitHub Pages has explicit restrictions on using it to run an online business, e-commerce site or a site primarily facilitating commercial transactions; this does not mean every incidental donation link is forbidden. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

## Suggested next month

- **Week 1:** playtest this audit release, add run/result recovery, and establish basic measurement.
- **Week 2:** launch the itch page and three clips; invite the outside playtest cohort.
- **Week 3:** prototype the daily challenge and compare return/replay behavior. Preserve regular play.
- **Week 4:** try voluntary support and apply for a portal test if players are returning. Use the evidence to choose the next feature.

The recommended investment now is making the game easy to return to and easy to share. More mechanics and greater difficulty can wait for evidence that returning players need them.
