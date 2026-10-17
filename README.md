# Duo Diner

**One Cooks. One Serves. Both Panic.**

A couch co-op diner roguelike for two players on one screen. One of you runs the kitchen, the other
runs the floor. Survive 8 waves of hungry customers, draft power-ups, keep the grill from catching
fire, then hold out through the endless Closing Time for a high score.

Best with **two gamepads**. A keyboard works too, and if you're alone an **AI teammate** takes the
other role.

**Play in the browser:** https://awest813.github.io/friendly-octo-sniffle/
*(live once GitHub Pages is enabled; see [Deploying](#deploying))*

## Getting started

1. Plug in your gamepads (Xbox, PlayStation or Switch Pro all work), open the game and press any
   button.
2. Choose **PLAY**. The first pad to press **A** is the Cook, the second is the Server.
3. Playing solo? Join one role, then press **A** again. An AI teammate plays the other role. Press
   **Y** in the lobby to change how sharp it plays (Chill / Normal / Sharp).

New to the game? **HOW TO PLAY** on the title screen walks through everything in five short pages.

> Browsers only allow sound after a click or a key press. A gamepad button alone doesn't count, so
> if it's silent, click the page once.

## Controls

| Action | Gamepad | Keyboard — Cook | Keyboard — Server |
|---|---|---|---|
| Move | Left stick / D-pad | WASD | Arrow keys |
| Pick up / put down / greet / seat / order / serve | A | Space | Enter |
| Use (hold): chop at a board, spray the extinguisher | X | E | Shift |
| Throw (with Ingredient Cannon) / reroll the draft | Y | Q | / |
| Back | B | Backspace | Backspace |
| Pause menu | Start | Esc | Esc |
| Fullscreen | — | F | F |

The game pauses on its own if you switch windows or a gamepad disconnects. To carry on after a
disconnect, press A on any free pad, or that role's keyboard key.

## How to play

- **Cook:** take a plate from the stack and add a bun from its crate. Grill a patty (don't let it
  burn), add it to the plate, then put the plate on a yellow **pass** counter. Salads need chopped
  lettuce and tomato: put them on the board and hold X.
- **Server:** greet the customer at the front of the queue, lead them to a free table, take their
  order, carry the right plate from the pass, then bring the dirty plate back to the sink.
- From wave 5, burnt food left on the grill catches fire. Grab the red extinguisher and hold X on
  the grill. While anything burns, every customer loses patience faster.
- After each wave from wave 2, the **shop** sells lives, plates and calm music. Tips are both your
  money and your score.
- Three angry walkouts and the run is over. Your best runs are saved on this device.

**Settings** (title screen or pause menu): sound and music volume, screen shake, gamepad rumble,
AI teammate skill, fullscreen. They're saved in the browser.

## Development

```bash
npm install     # install dependencies
npm run serve   # dev server with live reload at localhost:8080
npm run build   # production build into dist/
npm start       # serve the production build at localhost:5000
```

- `localhost:8080/?autoplay` runs bot vs bot through full runs, choosing draft cards and shop items
  automatically and logging per-wave stats to the console. It's the soak and balance test.
- In development builds, `window.__duo` exposes the Phaser game and `RunState`.
- All art is generated at boot from pixel strings (`src/game/art/`). Sound effects and music come
  from a small WebAudio synth (`src/game/audio/`), so there are no binary assets.

```
src/
├─ components/  Vue launcher: loading screen, crash screen, fullscreen button
└─ game/
   ├─ data/      map (ASCII layout), recipes, waves, power-ups
   ├─ art/       pixel sprites → generated textures
   ├─ audio/     sfx + procedural music
   ├─ input/     gamepad-first input (PlayerInput), menu input from any device (AnyInput)
   ├─ ai/        pathfinding + bot teammates (CookBot, ServerBot)
   ├─ state/     signal bus, run state, settings, high scores
   ├─ entities/  players, customers, items
   ├─ stations/  crates, boards, grills, counters, plates, sink, bin, tables
   ├─ ui/        HUD, ticket rail, menus, pause overlay, effects
   └─ scenes/    Boot → Title (How to Play, Settings, High Scores) → Lobby → Game (+ Shop, Draft) → Game Over
```

The design doc is in [`docs/GDD.md`](docs/GDD.md).

## Deploying

`npm run build` produces a static site in `dist/` with relative paths, so it can be hosted from any
folder.

The included workflow (`.github/workflows/pages.yml`) builds every pull request and deploys `master`
to GitHub Pages. One-time setup: in the repository settings, go to **Pages → Build and deployment →
Source** and pick **GitHub Actions**.

Started from the [vue-phaser3](https://github.com/Sun0fABeach/vue-phaser3) template (MIT).
