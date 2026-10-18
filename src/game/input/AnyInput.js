import Phaser from 'phaser'
import { KEY_SCHEMES, PAD_ACTIONS, nativePadConnected, keyDown } from '@/game/input/PlayerInput'

const DEADZONE = 0.25
const FLICK_ON = 0.6
const FLICK_OFF = 0.3

// Menu input before anyone has claimed a role: every connected pad and both
// keyboard layouts drive the same cursor. Same surface as PlayerInput.
export default class AnyInput {
  constructor (scene) {
    this.scene = scene
    this.keys = [scene.input.keyboard.addKeys(KEY_SCHEMES.cook), scene.input.keyboard.addKeys(KEY_SCHEMES.server)]
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

  pads () {
    if (!this.scene.input.gamepad) return []
    return this.scene.input.gamepad.getAll().filter(p => nativePadConnected(p.index))
  }

  update () {
    this.prev = this.now
    this.now = {}
    const pads = this.pads()
    let sx = 0
    let sy = 0
    Object.entries(PAD_ACTIONS).forEach(([action, button]) => {
      this.now[action] = this.keys.some(k => keyDown(k[action])) ||
        pads.some(p => p.buttons[button] && p.buttons[button].pressed)
    })
    pads.forEach(p => {
      const s = p.leftStick
      if (s && Math.hypot(s.x, s.y) > Math.max(DEADZONE, Math.hypot(sx, sy))) {
        sx = s.x
        sy = s.y
      }
    })
    this.move.set(sx, sy)
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

  anyPressed () {
    return Object.keys(this.now).some(a => this.pressed(a)) || this.move.lengthSq() > 0.5
  }

  rumble () {}
}
