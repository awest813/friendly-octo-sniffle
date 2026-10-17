# Duo Diner

**One Cooks. One Serves. Both Panic.**

A two-player couch co-op roguelike about running a diner, built with Phaser 3 inside a Vue 3 host.
One player cooks in the kitchen, the other runs the floor. You have to survive 8 waves of customers,
draft power-ups along the way, then hold out through the endless Closing Time.

The design doc is in [`docs/GDD.md`](docs/GDD.md).

## Controls

Two gamepads are the main controls. In the lobby, the first pad to press **A** becomes the Cook,
the second becomes the Server.

| Action | Gamepad | Keyboard — Cook | Keyboard — Server |
|---|---|---|---|
| Move | Left stick / D-pad | WASD | Arrow keys |
| Pick up / put down / greet / seat / order / deliver | A | Space | Enter |
| Use (hold): chop at a board, spray the extinguisher | X | E | Shift |
| Throw (with Ingredient Cannon) / reroll the draft | Y | Q | / |
| Back / leave the shop | B | Backspace | Backspace |
| Pause menu | Start | Esc | Esc |

The keyboard controls are a fallback for testing, or for playing with only one pad.

**Playing alone?** Join one role, then press A (or your join key) again. An AI teammate takes the other role.

## How to play

- **Cook:** take a plate from the stack and add a bun from its crate. Grill a patty (don't let it burn), add it to
  the plate, then put the plate on a yellow pass counter. Salads need chopped lettuce and tomato: put them on the
  board and hold X.
- **Server:** greet the customer at the front of the queue, lead them to a free table, take their order, carry
  the right plate from the pass, then bring the dirty plate back to the sink in the kitchen.
- From wave 5, burnt food left on the grill catches fire. Grab the red extinguisher and hold X on the grill.
  While anything is burning, every customer loses patience faster.
- After each wave from wave 2, the shop sells lives, plates and calm music for tips. Tips are also your score.
- Three angry walkouts and the run is over.
- If a pad disconnects, the game pauses until that role presses A on a pad or takes over on the keyboard.

## Development

```bash
npm install     # install dependencies
npm run serve   # dev server with live reload at localhost:8080
npm run build   # production build into dist/
npm start       # serve the production build at localhost:5000
```

Open `localhost:8080/?autoplay` to watch two bots play a full run. Draft and shop choices are automatic, and
per-wave stats are logged to the console, which makes it useful as a soak and balance test.

All art is generated at boot from pixel strings (`src/game/art/`). Sound effects come from a tiny
WebAudio synth (`src/game/audio/sfx.js`), so the game has no binary assets yet. In development builds,
`window.__duo` exposes the Phaser game and `RunState` for debugging.

```
src/game/
├─ data/      map (ASCII layout), recipes, waves, power-ups
├─ art/       pixel sprites → generated textures
├─ input/     gamepad-first input with keyboard fallback and rumble
├─ ai/        pathfinding + bot teammates (CookBot, ServerBot)
├─ state/     signal bus + run state
├─ entities/  players, customers, items
├─ stations/  crates, boards, grills, counters, plates, sink, bin, tables
├─ ui/        HUD, ticket rail, menus, pause overlay, effects
└─ scenes/    Boot → Lobby → Game (+ Shop, Draft overlays) → GameOver
```

Started from the [vue-phaser3](https://github.com/Sun0fABeach/vue-phaser3) template (MIT).
