# Angry Wolves V2 Mission Ladder

This pass turns V2 missions into a chained "one more job" loop while keeping the existing 9x12 board, stabilized scoring, mission drawer, Next-tray special preview, and V2 leaderboard separation.

## Design Goals

- Make missions feel like funny barnyard jobs, not abstract bookkeeping.
- Teach one idea at a time: herds first, modifiers second, tools third, wolves late.
- Keep mission copy short enough for phone play.
- Keep mission rewards separate from egg and chain multipliers.
- Make specials central, visible in the real Next tray, and reusable across missions.

## Feature Flags

- `V2_MISSION_LADDER_ENABLED`: enabled by default in V2. Disable with `?missionLadder=0`.
- `V2_CHAINED_MISSIONS_ENABLED`: enabled by default when the ladder is enabled. Disable with `?chainedMissions=0`.
- `V2_ONBOARDING_ENABLED`: still controls first-run onboarding. Disable with `?v2Onboarding=0`.

## Final Mission Deck

| Mission | Family | Goal Hint | Objective | Common Special | Rare Special | Unlock |
|---|---|---|---|---|---|---|
| First Flock | Onboarding | clear 9 sheep | Clear one sheep herd | none | none | first run only |
| Sheep Sweep | Animal | clear sheep herds | Clear 2 sheep herds; early jobs scale to 1 herd | Salt Lick | Egg Basket | early |
| Coop Cleanup | Animal | clear chickens | Clear 2 chicken herds; early jobs scale to 1 herd | Rooster Call | Egg Basket | early |
| Pig Panic | Animal | clear pigs | Clear 2 pig herds; early jobs scale to 1 herd | Egg Basket | Muck Wagon | early |
| Goat Rodeo | Animal | clear goats | Clear 2 goat herds; early jobs scale to 1 herd | Salt Lick | Muck Wagon | early |
| Moo Move | Animal | clear cows | Clear 2 cow herds; early jobs scale to 1 herd | Salt Lick | Rain Barrel | early |
| Egg Rush | Modifier | 2 egg herds | Clear 2 herds with eggs | Egg Basket | Rooster Call | after 1 completed job or 2 runs |
| Mud Season | Modifier | clean 3 mud | Clean 3 mud markers | Rain Barrel | Muck Wagon | after 1 completed job or 2 runs |
| Salt Party | Tool | 2 big herds | Clear 2 herds of 10+ | Salt Lick | Barnstorm Crate | after 3 completed jobs or 3 runs |
| Rooster Riot | Combo | hit x2 chain | Trigger a x2 chain | Rooster Call | Egg Basket | after 3 completed jobs or 3 runs |
| Wolf Alert | Wolf | survive 1 howl | Survive 1 howl | Pack Howl | Rain Barrel | after 4 completed jobs or 4 runs |
| Barn Cash | Market | cash 2 goods | Cash 2 goods | Barn Goods | Muck Wagon | after 5 completed jobs or 5 runs |
| Angry Wolves | Rare marquee | 2 big herds | Clear 2 herds of 11+ | Angry Wolf | Pack Howl | after 5 completed jobs or 5 runs, rare weight |

## Unlock Ladder

- First run: `First Flock`.
- Early pool: animal jobs.
- Modifier pool: `Egg Rush`, `Mud Season`.
- Tool/combo pool: `Salt Party`, `Rooster Riot`.
- Wolf/advanced pool: `Wolf Alert`, `Barn Cash`.
- Rare pool: `Angry Wolves`.

Selection uses lightweight local progress only: runs started and lifetime jobs completed. Early animal jobs scale down to 1 herd while the player has fewer than 2 completed jobs or is still inside the first 2 runs. Debug mission selection can force a mission or tier without changing stored progress.

## Special Library

