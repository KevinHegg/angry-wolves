# Angry Wolves Missions Review

This file is for tuning and reviewing the mission catalog outside the code.
The live mission logic still lives in [`game.js`](/Users/kevinhegg/Documents/angry-wolves/game.js).

## Current Mission-Only Tetrads

- `Barn Buster`: blows up nearby settled tiles
- `Cull Comb`: removes the biggest herd, then turns into a useful matching animal
- `Mystery Crate`: turns into the animal it touches first
- `Nest Bomber`: spawns as a mixed egg-and-turd piece, then scatters the same mix nearby
- `Branding Iron`: becomes the touched animal and converts nearby animals to match
- `Feed Wagon`: becomes the touched animal and scatters only eggs nearby
- `Reward Coin`: becomes part of a herd and that herd must be cleared to earn the mission bonus

## Current Mission Catalog

| Title | Goal | Special |
| --- | --- | --- |
| `Sheep Sweep` | Clear `17` sheep | `Barn Buster` |
| `Goat Evac` | Clear `17` goats | `Mystery Crate` |
| `Coop Cleanup` | Clear `18` chickens | `Nest Bomber` |
| `Moo Move` | Clear `16` cows | `Cull Comb` |
| `Hog Panic` | Clear `18` pigs | `Barn Buster` |
| `Triple Clear` | Clear `3` big herds | `Cull Comb` |
| `Quad Clear` | Clear `4` big herds (`12+` animals) | `Barn Buster` |
| `Chain Starter` | Reach `x2` combo | `Mystery Crate` |
| `Chain Fever` | Reach `x3` combo | `Mystery Crate` |
| `Wolf Pop` | Trigger `1` wolf blast | `Barn Buster` |
| `Wolf Rampage` | Trigger `2` wolf blasts | `Barn Buster` |
| `Coin Sprint` | Score `220` coins | `Nest Bomber` |
| `Sunrise Scramble` | Score `320` coins | `Cull Comb` |
| `Level Rush` | Reach level `3` | `Mystery Crate` |
| `Boot Test` | Reach level `4` | `Barn Buster` |
| `Jumbo Duo` | Clear `2` jumbo herds | `Cull Comb` |
| `Flock Forge` | Build a live herd of `9` | `Branding Iron` |
| `Barn Weave` | Build a live herd of `10` | `Branding Iron` |
| `Special Trial` | Use a mission special `1` time | `Nest Bomber` |
| `Special Encore` | Use a mission special `2` times | `Nest Bomber` |
| `Feed Rush` | Clear `3` big herds | `Feed Wagon` |
| `Sounder Supper` | Clear `18` pigs | `Feed Wagon` |
| `Steady Hands` | Complete `14` settles | `Mystery Crate` |
| `Mud Marathon` | Complete `20` settles | `Cull Comb` |

## Brainstorm: New Mission-Only Tetrads

- `Salt Lick`: becomes the touched animal and attracts the nearest 2 matching animals one cell closer.
- `Shepherd Hook`: yanks one adjacent cluster sideways into a tighter herd shape.
- `Hay Bale`: lands as blocker straw tiles, then bursts into food eggs after one settle.
- `Rain Barrel`: clears nearby turds and upgrades one nearby egg cell into a double-score patch.
- `Barn Door`: seals one edge for a few settles, letting players stack for a giant planned herd.
- `Rooster Call`: briefly slows the barn and turns nearby chickens into the touched animal.
- `Milk Cart`: becomes a cow herd-builder and doubles the coin gain of the next cleared cow herd.
- `Truffle Snout`: becomes a pig herd-builder and reveals hidden egg cells in nearby spaces.

## Theme Notes

- `Mystery Crate`, `Branding Iron`, and `Feed Wagon` all help build herds and fit best with build/live-herd missions.
- `Barn Buster` and `Cull Comb` fit destruction, rescue, or speed missions better than careful build missions.
- `Nest Bomber` is strongest when the mission wants volatility, score spikes, or combo chances.
- `Reward Coin` should stay universal because it now defines the endgame loop.
