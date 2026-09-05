# Rescue 2.2

Requests Safari’s media playback audio session before creating or resuming Web Audio, and restores automatic session handling when muted. The help-screen sound test now reports whether audio was scheduled successfully. Actual audible output on a physical iPhone remains to be confirmed; browser success cannot establish speaker volume or routing. See https://bugs.webkit.org/show_bug.cgi?id=237322 and https://www.w3.org/TR/audio-session/ for the underlying distinction.

Shares contain the score image and game URL, with no duplicate score caption. Initials and badge are remembered immediately on editing, rather than waiting for successful submission. Ten animal-themed choices replace the default picker; old badge IDs still decode unchanged and a previously chosen legacy badge stays available.

34 tests pass, covering audio session selection/fallback, failed resume, remembered drafts, original and new badge IDs, PNG/link-only sharing, full adventure resets, and release consistency. Browser playthroughs verified score entry remembers TST plus the wolf when reopened and after a full reload and another adventure. No score was posted during browser tests. The sound-test control reported successful scheduling. At a 393 × 650 viewport the badge dialog has equal client and scroll widths (338 px), with no horizontal overflow.

The published 2.1 directory is preserved. Root, classic redirect, and new shared links point to `/play/2.2/`.
