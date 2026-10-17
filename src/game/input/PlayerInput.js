import Phaser from 'phaser'

const KC = Phaser.Input.Keyboard.KeyCodes

// Keyboard fallback per role. Each role always listens to its own scheme,
// on top of the gamepad assigned in the lobby (if any).
export const KEY_SCHEMES = {
  cook: { up: KC.W, down: KC.S, left: KC.A, right: KC.D, interact: KC.SPACE, use: KC.E, pause: KC.ESC },
  server: { up: KC.UP, down: KC.DOWN, left: KC.LEFT, right: KC.RIGHT, interact: KC.ENTER, use: KC.SHIFT, pause: KC.ESC }
}

export const PAD = { A: 0, B: 1, X: 2, Y: 3, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 }

const DEADZONE = 0.25
const ACTIONS = ['interact', 'use', 'pause', 'up', 'down', 'left', 'right']

export default class PlayerInput {
  constructor (scene, role, padIndex = null) {
    this.scene = scene
    this.role = role
    this.padIndex = padIndex
    this.keys = scene.input.keyboard.addKeys(KEY_SCHEMES[role])
    this.now = {}
    this.prev = {}
    this.move = new Phaser.Math.Vector2()
    // Prime twice so a button still held from the previous scene isn't a fresh press.
    this.update()
    this.update()
  }

  get pad () {
    if (this.padIndex === null || !this.scene.input.gamepad) return null
    const pad = this.scene.input.gamepad.getPad(this.padIndex)
    return pad && pad.connected ? pad : null
  }

  get usingPad () {
    return !!this.pad
  }

  update () {
    this.prev = this.now
    const pad = this.pad
    const btn = i => !!(pad && pad.buttons[i] && pad.buttons[i].pressed)
    const k = this.keys
    this.now = {
      interact: k.interact.isDown || btn(PAD.A),
      use: k.use.isDown || btn(PAD.X),
      pause: k.pause.isDown || btn(PAD.START),
      up: k.up.isDown || btn(PAD.UP),
      down: k.down.isDown || btn(PAD.DOWN),
      left: k.left.isDown || btn(PAD.LEFT),
      right: k.right.isDown || btn(PAD.RIGHT)
    }

    let x = (this.now.right ? 1 : 0) - (this.now.left ? 1 : 0)
    let y = (this.now.down ? 1 : 0) - (this.now.up ? 1 : 0)
    if (pad && pad.leftStick) {
      const sx = pad.leftStick.x
      const sy = pad.leftStick.y
      if (Math.hypot(sx, sy) > DEADZONE) {
        x = sx
        y = sy
      }
    }
    this.move.set(x, y)
    if (this.move.length() > 1) this.move.normalize()
  }

  held (action) {
    return !!this.now[action]
  }

  pressed (action) {
    return !!this.now[action] && !this.prev[action]
  }

  anyPressed () {
    return ACTIONS.some(a => this.pressed(a))
  }

  // Gamepad rumble where the browser supports it. Callers pair it with a
  // screen shake so keyboard players get feedback too.
  rumble (duration = 200, strong = 0.7, weak = 0.4) {
    const pad = this.pad
    const actuator = pad && ((pad.pad && pad.pad.vibrationActuator) || pad.vibration)
    if (!actuator || !actuator.playEffect) return
    try {
      const p = actuator.playEffect('dual-rumble', {
        startDelay: 0, duration, strongMagnitude: strong, weakMagnitude: weak
      })
      if (p && p.catch) p.catch(() => {})
    } catch (e) {
      // Unsupported actuator; screen shake still covers it.
    }
  }
}
