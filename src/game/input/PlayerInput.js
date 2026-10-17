import Phaser from 'phaser'
import Settings from '@/game/state/settings'

const KC = Phaser.Input.Keyboard.KeyCodes

// Keyboard fallback per role. Each role always listens to its own scheme,
// on top of the gamepad assigned in the lobby (if any).
export const KEY_SCHEMES = {
  cook: {
    up: KC.W, down: KC.S, left: KC.A, right: KC.D, interact: KC.SPACE, use: KC.E, throw: KC.Q, back: KC.BACKSPACE, pause: KC.ESC
  },
  server: {
    up: KC.UP, down: KC.DOWN, left: KC.LEFT, right: KC.RIGHT, interact: KC.ENTER, use: KC.SHIFT, throw: KC.FORWARD_SLASH, back: KC.BACKSPACE, pause: KC.ESC
  }
}

export const PAD = { A: 0, B: 1, X: 2, Y: 3, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 }

export const PAD_ACTIONS = {
  interact: PAD.A, use: PAD.X, throw: PAD.Y, back: PAD.B, pause: PAD.START, up: PAD.UP, down: PAD.DOWN, left: PAD.LEFT, right: PAD.RIGHT
}

const DEADZONE = 0.25
const FLICK_ON = 0.6
const FLICK_OFF = 0.3

// The browser's own list is the source of truth: Phaser keeps a stale snapshot
// of a pad after it is unplugged.
// isDown alone misses a tap that goes down and up between two frames, and
// Phaser's key-up clears JustDown too. A new key-down timestamp since the
// last poll catches it.
const lastDown = new WeakMap()
export function keyDown (key) {
  const fresh = key.timeDown > 0 && lastDown.get(key) !== key.timeDown
  lastDown.set(key, key.timeDown)
  return key.isDown || fresh
}

export function nativePadConnected (index) {
  if (index === null || index === undefined || !navigator.getGamepads) return false
  const pad = navigator.getGamepads()[index]
  return !!(pad && pad.connected)
}

export default class PlayerInput {
  constructor (scene, role, padIndex = null) {
    this.scene = scene
    this.role = role
    this.padIndex = padIndex
    this.keys = scene.input.keyboard.addKeys(KEY_SCHEMES[role])
    this.now = {}
    this.prev = {}
    this.move = new Phaser.Math.Vector2()
    this.nav = { x: 0, y: 0 }
    this.latch = { x: false, y: false }
    // The first few polls in a scene only record state: a button still held
    // from whatever opened this scene must not count as a fresh press. (A new
    // scene's gamepad plugin takes a frame or two to report held buttons.)
    this.settleFrames = 3
  }

  get pad () {
    if (this.padIndex === null || !this.scene.input.gamepad) return null
    if (!nativePadConnected(this.padIndex)) return null
    return this.scene.input.gamepad.getPad(this.padIndex) || null
  }

  // True when a pad was assigned but is no longer plugged in.
  get padLost () {
    return this.padIndex !== null && !nativePadConnected(this.padIndex)
  }

  update () {
    this.prev = this.now
    const pad = this.pad
    const k = this.keys
    this.now = {}
    Object.entries(PAD_ACTIONS).forEach(([action, button]) => {
      const b = pad && pad.buttons[button]
      this.now[action] = keyDown(k[action]) || !!(b && b.pressed)
    })

    let sx = 0
    let sy = 0
    if (pad && pad.leftStick && Math.hypot(pad.leftStick.x, pad.leftStick.y) > DEADZONE) {
      sx = pad.leftStick.x
      sy = pad.leftStick.y
    }
    const stick = sx || sy
    const dx = (this.now.right ? 1 : 0) - (this.now.left ? 1 : 0)
    const dy = (this.now.down ? 1 : 0) - (this.now.up ? 1 : 0)
    this.move.set(stick ? sx : dx, stick ? sy : dy)
    if (this.move.length() > 1) this.move.normalize()

    // One-shot menu navigation: d-pad/key presses or a stick flick.
    this.nav.x = (this.pressed('right') ? 1 : 0) - (this.pressed('left') ? 1 : 0)
    this.nav.y = (this.pressed('down') ? 1 : 0) - (this.pressed('up') ? 1 : 0)
    this.flick('x', sx)
    this.flick('y', sy)
    if (this.settleFrames > 0) {
      this.settleFrames--
      this.prev = { ...this.now }
      this.nav.x = 0
      this.nav.y = 0
    }
  }

  flick (axis, value) {
    if (Math.abs(value) > FLICK_ON && !this.latch[axis]) {
      this.latch[axis] = true
      if (!this.nav[axis]) this.nav[axis] = Math.sign(value)
    } else if (Math.abs(value) < FLICK_OFF) {
      this.latch[axis] = false
    }
  }

  held (action) {
    return !!this.now[action]
  }

  pressed (action) {
    return !!this.now[action] && !this.prev[action]
  }

  // Gamepad rumble where the browser supports it. Callers pair it with a
  // screen shake so keyboard players get feedback too.
  rumble (duration = 200, strong = 0.7, weak = 0.4) {
    if (!Settings.rumble) return
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
