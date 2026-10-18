# DUO DINER — Game Design Doc (v1.0, Phaser edition)

> **One Cooks. One Serves. Both Panic.**
> PlateUp! × Diner Dash couch co-op roguelike. Two gamepads, one screen.
> Survive the night to save the diner (8 waves on Easy, 10 on Medium, 12 on Hard), then hold out through Closing Time for a high score.

Adapted from the original v0.9 alpha GDD (written for Godot 4.3). This version
targets **Phaser 3 + Vue 3** (this repo), makes **two gamepads the primary
controls**, and resolves the contradictions in v0.9 (see
[Changes from v0.9](#changes-from-v09)).

| | |
|---|---|
| Players | 2, local, same screen (or 1 + AI teammate) |
| Controls | 2 gamepads (keyboard fallback for dev / missing pad) |
| Session | ~18 / 23 / 28 min run (Easy / Medium / Hard) |
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
- **Patience** refills at every service step (queued → seated → ordered). The food step gets 2.05× patience because the kitchen is the bottleneck. A customer following the Server to a table loses patience at half speed, so leading someone around with no free table isn't free.
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
| Use (hold): chop on a board, spray the extinguisher | **X** (Square) | E | Shift |
| Throw (Ingredient Cannon), reroll in the draft | **Y** (Triangle) | Q | / |
| Back: leave the shop / close the pause menu | **B** (Circle) | Backspace | Backspace |
| Pause menu (resume / restart run / quit to lobby) | Start (Options) | Esc | Esc |
| Lobby: join / ready | A / Start | Space | Enter |

- **Rumble** (`vibrationActuator`, where the browser supports it) on: wrong delivery, burnt food, angry customer, life lost. Every rumble also triggers a screen shake, so keyboard players get the same feedback.
- A pad disconnecting pauses the game. That role resumes by pressing A on the same pad after it's plugged back in, on any other free pad, or on its keyboard key (Space/Enter).
- Keyboard fallback exists so a group with only one pad can still play (pad + keyboard).
- **Solo with an AI teammate:** join one role, then press A again. The empty role is played by a bot that uses the same controls and rules as a human: it walks to stations, faces them and presses A or holds X. It's tuned to be a solid partner, not a perfect one.
- `?autoplay` in the URL runs bot vs bot, picking draft cards and shopping automatically, and logs per-wave stats to the console. It's for soak and balance testing.

### Front end

```
Launcher (loading / crash screen) → Title: "PRESS ANY BUTTON" → main menu
  PLAY → Lobby (join with A, A again = AI teammate, Y = AI skill, B = back) → Game
  HOW TO PLAY (5 pages) · SETTINGS · HIGH SCORES
  idle 30 s → attract demo (bots play; any button returns)
```

- The splash doubles as the user gesture browsers require before audio plays. Gamepad buttons don't count as one, so the title shows a "click or press a key for sound" hint until audio is running.
- **Settings** (saved locally): SFX and music volume, screen shake, gamepad rumble, AI teammate skill, fullscreen. Reachable from the title and the pause menu.
- **AI skill:** Chill (0.6 s reaction, 80% pace), Normal (0.25 s, 92%), Sharp (0.05 s, 100%). The demo and `?autoplay` always use Sharp.
- The game auto-pauses when the window loses focus.

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

## 5. Waves — 8, 10 or 12 to save the diner, then Closing Time

Hand-authored waves 1–12. Difficulty sets how many of them you play: the run's
last wave (8 Easy, 10 Medium, 12 Hard) is billed as the FINALE, and clearing it
saves the diner. The "+15% per wave" from v0.9 only applies to the endless
Closing Time that follows.

| Difficulty | Waves | Patience | Spawn gap | Tips |
|---|---|---|---|---|
| Easy | 8 | ×1.4 | ×1.25 | ×1 |
| Medium (default) | 10 | ×1 | ×1 | ×1 |
| Hard | 12 | ×0.9 | ×0.95 | ×1.25 |

Settings and scores saved before 0.10 used Relaxed / Normal / Frantic; they load as Easy / Medium / Hard.

| # | Name | Customers | Tables | Patience | Spawn every | Recipes | Twist |
|---|---|---|---|---|---|---|---|
| 1 | Opening Shift (tutorial) | 3 | 2 | 45 s | 14 s | burger | — |
| 2 | Lunch Rush | 5 | 3 | 36 s | 12 s | +salad | grandparents and big tippers appear |
| 3 | First Draft | 6 | 3 | 34 s | 11 s | burger, salad | **Draft before the wave**; kids appear |
| 4 | Double Booked | 6 | 4 | 32 s | 18 s (pairs) | +deluxe | customers arrive in pairs; rushers appear |
| 5 | Fire in the Kitchen (mid-boss) | 7 | 4 | 30 s | 12 s | all | burnt food left on the grill catches fire (stays on from here) ; **draft before the wave** |
| 6 | Dinner Rush | 7 | 5 | 30 s | 12 s | all | — |
| 7 | VIP Food Critic | 8 | 5 | 28 s | 11 s | all | 2 critics: 15 s patience, ×3 tips ; **draft before the wave** |
| 8 | Full House (Easy finale) | 10 | 6 | 26 s | 18 s (pairs) | all | every table open |
| 9 | Night Owls | 9 | 6 | 26 s | 13 s | all | rusher-heavy crowd ; **draft before the wave** |
| 10 | Bus Tour (Medium finale) | 9 | 6 | 27 s | 21 s (groups of 3) | all | granny-heavy tour groups: long patience, slow eaters, tables stay busy |
| 11 | Critics Night | 10 | 6 | 25 s | 11 s | all | 3 critics ; **draft before the wave** |
| 12 | Midnight Rush (Hard finale) | 12 | 6 | 24 s | 15 s (pairs) | all | 2 critics, extra rushers: everything at once |
| ∞ | Closing Time | ∞ | 6 | 26 s (or the finale's, if lower) | 9 s | all | endless; every 4 customers served → spawns and patience 15% harsher. Keep your tips. |

- **Clearing the finale = the diner is saved (run counts as a win).** Closing Time is a score chase until lives run out.
- Themed waves (9, 10, 12) add extra weight for one guest type on top of the usual mix, so the crowd feels different.
- The draft (before waves 3, 5, 7, 9 and 11) is a **pick 1 of 3** from the power-up pool, without duplicates. Either player can move the cursor and confirm.
- Every wave starts with a one-line hint on the bottom wall introducing what's new.
- **Fire (waves 5+):** a burnt patty left on the grill for 3 s bursts into flames. The burning grill is unusable and nothing can be taken off it. While anything burns, **every customer loses patience 1.5× faster**. Fix: take the extinguisher from its red hook and hold X on the grill for 1.2 s.
- **Shop (after every wave from wave 2):** tips are your score *and* your currency.

  | Item | Price | Effect |
  |---|---|---|
  | +1 Life | $30 | Back up to the 3-life cap |
  | +1 Plate | $12 | Up to 7 plates total |
  | Calm Music | $20 | Next wave only: patience +20% |
  | Draft reroll | $15 | In the draft (Y): three new options |

  Bigger Tips raises all prices by 20%.

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
| Octo-Tray 🐙 | Server | Rare | Carry 2 plates. Serving while holding both = +$2 | ✅ |
| Ingredient Cannon 💥 | Cook | Epic | Y throws the held ingredient in the facing direction. It lands on the first station that can take it (counter, board, grill, a plate, the bin) or in the Server's empty hands; if nothing can, the Cook keeps it | ✅ |
| Coffee Break ☕ | Cook | Common | +30% Cook move speed | ✅ |
| Power Sink 💧 | Diner | Common | Plates wash twice as fast | ✅ |
| Comfy Chairs 🪑 | Diner | Rare | Seated guests lose patience 30% slower | ✅ |
| Lucky Streak 🍀 | Server | Rare | Streak bonus builds twice as fast, capped at x2 instead of x1.5 | ✅ |

## 6b. Guests

Every trait is printed over the guest's head, so nothing is hidden.

| Guest | Tag | Patience | Tips | Eats | Walks | From |
|---|---|---|---|---|---|---|
| Regular | — | 1× | 1× | 1× | 1× | wave 1 |
| Grandparent | CHILL (green) | 1.5× | 1.2× | 1.6× slower | 0.6× | wave 2 |
| Kid | KID (blue), smaller | 0.85× | 0.7× | 0.6× | 1.25× | wave 3; only orders burgers |
| Rusher | RUSH (orange), suit | 0.7× | 1.6× | 0.5× | 1.3× | wave 4 |
| Critic | VIP (gold), gold ticket | 15 s fixed | 3× | 1× | 1× | wave 7 (2 per wave) |
| Big Tipper | $$$, glittering gold | 1.1× | 3× | 1× | 1× | 8% of guests from wave 2 |

## 6b2. Diner pets — Adoption Day

After every 5th wave cleared there's an **Adoption Day**: meet up to three shelter pets and adopt one, or decline ("not today"). Adoption is free and the pet stays for the rest of the run. Closing Time never "clears", so there **every 20 guests served counts as 5 waves** and brings another Adoption Day.

| Pet | Kind | Bonus | Behaviour |
|---|---|---|---|
| SUNNY | Golden retriever | Guests within range lose patience 50% slower | Wanders; often follows the Server |
| BISCUIT | Corgi | Guests served within range tip +30% | Wanders; often follows the Server |
| BEANS | Beagle | Guests waiting in the queue lose patience 50% slower | Stays by the front door |
| MOCHI | Tabby cat | Guests within range eat twice as fast (tables free up sooner) | Naps, moves rarely |
| PEPPER | Black cat | Big Tippers appear twice as often | Naps, moves rarely |
| NOODLE | Siamese cat | Petting gives +6 s (not +3 s), cooldown 12 s (not 20 s) | Naps, moves rarely |

- Pets with an area bonus show a faint ring on the floor, so you can see and plan around their range.
- **Petting:** walk up to any pet and press A ("A: PET SUNNY"). Every waiting guest gets +3 s of patience, with hearts and a woof or meow. Then "SUNNY IS HAPPY" during a 20 s cooldown. The AI Server pets them when it has nothing urgent to do.
- Ethics note: pets are companions, not a collection to grind. They can't be bought, lost, starved or neglected; nothing bad happens to them, and the run-over screen remembers them by name.

## 6c. Rewards

- **Streak:** every serve without a walkout adds 5% to tips, up to +50% (Lucky Streak: 10%, up to +100%). Shown as `x1.25` in the HUD; the tip sound climbs in pitch as it grows; milestone pops at 3, 5, 10, 15 and 20. A walkout resets it with a quiet grey "STREAK RESET", not a punishment screen.
- **Serve quality:** PERFECT (served with ≥70% patience left) = +$2; CLUTCH (saved with <15% left) = +$3. Clutch saves are celebrated on purpose: rescuing a guest at the last second is the best feeling in the genre.
- **Wave report card:** 3 stars = no walkouts and at least half the serves PERFECT; 2 = no walkouts; 1 = cleared. Star bonus tips = [0, 3, 8, 15][stars] + wave × stars. Stars land one by one with rising notes; 3 stars throws confetti.
- **Drafts** before waves 3, 5, 7, 9 and 11 (was 3 and 6): a new toy every couple of waves.
- **Personal bests:** high score table, best streak, stars earned, perfect serves. "NEW BEST STREAK!" only compares against your own past runs.

## 6d. Ethical fun: how the game uses reward loops

The game deliberately uses the feel-good parts of reward psychology (clear goals, immediate feedback, escalating juice, celebration of mastery) and deliberately avoids the manipulative parts.

**We do**
- Reward **skill and teamwork**: streaks, PERFECT and CLUTCH, and stars all come from playing well together, never from time spent or money.
- Give **immediate, honest feedback**: every reward says what earned it (`+$12`, `PERFECT!`, `3 STREAK!`), and every guest trait is labelled.
- Celebrate **comebacks** (CLUTCH, shop lives) so a bad moment never feels like the end.
- Let players choose their **challenge**: EASY is a first-class mode, a shorter night with more breathing room, not a penalty. HARD is a longer night that pays a bit more for the extra pressure. Button prompts can be switched off once you've learned the game.
- Keep surprises **small and free**: the Big Tipper is a pleasant random moment. It can't be bought, saved up for or chased outside play.
- Respect **time and attention**: runs are about 18 minutes and end cleanly; the game pauses itself when you look away; nothing happens while you're gone.

**We don't**
- No daily login rewards, streak-keeping calendars, timers that run while you're away, or "come back or lose it" mechanics.
- No real-money purchases, loot boxes or paid randomness. Tips are earned and spent only inside a run.
- No shaming on failure: walkouts get a short grey note, and the run-over screen leads with what you achieved.
- No fake scarcity or FOMO events; all content is available every run.
- No comparing players against strangers: high scores are local and personal.

## 6e. Balance audit (soak data)

Bot-vs-bot runs (Sharp bots, Normal / Medium difficulty unless noted; `?autoplay&diff=EASY|MEDIUM|HARD` picks one) log every wave: serves, PERFECTs, walkouts and **where each walkout happened** (in the queue, following, waiting to order, or waiting for food).

Findings from the v0.6 soaks:
- Waves 1–4 are clean for the bots (0–1 walkouts), which is right for the onboarding half of a run.
- **Every walkout from wave 3 on happened while waiting for food**: the kitchen is the bottleneck, not the Server. One bot run with Charm Aura reached wave 7 with zero walkouts; one with Roller Skates + Double Grill lost all lives in wave 6. Drafts matter, but the swing was too big, so waves 6–7 now spawn every 11 s (was 10 s). Humans parallelise the kitchen better than the one-plate-at-a-time bot cook, so bots are a floor, not a target.
- Second soak round (4 runs): 3 of 4 hit the kitchen wall in waves 5–6, all walkouts while waiting for food; only a Charm Aura run reached wave 8. Waves 5–6 now have 7 guests every 12 s, wave 7 has 8, and food patience is 1.9× (was 1.75×).
- Third soak round (0.9.0, 4 runs): runs ended on waves 4, 6, 6 and 6, every loss from guests waiting for food. Food patience is now 2.05× (was 1.9×); a re-soak of 2 runs then cleared waves 1–7 with zero walkouts in waves 5–6, and both fell in wave 8, the final wave.
- Fourth soak round (0.10.0): the losses turned out to be an **AI cook bug**, not tuning. The cook marked the oldest matching ticket as sent while the Server served the most impatient guest, so a ticket could be left orphaned and the cook idled while that guest starved; it also never fetched a part stashed on the spare assembly counter. With both fixed, the bots ran Easy waves 1–7 with zero walkouts and won Easy, and on Medium reached waves 8–9. The remaining wall was the step into Full House (arrivals +37% over wave 7, a full-lives wipe in one wave), now a pair every 18 s (was 16 s); Night Owls has fewer rushers (+3, was +5) and a guest every 13 s (was 12 s).
- **Tip inflation:** with streaks, stars, guest multipliers and chains, late waves pay ~$30 per guest (~$250 per wave by wave 6), which made a $30 life meaningless. Shop prices now scale +35% per wave after wave 2, and each extra life costs more than the last (30, 50, 80, 120… before scaling).

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
   ├─ ai/                    grid + BFS pathing, BotInput, Bot task runner, CookBot, ServerBot
   ├─ state/                 bus.js (signal bus), RunState.js (lives/tips/wave/modifiers), scores.js (local top 5)
   ├─ entities/              Player, Customer, items
   ├─ stations/              Crate, Counter, Hook, Board, Grill, PlateStack, Sink, Bin, Table
   ├─ ui/                    Hud, TicketRail, Menu, PauseOverlay, fx
   └─ scenes/                Boot → Lobby → Game (+ Shop, Draft overlays) → GameOver
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

**Slice 1 — playable loop**
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

**Slice 2 — depth**
- [x] Fire from wave 5: burnt-on-grill → fire → extinguisher, patience drain while burning
- [x] Shop between waves (life, plate, calm music) + paid draft reroll
- [x] Octo-Tray, Ingredient Cannon (all 9 power-ups live)
- [x] Pause menu (resume / restart / quit) and pad-disconnect pause with rebinding
- [x] Per-wave hint line

**Slice 3 — solo + polish**
- [x] AI teammate for solo play (Cook or Server), and a bot-vs-bot autoplay mode
- [x] Soak tests with bot-vs-bot runs. They found two bot bugs (walking through chairs, looping on the queue) and showed wave 4 was a cliff: pairs every 14 s plus the new deluxe recipe needed a dish every ~7 s. Balance pass: wave 4 down to 6 customers in pairs every 18 s, gentler waves 5–9, food patience 1.5× → 1.75×
- [x] Critic tickets marked VIP in gold; tickets flash red under 20% patience
- [x] Following customers lose patience at half speed
- [x] Local top-5 high scores (tips), shown on game over and in the lobby

**Slice 4 — ready for players**
- [x] Title screen, main menu, How to Play, Settings, High Scores, attract demo
- [x] AI teammate skill levels, picked in the lobby or in Settings
- [x] Procedural music (menu and in-game), ducked while paused
- [x] Launcher: loading screen, load-failure and crash screens, fullscreen button (F), touch-device notice, favicon and page metadata
- [x] Auto-pause on window blur; inputs ignore buttons still held from the previous screen
- [x] GitHub Pages workflow (build on PR, deploy master); relative asset paths

**Slice 5 — fun and feedback**
- [x] Context button prompts over whatever you face ("A: GRAB BUN", "X: HOLD TO CHOP"), using the player's real buttons; toggle in Settings
- [x] Guest variety (grandparents, kids, rushers, big tippers) with visible tags
- [x] Streaks, PERFECT/CLUTCH serves, wave report card with stars and bonus tips, personal bests
- [x] Four new power-ups; drafts before waves 3, 5 and 7
- [x] Difficulty: Easy 8 / Medium 10 / Hard 12 waves (lobby X, or Settings), recorded with high scores
- [x] How to Play page for guests and tips

**Slice 6 — diner pets**
- [x] Adoption Day after every 5th wave (every 20 serves in Closing Time): 3 dogs, 3 cats, one bonus each
- [x] Pets wander (grid pathing), show their range, can be petted for a patience boost; the AI Server pets them too
- [x] How to Play page; pets named on the run-over screen

**Slice 7 — loop, balance and look**
- [x] Prep time, chain bonus, wave progress bar, LAST GUESTS call with faster music
- [x] Rhythm chop, perfect sear, chef's kiss quality bonus; dirty plates through the pass
- [x] Shop prices scale with the wave; escalating life price; waves 6–7 eased
- [x] Art: night windows, hanging utensils, plants, entrance rug, neon sign, checked tablecloths, vignette; walk-cycle frames for every character; seated guests sit behind the table; tip coins fly to the HUD; coin icon; empty-rail hint
- [x] Pops stay inside the play area

**Next**
- [ ] Real playtest on two pads; tune against human numbers (bots are a floor, not a ceiling)
- [ ] Chop timing mini-game (hit X in the sweet spot for a speed bonus)
- [ ] Real art pass
- [ ] Rebindable controls

## Changes from v0.9

| v0.9 said | Problem | Now |
|---|---|---|
| Two players on one keyboard | Keyboard ghosting drops simultaneous keys | **Two gamepads**; keyboard is only a fallback |
| Rumble on failed delivery | Keyboards can't rumble | Gamepad rumble + screen shake for everyone |
| Cook clicks a ticket to start cooking | Needs a mouse, which nobody has a hand free for | Tickets show the full recipe, so there's nothing to select |
| "9 waves to close" and "wave 9 endless" | Contradiction | Clear 8 = win; wave 9 = endless score chase |
| "+15% per wave" and hand-designed waves | Contradiction | Hand-authored 1–8; +15% steps only in endless |
| Wave 2 patience 35 s > 30 s base | Lunch rush easier than the base | Patience curve 45 → 26 s, critics 15 s |
| "Shop unlocks" at wave 3, but no shop design | Tips had no use | Shop after every wave from wave 2; tips are both currency and score |
| Cook "kitchen locked" but free WASD movement | Unclear | Cook moves freely *inside* the kitchen; doorway blocks only the Cook |
| Camera lerps to players' midpoint | Unnecessary on one screen; can push a player off-screen | Fixed camera |
| Godot 4.3 project tree / prompts | Repo is Phaser | Phaser architecture (§7) |
