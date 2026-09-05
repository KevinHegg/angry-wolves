# Rescue 2.1

- Removed legacy query routing and redirected `classic.html` to the current game. The wordmark no longer navigates to a potentially cached root page.
- Added a self-contained `/play/2.1/` release and directed the root entry and share links there.
- Results place score entry before replay, collapse the image preview, and focus the heading rather than the final button. Field transitions explicitly identify the next field. Replay explicitly starts at field one.
- The displayed leaderboard is capped at 20. A new score must beat the cutoff once full; earlier ties keep their place. The existing Sheet retains historical rows. Qualification is checked again before posting.
- Removed image downloads. Native sharing sends the prepared PNG where file sharing is supported, with text/link fallback. Images and captions include a new personal best or a confirmed public rank. Ambiguous or pending entries do not claim a rank.

## Verification

29 automated tests pass. The controller test runs two complete adventures, offers and submits each score against a fake service, verifies rank, and checks reset of chapter, score, nonce and submission state. Separate tests cover top-20 displacement, ties, rank matching, native PNG sharing, canvas achievement text, single-touch transitions and release asset consistency.

The live score-sheet read succeeded and returned two existing rescue entries. No production test score was written. Browser visual inspection was blocked by the locked Mac; physical iPhone Safari verification remains outstanding.

Build release copies with `node scripts/package-rescue.cjs`. Source and generated release files must be committed together.
