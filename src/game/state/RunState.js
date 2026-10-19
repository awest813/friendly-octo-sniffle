import { TUNING } from '@/game/constants'
import Settings, { DIFFICULTIES } from '@/game/state/settings'
import { LAYOUTS } from '@/game/data/map'

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
    this.streak = 0
    this.bestStreak = 0
    this.perfect = 0
    this.clutch = 0
    this.stars = 0
    this.pets = []
    this.livesBought = 0
    this.petted = 0
    // Tonight's Special: rolled before the shop so it can be previewed there.
    this.nextSpecial = null
    this.lastSpecial = null
    // A random dining-room floor plan for each run (?layout=COZY forces one).
    const ids = Object.keys(LAYOUTS)
    const forced = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('layout')
    this.layout = ids.includes(forced) ? forced : ids[Math.floor(Math.random() * ids.length)]
    // Locked in for the whole run so it can't be changed mid-way.
    this.difficulty = DIFFICULTIES[Settings.difficulty] ? Settings.difficulty : 'MEDIUM'
  },

  get diff () {
    return DIFFICULTIES[this.difficulty]
  },

  // Waves to clear to save the diner: 8 / 10 / 12 by difficulty.
  get goal () {
    return this.diff.waves
  },

  // Each serve without a walkout adds 5% to tips, up to +50%
  // (Lucky Streak: 10% per serve, up to +100%).
  streakMult () {
    const lucky = this.has('clover')
    const step = lucky ? 0.1 : 0.05
    const cap = lucky ? 2 : 1.5
    return Math.min(cap, 1 + this.streak * step)
  },

  has (id) {
    return this.modifiers.has(id)
  },

  patienceMult () {
    let m = (this.has('charm') ? 1.3 : 1) * this.diff.patience
    if (this.calm) m *= 1.2
    return m
  },

  tipMult () {
    let m = 1
    if (this.has('charm')) m *= 1.15
    if (this.has('tips')) m *= 1.5
    return m * this.diff.tips
  },

  speedMult (role) {
    if (role === 'server' && this.has('skates')) return 1.4
    if (role === 'cook' && this.has('coffee')) return 1.3
    return 1
  },

  // Shop prices grow with the wave so the shop stays a real choice as tip
  // income grows (soak runs earn ~$250 a wave by wave 6).
  price (base) {
    const inflation = 1 + 0.35 * Math.max(0, this.wave - 2)
    return Math.round(base * inflation * (this.has('tips') ? 1.2 : 1))
  },

  spend (amount) {
    if (this.tips < amount) return false
    this.tips -= amount
    return true
  }
}

RunState.reset()

export default RunState
