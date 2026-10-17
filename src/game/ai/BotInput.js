import Phaser from 'phaser'

// Same surface as PlayerInput, but driven by a bot brain instead of hardware.
export default class BotInput {
  constructor () {
    this.padIndex = null
    this.padLost = false
    this.move = new Phaser.Math.Vector2()
    this.nav = { x: 0, y: 0 }
    this.now = {}
    this.prev = {}
    this.taps = new Set()
    this.holds = new Set()
  }

  tap (action) {
    this.taps.add(action)
  }

  hold (action, on) {
    if (on) this.holds.add(action)
    else this.holds.delete(action)
  }

  update () {
    this.prev = this.now
    this.now = {}
    this.holds.forEach(a => { this.now[a] = true })
    // A tap only lands if the button was up last frame.
    this.taps.forEach(a => { if (!this.prev[a]) this.now[a] = true })
    this.taps.clear()
  }

  held (action) {
    return !!this.now[action]
  }

  pressed (action) {
    return !!this.now[action] && !this.prev[action]
  }

  rumble () {}
}
