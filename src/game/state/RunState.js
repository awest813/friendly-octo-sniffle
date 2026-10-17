import { TUNING } from '@/game/constants'

const RunState = {
  reset () {
    this.wave = 0
    this.wavesCleared = 0
    this.lives = TUNING.lives
    this.tips = 0
    this.served = 0
    this.angry = 0
    this.modifiers = new Set()
    this.bonusPlates = 0
    this.calm = false
  },

  has (id) {
    return this.modifiers.has(id)
  },

  patienceMult () {
    let m = this.has('charm') ? 1.3 : 1
    if (this.calm) m *= 1.2
    return m
  },

  tipMult () {
    let m = 1
    if (this.has('charm')) m *= 1.15
    if (this.has('tips')) m *= 1.5
    return m
  },

  speedMult (role) {
    return role === 'server' && this.has('skates') ? 1.4 : 1
  },

  price (base) {
    return Math.round(base * (this.has('tips') ? 1.2 : 1))
  },

  spend (amount) {
    if (this.tips < amount) return false
    this.tips -= amount
    return true
  }
}

RunState.reset()

export default RunState
