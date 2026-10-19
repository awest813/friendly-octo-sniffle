import Phaser from 'phaser'
import { TILE, MAP_TOP, FONT } from '@/game/constants'
import { MAP, KITCHEN_MAX_COL, PET_DOOR_TILES } from '@/game/data/map'
import { PETTING } from '@/game/data/pets'
import { tileOf, key, findPath, walkable } from '@/game/ai/grid'

const SPEED = 55

const center = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: MAP_TOP + ty * TILE + TILE / 2 })

// Dining-room floor a pet may wander to (not the queue line, not the kitchen).
function lounges () {
  const out = []
  MAP.forEach((row, ty) => [...row].forEach((ch, tx) => {
    if (tx > KITCHEN_MAX_COL + 1 && ch !== 'Q' && walkable(tx, ty, 'server')) out.push({ tx, ty })
  }))
  return out
}

export default class Pet {
  constructor (scene, def, x, y) {
    this.scene = scene
    this.def = def
    this.pos = new Phaser.Math.Vector2(x, y)
    this.path = []
    this.restFor = 1
    this.cooldown = 0
    this.walkTime = 0
    this.spots = lounges()

    this.ring = def.aura ? scene.add.circle(x, y, def.aura, def.color, 0.08).setStrokeStyle(1, def.color, 0.35).setDepth(2) : null
    this.shadow = scene.add.image(x, y, 'shadow').setScale(0.8)
    this.sprite = scene.add.image(x, y, def.texture).setOrigin(0.5, 1)
    this.name = scene.add.text(x, y, def.name, {
      fontFamily: FONT, fontSize: '8px', color: '#f4f4f4', stroke: '#1a1423', strokeThickness: 2
    }).setOrigin(0.5, 1).setAlpha(0.8)
    this.hearts = scene.add.particles(0, 0, 'heart', {
      speedY: { min: -40, max: -20 }, speedX: { min: -15, max: 15 }, lifespan: 900,
      scale: { start: 0.6, end: 0.2 }, alpha: { start: 1, end: 0 }, emitting: false
    }).setDepth(9400)
  }

  get anchors () {
    return [this.pos]
  }

  highlightAt () {
    return { x: this.pos.x, y: this.pos.y - 6 }
  }

  reachableBy () {
    return true
  }

  get boost () {
    return this.def.id === 'noodle' ? PETTING.noodleBoost : PETTING.boost
  }

  prompt () {
    return this.cooldown > 0 ? `${this.def.name} IS HAPPY` : `{A} PET ${this.def.name}`
  }

  interact () {
    if (this.cooldown > 0) return false
    this.cooldown = this.def.id === 'noodle' ? PETTING.noodleCooldown : PETTING.cooldown
    this.hearts.emitParticleAt(this.pos.x, this.pos.y - 16, 6)
    this.scene.onPetted(this)
    return true
  }

  // Pick somewhere to go: door pets stay by the entrance, loyal dogs often
  // trot after the Server, cats mostly nap.
  chooseSpot () {
    const def = this.def
    if (def.home === 'door') {
      const [tx, ty] = Phaser.Utils.Array.GetRandom(PET_DOOR_TILES)
      return { tx, ty }
    }
    const server = this.scene.server
    if (def.follows && Math.random() < 0.5) {
      const s = tileOf(server.feet.x, server.feet.y)
      const near = this.spots.filter(t => Math.abs(t.tx - s.tx) + Math.abs(t.ty - s.ty) <= 2)
      if (near.length) return Phaser.Utils.Array.GetRandom(near)
    }
    return Phaser.Utils.Array.GetRandom(this.spots)
  }

  update (dt) {
    this.cooldown = Math.max(0, this.cooldown - dt)
    if (this.path.length) {
      const next = center(this.path[0].tx, this.path[0].ty)
      const d = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, next.x, next.y)
      const step = SPEED * dt
      if (d <= step) {
        this.pos.set(next.x, next.y)
        this.path.shift()
      } else {
        this.pos.x += (next.x - this.pos.x) / d * step
        this.pos.y += (next.y - this.pos.y) / d * step
        if (Math.abs(next.x - this.pos.x) > 1) this.sprite.setFlipX(next.x < this.pos.x)
      }
      this.walkTime += dt * 14
      if (!this.path.length) this.restFor = this.def.lazy ? Phaser.Math.FloatBetween(8, 15) : Phaser.Math.FloatBetween(2, 5)
    } else {
      this.restFor -= dt
      if (this.restFor <= 0) {
        const goal = this.chooseSpot()
        const path = findPath(tileOf(this.pos.x, this.pos.y), new Set([key(goal.tx, goal.ty)]), 'server')
        if (path) this.path = path
        this.restFor = 1
      }
    }
    this.draw()
  }

  draw () {
    const { x, y } = this.pos
    const moving = this.path.length > 0
    const bob = moving ? -Math.abs(Math.sin(this.walkTime)) * 2 : 0
    // A happy pet glows faintly while its petting cooldown runs.
    this.sprite.setPosition(x, y + 8 + bob).setDepth(y).setTint(this.cooldown > 0 ? 0xffe0f0 : 0xffffff)
    this.shadow.setPosition(x, y + 6).setDepth(y - 1)
    this.name.setPosition(x, y - 10 + bob).setDepth(y + 1)
    if (this.ring) this.ring.setPosition(x, y + 2)
  }

  near (x, y) {
    return this.def.aura && Phaser.Math.Distance.Between(this.pos.x, this.pos.y, x, y) <= this.def.aura
  }
}
