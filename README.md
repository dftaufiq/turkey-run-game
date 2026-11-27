# Gobble Dash — The Great Turkey Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/dftaufiq/turkey-run-game/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/dftaufiq/turkey-run-game/reward.svg)](https://make.fun/c/turkey-run-game-01)

Thanksgiving is coming. You are Gobble, a turkey with 900 metres between the
farmyard and freedom — and a very determined farmer right behind you.

Run from the farmyard, through the barn, into the kitchen itself. Jump the
fences, hay bales and pumpkins; slide under the swinging carving knives and
hanging pots; dash past the roaring oven. Grab corn, feathers and the golden
drumstick on the way. Every stumble lets the farmer close in — three hits and
dinner is served… for him.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts`, then
http://localhost:8080). No build step, no network.

- **SPACE / ↑ / W / click** — jump (hold for a higher jump)
- **↓ / S** — slide under knives and pots
- **SHIFT** — dash
- **P** — pause, **M** — sound on/off, **R** — run again

## The game

- Title screen, live run with HUD (score, distance, lives, stage, farmer
  proximity), caught / escaped end screens with restart.
- Three stages with their own art and dangers: the farmyard, the barn, the
  kitchen.
- A farmer who chases, stumbles and lunges — the gap meter shows exactly how
  close he is.
- Synthesised sound (Web Audio, no files): gobbles, jumps, pickups, fanfare.

Built for the [turkey-run-game-01](https://make.fun/c/turkey-run-game-01)
bounty on make.fun. MIT licensed.
