# Angry Wolves Missions Review

This file is for tuning and reviewing the mission catalog outside the code.
The live mission logic still lives in [`game.js`](/Users/kevinhegg/Documents/angry-wolves/game.js).

## Current Mission-Only Tetrads

- `Barn Buster`: blows up nearby settled tiles
- `Cull Comb`: removes the biggest group, then turns into a useful matching animal
- `Mystery Crate`: turns into the animal it touches first
- `Nest Bomber`: spawns as a mixed egg-and-turd piece, then scatters the same mix nearby
- `Branding Iron`: becomes the touched animal and converts nearby animals to match
- `Feed Wagon`: becomes the touched animal and scatters only eggs nearby
- `Reward Coin`: becomes part of a group and that group must be cleared to earn the mission bonus

## Current Mission Catalog

| Title | Goal | Special |
| --- | --- | --- |
| `Sheep Sweep` | Clear `17` sheep | `Barn Buster` |
| `Goat Evac` | Clear `17` goats | `Mystery Crate` |
| `Coop Cleanup` | Clear `18` chickens | `Nest Bomber` |
| `Moo Move` | Clear `16` cows | `Cull Comb` |
| `Hog Panic` | Clear `18` pigs | `Barn Buster` |
| `Quad Clear` | Clear `4` big groups (`13+` animals) | `Barn Buster` |
| `Chain Fever` | Reach `x4` combo | `Mystery Crate` |
| `Wolf Rampage` | Trigger `2` wolf blasts | `Barn Buster` |
| `Sunrise Scramble` | Score `380` coins | `Cull Comb` |
| `Barn Weave` | Build a live group of `12` | `Branding Iron` |
| `Feed Rush` | Clear `4` big groups (`13+` animals) | `Feed Wagon` |
| `Wool Patrol` | Cash in `2` wool bundles | `Barn Goods` |
| `Cheese Chase` | Cash in `2` cheese wedges | `Barn Goods` |
| `Egg Run` | Cash in `2` egg crates | `Barn Goods` |
| `Milk Run` | Cash in `2` milk bottles | `Barn Goods` |
| `Pigskin Parade` | Cash in `2` footballs | `Barn Goods` |

## Trimmed From Live Rotation

- `Triple Clear`: too close to `Quad Clear`
- `Chain Starter`: too easy after cascade conversions
- `Wolf Pop`: too close to `Wolf Rampage`
- `Boot Test`: pace-only mission was less flavorful than the others
- `Jumbo Duo`: too similar to the big-group clear missions once big groups got easier
- `Flock Forge`: too close to `Barn Weave`

## Brainstorm: New Mission-Only Tetrads

- `Salt Lick`: becomes the touched animal and attracts the nearest 2 matching animals one cell closer.
- `Shepherd Hook`: yanks one adjacent cluster sideways into a tighter group shape.
- `Hay Bale`: lands as blocker straw tiles, then bursts into food eggs after one settle.
- `Rain Barrel`: clears nearby turds and upgrades one nearby egg cell into a double-score patch.
- `Barn Door`: seals one edge for a few settles, letting players stack for a giant planned group.
- `Rooster Call`: briefly slows the barn and turns nearby chickens into the touched animal.
- `Milk Cart`: becomes a cow group-builder and doubles the coin gain of the next cleared cow herd.
- `Truffle Snout`: becomes a pig group-builder and reveals hidden egg cells in nearby spaces.

## Theme Notes

- `Mystery Crate`, `Branding Iron`, and `Feed Wagon` all help build groups and fit best with build/live-group missions.
- `Barn Buster` and `Cull Comb` fit destruction, rescue, or speed missions better than careful build missions.
- `Nest Bomber` is strongest when the mission wants volatility, score spikes, or combo chances.
- `Barn Goods` is the producer-special family: sheep make wool, goats make cheese, chickens make eggs, cows make milk, and pigs make footballs because funny beats grim.
- A producer mission special should always feel readable: clean hit means egg + tagged group, miss means turd + wrong-animal conversion.
- Trimming repetitive score, pace, and pig-animal duplicates keeps the mission draw funnier and more distinct.
- `Reward Coin` should stay universal because it now defines the endgame loop.
