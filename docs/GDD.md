# DUO DINER — Game Design Doc (v1.0, Phaser edition)

> **One Cooks. One Serves. Both Panic.**
> PlateUp! × Diner Dash couch co-op roguelike. Two gamepads, one screen.
> Survive 8 waves to save the diner, then hold out through Closing Time for a high score.

Adapted from the original v0.9 alpha GDD (written for Godot 4.3). This version
targets **Phaser 3 + Vue 3** (this repo), makes **two gamepads the primary
controls**, and resolves the contradictions in v0.9 (see
[Changes from v0.9](#changes-from-v09)).

| | |
|---|---|
| Players | 2, local, same screen |
| Controls | 2 gamepads (keyboard fallback for dev / missing pad) |
| Session | ~18 min run |
| Engine | Phaser 3.90, Vue 3 host |
| Resolution | 640×360, pixel art, 32×32 tiles, nearest-neighbour scaled to fit |
| Palette | Cook `#00ffd0` · Server `#ff3b8d` · Diner `#ffd93d` · BG `#120f1a` |

---

## 1. Core loop (≈60 s per customer)

```
Customer arrives → queues at entrance
  → Server greets, customer follows Server to a free, clean table
  → Server takes the order → ticket slides onto the rail
  → Cook builds the dish (crates → chop / grill → plate) and puts it on the pass
  → Server carries the plate to the table → customer eats → tip pops
  → Server busses the dirty plate back to the sink → table is free again
```

- **Fail state:** 3 lives. Each customer whose patience runs out leaves angry: −1 life. 0 lives = run over.
- **Patience** refills at every service step (queued → seated → ordered). The food step gets 1.5× patience because it takes the longest.
- **Tips:** $5 base + up to $5 speed bonus (proportional to patience left), × modifiers.
- **Juice:** ticket ding, sizzle, tip pop, screen shake + gamepad rumble on burns and wrong deliveries.
- **Loop tension:** the Cook can't leave the kitchen; the Server has to come *into* the kitchen to drop dirty plates at the sink, through a one-tile doorway. Collisions between the two players are on.

## 2. Controls — two gamepads (primary)

Standard-mapping pads (Xbox / PlayStation / Switch Pro in browser). The two
**roles are claimed in the lobby**: the first pad to press **A** becomes the Cook, the second becomes the Server.

| Action | Gamepad | Keyboard fallback — Cook | Keyboard fallback — Server |
|---|---|---|---|
| Move (8-dir, analog) | Left stick / D-pad | WASD | Arrow keys |
| Interact: pick up / put down / greet / seat / take order / deliver | **A** (Cross) | Space | Enter |
| Use (hold): chop on a board | **X** (Square) | E | Shift |
| Pause | Start (Options) | Esc | Esc |
| Lobby: join / ready | A / Start | Space | Enter |

- **Rumble** (`vibrationActuator`, where the browser supports it) on: wrong delivery, burnt food, angry customer, life lost. Every rumble also triggers a screen shake, so keyboard players get the same feedback.
- Pad disconnects pause the game until a pad presses A again for that role.
- Keyboard fallback exists so one person can test alone, or so a group with only one pad can still play (pad + keyboard).

## 3. Roles

### The Cook — kitchen-locked (cyan)
The Cook can't cross the doorway. They can't take orders, so they read the ticket rail.

| Verb | How |
|---|---|
| **Grab** | A at a crate (bun, patty, lettuce, tomato). A while holding a plate adds a bun straight onto it. |
| **Chop** | Put lettuce/tomato on a board, **hold X** — 1.2 s base. |
| **Grill** | Put a raw patty on a grill: cooked at 4 s, **burnt** 5 s later (smoke + shake). Burnt food only goes in the bin. |
| **Plate** | Take a plate from the stack, add the ingredients from counters, boards or the grill. The plate has to match the ticket exactly. |
| **Pass** | Put the finished plate on a pass counter in the kitchen wall. The Server can reach it from the dining side. |

### The Server — front of house (pink)
| Verb | How |
|---|---|
| **Seat** | A on the customer at the front of the queue → they follow you; A on a free, clean table → they sit. |
| **Order** | A on a seated customer showing `!` → ticket added to the rail. |
| **Deliver** | Carry a plate from the pass. A on the customer → correct dish = tip; wrong dish = rumble, no tip, and you keep the plate. |
| **Bus** | Pick up the dirty plate left behind, walk it into the kitchen, drop it in the sink (washes in 2.5 s, back on the stack). A table can't be used while it's dirty. |

## 4. Recipes

| Dish | Ingredients | Unlock |
|---|---|---|
| Burger | bun + grilled patty | Wave 1 |
| Salad | chopped lettuce + chopped tomato | Wave 2 |
| Deluxe | bun + grilled patty + chopped lettuce | Wave 4 |

Order doesn't matter, but the set has to match exactly. 4 plates exist in total, so busing matters.

## 5. Waves — 8 to save the diner, then Closing Time

Hand-authored waves 1–8. The "+15% per wave" from v0.9 now only applies to
the endless wave 9.

| # | Name | Customers | Tables | Patience | Recipes | Twist |
|---|---|---|---|---|---|---|
| 1 | Opening Shift (tutorial) | 3 | 2 | 45 s | burger | slow spawns |
| 2 | Lunch Rush | 5 | 3 | 35 s | +salad | — |
| 3 | First Draft | 6 | 3 | 32 s | burger, salad | **Draft #1 before the wave** |
| 4 | Double Booked | 8 | 4 | 30 s | +deluxe | customers arrive in pairs |
| 5 | Fire in the Kitchen (mid-boss) | 8 | 4 | 28 s | all | burnt food left on the grill catches fire *(planned)* |
| 6 | Second Draft | 9 | 5 | 26 s | all | **Draft #2 before the wave** |
| 7 | VIP Food Critic | 9 | 5 | 26 s | all | 2 critics: 15 s patience, ×3 tips |
| 8 | Full House | 12 | 6 | 24 s | all | fast pairs |
| 9 | Closing Time | ∞ | 6 | 24 s | all | endless; every 4 customers served → spawns and patience 15% harsher. Keep your tips. |

- **Clearing wave 8 = the diner is saved (run counts as a win).** Wave 9 is a score chase until lives run out.
- The draft is a **pick 1 of 3** from the power-up pool, without duplicates. Either player can move the cursor and confirm.
- **Shop** *(planned, from wave 3)*: between waves, spend tips on: reroll the draft ($15), restore a life ($30), extra plate ($10). This makes tips matter beyond score.

## 6. Power-ups (draft pool)

Power-ups are **modifiers, not new systems**: they read from `RunState.modifiers`.

| Power-up | Role | Rarity | Effect | Status |
|---|---|---|---|---|
| Roller Skates 🛼 | Server | Common | +40% Server move speed | ✅ |
| Charm Aura 💖 | Server | Common | Patience +30%, tips +15% | ✅ |
| Auto-Chopper 🔪 | Cook | Common | Boards chop instantly when an item is placed | ✅ |
| Bigger Tips 💸 | Diner | Common | All tips ×1.5 (shop prices +20% once the shop exists) | ✅ |
| Double Grill 🔥 | Cook | Rare | Spare kitchen counter becomes a second grill | ✅ |
| Ghost Pan 👻 | Cook | Rare | Grills never burn food | ✅ |
| Robot Busboy 🤖 | Diner | Epic | Auto-clears one dirty table every 12 s | ✅ |
| Octo-Tray 🐙 | Server | Rare | Carry 2 plates (stacked) — risky, +$2 per double delivery | planned |
| Ingredient Cannon 💥 | Cook | Epic | Throw held item in facing direction onto the nearest counter | planned |

Only implemented power-ups go into the draft pool.

## 7. Architecture (Phaser)

```
src/
├─ main.js / App.vue / components/   Vue host; loads pixel font, mounts Phaser
└─ game/
   ├─ game.js                Phaser config (640×360, pixelArt, gamepad on, no gravity)
   ├─ constants.js           tile size, palette, tuning numbers
   ├─ data/                  map.js (ASCII layout), recipes.js, waves.js, powerups.js
   ├─ art/                   pixel-string sprites → generated textures (no binary assets)
   ├─ audio/sfx.js           tiny WebAudio synth (ding, sizzle, pop, error)
   ├─ input/PlayerInput.js   gamepad-first input with keyboard fallback + rumble
   ├─ state/                 bus.js (signal bus), RunState.js (lives/tips/wave/modifiers)
   ├─ entities/              Player, Customer, items
   ├─ stations/              Crate, Counter, Board, Grill, PlateStack, Sink, Bin, Table
   ├─ ui/                    Hud, TicketRail, fx
   └─ scenes/                Boot → Lobby → Game (+ Draft overlay) → GameOver
```

**Signal bus** (`state/bus.js`): `order_taken`, `order_done`, `tip_earned`,
`customer_left_angry`, `life_lost`, `wave_started`, `wave_cleared`, `run_over`.
Gameplay objects never hold references to UI. The HUD and ticket rail listen
on the bus.

Godot → Phaser mapping used:

| v0.9 (Godot) | Here |
|---|---|
| `CharacterBody2D` | Arcade Physics sprite, gravity 0 |
| Autoloads `RunState` / `WaveManager` | ES module singletons |
| Signals | `Phaser.Events.EventEmitter` bus |
| TileMap + YSort | ASCII map → static bodies, `depth = y` |
| AStar table paths | Waypoints through aisles (layout is designed for it) + breadcrumb-following the Server |
| Camera follows midpoint with lerp | Fixed single-screen camera (whole diner fits on screen at 640×360) |

## 8. Build checklist

**Slice 1 — playable loop (this commit)**
- [x] 640×360 viewport, pixel art, pixel font
- [x] Lobby: claim Cook/Server by pad (keyboard fallback)
- [x] Map from ASCII: walls, kitchen, dining room, doorway, pass counters
- [x] Cook + Server controllers (analog, 8-dir), held-item slot over the head
- [x] Stations: crates, boards (hold to chop), grills (cook → burn), counters, plate stack, sink, bin, tables
- [x] Customers: queue → follow → seat → order → wait → eat → leave (angry on 0 patience)
- [x] Ticket rail with patience bars (red under 20%), HUD (wave, lives, tips)
- [x] Waves 1–9 from data, endless scaling, win/lose screens
- [x] Draft pick (3 of pool) before waves 3 and 6
- [x] Juice: tip pop, screen shake, rumble, synth SFX, smoke particles

**Slice 2 — next**
- [ ] Wave 5 fire (burnt-on-grill → fire → extinguisher)
- [ ] Shop between waves
- [ ] Octo-Tray, Ingredient Cannon
- [ ] Chop timing mini-game (hit X in the sweet spot for a speed bonus)
- [ ] Pause menu + pad-disconnect handling UI
- [ ] Real art pass, music

## Changes from v0.9

| v0.9 said | Problem | Now |
|---|---|---|
| Two players on one keyboard | Keyboard ghosting drops simultaneous keys | **Two gamepads**; keyboard is only a fallback |
| Rumble on failed delivery | Keyboards can't rumble | Gamepad rumble + screen shake for everyone |
| Cook clicks a ticket to start cooking | Needs a mouse, which nobody has a hand free for | Tickets show the full recipe, so there's nothing to select |
| "9 waves to close" and "wave 9 endless" | Contradiction | Clear 8 = win; wave 9 = endless score chase |
| "+15% per wave" and hand-designed waves | Contradiction | Hand-authored 1–8; +15% steps only in endless |
| Wave 2 patience 35 s > 30 s base | Lunch rush easier than the base | Patience curve 45 → 24 s, critics 15 s |
| "Shop unlocks" at wave 3, but no shop design | Tips had no use | Shop defined (slice 2); tips also = score |
| Cook "kitchen locked" but free WASD movement | Unclear | Cook moves freely *inside* the kitchen; doorway blocks only the Cook |
| Camera lerps to players' midpoint | Unnecessary on one screen; can push a player off-screen | Fixed camera |
| Godot 4.3 project tree / prompts | Repo is Phaser | Phaser architecture (§7) |