| Special | Role | Concrete Effect |
|---|---|---|
| Salt Lick | Common helper | Becomes the touched animal; converts up to 2 nearby animals to match. If isolated, places 1 egg. |
| Rain Barrel | Cleanup helper | Clears up to 4 nearby mud traps. If no mud is nearby, places 1 egg. |
| Rooster Call | Combo helper | Becomes the touched animal; flips up to 2 nearby chickens to match and places 2 eggs. |
| Egg Basket | Bonus helper | Becomes the touched animal and plants 4 eggs nearby. |
| Muck Wagon | Rare hazard | Becomes the touched animal and splashes 3 mud traps nearby. Empty mud eats 1 falling tile, then disappears. |
| Barnstorm Crate | Rare mixed chaos | Becomes the touched animal, flips 1 nearby animal to match, scatters 2 eggs and 1 mud. |
| Barn Goods | Late market tool | Producer hit tags 1 good and places 1 egg. Miss drops 1 mud trap. |
| Pack Howl | Wolf troublemaker | Becomes the touched animal, scrambles up to 4 nearby animals, and drops 1 mud trap. |
| Angry Wolf | Marquee hazard | Does not join a herd. Blasts nearby settled tiles. Hit leaves 2 mud traps; whiff leaves 1 mud trap. |

## Chained Mission Loop

When `V2_CHAINED_MISSIONS_ENABLED` is on:

1. Complete the mission objective.
2. A reward coin appears after the cashout charge.
3. Clear the reward herd within 10 settles to bank the mission bonus.
4. Cashout increments jobs completed and job streak, then starts the next job in the same run.
5. Missing the reward countdown loses that mission bonus, resets the job streak, and starts the next job.
6. The run ends only on normal board overfill/game-over.
7. Angry Wolves can auto-open the mission drawer as a warning because it is a marquee job.

## Reward And Streak Rules

- Mission bonuses are flat and separate from herd, egg, and chain scoring.
- Streak bonuses are flat and capped:
  - streak 1: +0
  - streak 2: +20
  - streak 3: +40
  - streak 4+: +60 cap
- Streak bonuses never multiply herd scores, mission rewards, eggs, or chains.
- `bankedMissionCoins` and `bankedStreakCoins` are tracked for game-over reporting and leaderboard metadata.

## Audio Hooks

New or reused V2 audio events:

- `mission_start`
- `mission_progress`
- `mission_ready`
- `reward_spawn`
- `reward_cashout`
- `reward_missed`
- `next_job`
- `job_streak`
- `mission_failed`
- `angry_wolves_start`
- `angry_wolves_complete`
- `wolf_event`
- `mud_tile_eaten`
- `mud_cleaned`
- `egg_bonus`

The long wolf howl remains reserved for Angry Wolves completion. Angry Wolf settles use shorter wolf havoc cues.
Angry Wolves also gets a short warning cue when the mission starts.

## Scoring Safety

- Existing stabilized V2 herd scoring remains intact.
- Eggs remain capped.
- Chains remain bounded.
- Mission rewards and streak bonuses are added flat.
- V2 submissions stay tagged as `GAME_MODE = "v2-prototype"` and `GAME_VERSION = "v0.38-v2-mission-polish"`.
- Leaderboard payloads now include board dimensions plus mission/job metadata.

## Debug Flags

- `?debugMission=MISSION_ID`
- `?debugSpecial=SPECIAL_ID`
- `?debugBoard=eggs|mud|wolf`
- `?debugSlow=1`
- `?debugMissionFlow=1`
- `?debugMissionTier=early|modifier|tool|wolf|rare`
- `?debugMissionState=ready|reward|next_job|runover`
- `?debugScore=1`
- `?debugNoLeaderboard=1`

All debug helpers are off by default.

`?debugMissionFlow=1` logs mission choice, family, unlock tier, jobs completed, current streak, objective target, reward value, reward cashouts, and reward misses.

## Rollback Notes

- Disable the ladder with `?missionLadder=0`.
- Disable chained runs with `?chainedMissions=0`.
- Disable all V2 with `?v1=1` or `?v2=0`.
- `LEGACY_V2_MISSION_DEFS` remains in `game.js` so the prior V2 deck can be restored without reconstructing old mission data.
