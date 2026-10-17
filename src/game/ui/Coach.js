// First-waves coaching: a bouncing arrow over the next useful thing to do.
// The advice comes from the bot planners (CookBot / ServerBot), run in
// "advisor" mode for the human's player, so it always fits the situation.
const THINK_EVERY = 0.35

export default class Coach {
  constructor (scene, player, brain) {
    this.scene = scene
    this.player = player
    this.brain = brain
    this.brain.advisor = true
    this.timer = 0
    this.target = null
    this.arrow = scene.add.image(0, 0, 'arrow').setScale(1.5).setTint(player.color).setDepth(9650).setVisible(false)
  }

  update (dt, active) {
    if (!active) {
      this.arrow.setVisible(false)
      return
    }
    this.timer -= dt
    if (this.timer <= 0) {
      this.timer = THINK_EVERY
      const task = this.brain.decide()
      this.target = task ? task.target : null
    }
    // Already lined up with it: the button prompt takes over.
    const t = this.target
    if (!t || this.player.target === t || t.destroyed) {
      this.arrow.setVisible(false)
      return
    }
    const at = t.highlightAt()
    const bob = Math.sin(this.scene.time.now / 160) * 3
    this.arrow.setPosition(at.x, at.y - 30 + bob).setVisible(true)
  }

  destroy () {
    this.arrow.destroy()
  }
}
