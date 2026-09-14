# Hungry Wolf leaderboard setup

The live design keeps the editable spreadsheet private while exposing only score intake and approved score rows:

`GitHub Pages -> public Google Form -> private response tab -> validation formula -> published public CSV`

## Resources

- Spreadsheet: `hungry-wolves-data`, ID `1-OrglIP8N9Ol9ftACs1CjAq494sAp18CDxU-V7g7xoc`
- Form editor ID: `1ZBpp_I-QBO2vI_V0toMNunUKBsfmBQDx3Na_FnYdLYc`
- Public form ID: `1FAIpQLSdvsK8P6XsN8WJ9Yf8A6RX_0842rSTuNXF1YVAiPQRlGztlkA`
- Public CSV ID: `2PACX-1vS9kSCHFoHdSz4DIlk1F5mctQh7BtwCtYBJAHZxkFBSpGMeEq20Gob2HFQ9aTYv7-u6mXx1e9SVaNgd`

The spreadsheet must remain restricted to the owner. The Form responder setting is **Anyone with the link**. Only the `public` tab is published to the web as CSV.

## Columns

`Form Responses 1` contains the Google timestamp followed by these required questions:

1. `player_name`
2. `score`
3. `game_mode`
4. `mission_title`
5. `best_chain`
6. `biggest_herd_count`
7. `biggest_herd_animal`
8. `herds_cleared`
9. `pace`
10. `duration_ms`
11. `nonce`
12. `client_timestamp`
13. `version`

`public` contains:

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

Rows 2–49 hold the 48 migrated historical scores. A50 contains the array formula that validates and appends form responses. Do not insert manual rows below A50 because they can block the array result. The response references must use `INDIRECT` to prevent Google Forms insertions from shifting row 2. Generate the exact formula with `node scripts/public-score-formula.cjs`; extend its shared response bound before response 1,000. Do not replace these with direct A2:A1001 references.

## Client mapping

`rescue-services.js` owns the public URLs and stable Google Form entry IDs. If a Form question is replaced rather than renamed, its entry ID changes; update `FORM_FIELDS` and the service tests before publishing a new game version.

The client POST uses `mode: "no-cors"`, so a resolved request means Google accepted the network request, not that the row passed validation or is already visible. The result screen says the score was received. The public CSV can be cached for several minutes; a later refresh establishes any leaderboard rank.

All five views are calculated from the full approved CSV in `rescue-daily.js`:

- Daily: best score per player on the selected Eastern date.
- Weekly: sum of daily bests from Monday through Sunday.
- All time: top 20 free-play and daily adventures.
- Daily records: top 20 daily challenge scores across all dates, best result per player per date, including late posts.
- Daily winners: one champion for every completed date.

## Validation and moderation

The sheet formula admits expected four-character player IDs, `rescue-v2` or `rescue-daily-v1`, bounded score/game metrics, durations from 8 seconds to 24 hours, at least 35 ms per point, a supported version, a nonempty first-occurrence nonce and a correctly formatted daily title. Raw responses that fail remain private and do not enter the published CSV.

This protects a casual board from common mistakes and simple replay attempts. Browser submissions are still user-controlled, and the form fallback has no reliable IP rate limit or automatic `suspect` queue. The unused Apps Script source under `apps-script/` implements stronger moderation for a future verified deployment.

## Routine checks

Before a release:

1. Open the responder Form in a private/unsigned browser and confirm it does not require sign-in.
2. Fetch the published CSV anonymously and confirm only the 13 public headers and approved rows appear.
3. Run `node --test tests/*.test.cjs` and `git diff --check`.
4. Do not post a production QA score. Validate form mapping with mocked fetches in the test suite.

## September 14 repair (v2.43)

The first three Form submissions were recorded but invisible: Forms moved the direct response references in public!A50 from row 2 to row 5. Replaced all 38 references with insertion-stable INDIRECT ranges after testing in blank private scratch cells. The three daily rows now pass the existing validation, preserving all 48 historical scores, score values, nonce deduplication and tie order. Scratch cells were cleared. The public CSV confirms KEVH 3910 and BUDC 3472 on Daily (BUDC 2788 remains in the raw approved history). A failed public read no longer prevents a daily POST. No synthetic production score was submitted.
