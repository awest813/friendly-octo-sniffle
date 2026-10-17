import Phaser from 'phaser'
import { FONT } from '@/game/constants'
import { RECIPES } from '@/game/data/recipes'
import { GUESTS } from '@/game/data/guests'
import RunState from '@/game/state/RunState'

const WALK_SPEED = 70
const FOLLOW_GAP = 26

// States: entering → queued → following → ready → waiting → eating → leaving
// Any patience-ticking state (queued / following / ready / waiting) can turn
// into angry. Following ticks at half speed.
export default class Customer {
  constructor (scene, { x, y, texture, order, patience, guest = GUESTS.regular }) {
    this.scene = scene
    this.order = order
    this.basePatience = patience
    this.guest = guest
    this.critic = guest.id === 'critic'
    this.walkSpeed = WALK_SPEED * guest.walk
    this.state = 'entering'
    this.patience = patience
    this.patienceMax = patience
    this.table = null
    this.path = []
    this.onArrive = null
    this.eatTimer = 0
    this.pos = new Phaser.Math.Vector2(x, y)
    this.walkTime = 0

    this.shadow = scene.add.image(x, y, 'shadow')
    this.sprite = scene.add.image(x, y, guest.texture || texture).setOrigin(0.5, 1).setScale(guest.scale || 1)
    this.bubble = scene.add.container(x, y)
    this.bubbleBg = scene.add.image(0, 0, 'bubble')
    this.bubbleIcon = scene.add.image(0, -1, RECIPES[order].icon)
    this.bubbleText = scene.add.text(0, -1, '!', { fontFamily: FONT, fontSize: '8px', color: '#1a1423' }).setOrigin(0.5)
    this.bubble.add([this.bubbleBg, this.bubbleIcon, this.bubbleText]).setVisible(false)
    this.bar = scene.add.graphics()
    if (guest.tag) {
      this.crown = scene.add.text(x, y, guest.tag, {
        fontFamily: FONT, fontSize: '8px', color: guest.color, stroke: '#1a1423', strokeThickness: 2
      }).setOrigin(0.5, 1)
    }
    if (guest.golden) {
      this.sparkle = scene.add.particles(0, 0, 'px', {
        speed: { min: 6, max: 20 }, lifespan: 600, scale: { start: 1.5, end: 0 },
        tint: [0xffd93d, 0xffffff], frequency: 140, follow: this.pos, followOffset: { x: 0, y: -14 }
      }).setDepth(8900)
    }
  }

  get anchors () {
    return [this.pos]
  }

  highlightAt () {
    return { x: this.pos.x, y: this.pos.y - 10 }
  }

  prompt () {
    return this.scene.leading ? 'SEAT YOUR GUEST FIRST' : '{A} GREET'
  }

  reachableBy (player) {
    return player.role === 'server' && this.state === 'queued'
  }

  get ticking () {
    return this.state === 'queued' || this.state === 'following' || this.state === 'ready' || this.state === 'waiting'
  }

  get ratio () {
    return Phaser.Math.Clamp(this.patience / this.patienceMax, 0, 1)
  }

  resetPatience (mult = 1) {
    this.patienceMax = this.basePatience * mult
    this.patience = this.patienceMax
  }

  walk (points, onArrive) {
    this.path = points.map(p => new Phaser.Math.Vector2(p.x, p.y))
    this.onArrive = onArrive || null
  }

  setState (state) {
    this.state = state
    const showIcon = state === 'waiting'
    const showText = state === 'ready'
    this.bubble.setVisible(showIcon || showText)
    this.bubbleIcon.setVisible(showIcon)
    this.bubbleText.setVisible(showText)
  }

  // Returns true when patience just ran out.
  update (dt, leader, drain = 1) {
    if (this.state === 'following' && leader) {
      const c = leader.crumb(FOLLOW_GAP)
      this.stepTowards(c.x, c.y, WALK_SPEED * 2.2, dt)
    } else if (this.path.length) {
      const next = this.path[0]
      if (this.stepTowards(next.x, next.y, this.walkSpeed, dt)) {
        this.path.shift()
        if (!this.path.length && this.onArrive) {
          const cb = this.onArrive
          this.onArrive = null
          cb()
        }
      }
    }

    let expired = false
    if (this.ticking) {
      let rate = this.state === 'following' ? 0.5 : 1
      if (RunState.has('comfy') && (this.state === 'ready' || this.state === 'waiting')) rate *= 0.7
      this.patience -= dt * drain * rate
      expired = this.patience <= 0
    }
    if (this.state === 'eating') this.eatTimer -= dt

    this.draw()
    return expired
  }

  stepTowards (x, y, speed, dt) {
    const d = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, x, y)
    const step = speed * dt
    if (d <= step || d < 0.5) {
      this.pos.set(x, y)
      return true
    }
    if (d > 4) this.sprite.setFlipX(x < this.pos.x)
    this.pos.x += (x - this.pos.x) / d * step
    this.pos.y += (y - this.pos.y) / d * step
    this.walkTime += dt * 12
    return false
  }

  draw () {
    const { x, y } = this.pos
    const walking = this.path.length || this.state === 'following'
    const bob = walking ? -Math.abs(Math.sin(this.walkTime)) * 2 : 0
    this.sprite.setPosition(x, y + 5 + bob).setDepth(y)
    this.shadow.setPosition(x, y + 4).setDepth(y - 1)
    this.bubble.setPosition(x + 10, y - 36).setDepth(8000 + y)
    if (this.crown) this.crown.setPosition(x, y - (this.guest.scale ? 22 : 27) + bob).setDepth(y + 1)
    if (this.guest.golden && !this.angry) this.sprite.setTint(Math.floor(this.scene.time.now / 160) % 2 ? 0xfff0a0 : 0xffffff)

    this.bar.clear()
    if (this.ticking) {
      const w = 20
      const r = this.ratio
      const color = r > 0.5 ? 0x7ed957 : r > 0.2 ? 0xffd93d : 0xff4040
      this.bar.setDepth(8000 + y)
      this.bar.fillStyle(0x1a1423, 1).fillRect(x - w / 2 - 1, y - 30, w + 2, 4)
      this.bar.fillStyle(color, 1).fillRect(x - w / 2, y - 29, Math.max(1, w * r), 2)
    }
  }

  setAngry () {
    this.angry = true
    this.sprite.setTint(0xff6060)
    this.bubble.setVisible(true)
    this.bubbleIcon.setVisible(false)
    this.bubbleText.setText('!!').setColor('#ff4040').setVisible(true)
  }

  destroy () {
    [this.shadow, this.sprite, this.bubble, this.bar, this.crown, this.sparkle].forEach(o => o && o.destroy())
  }
}
