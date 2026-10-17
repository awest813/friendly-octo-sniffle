import { TILE, MAP_TOP, TUNING, FONT } from '@/game/constants'
import { INGREDIENTS } from '@/game/data/recipes'
import {
  ItemView, ingredient, plate, tool, combine, addToPlate, isCleanPlate, isDirtyPlate, isTool, isServable
} from '@/game/entities/items'
import RunState from '@/game/state/RunState'
import { sfx } from '@/game/audio/sfx'

export function tileCenter (tx, ty) {
  return { x: tx * TILE + TILE / 2, y: MAP_TOP + ty * TILE + TILE / 2 }
}

export class Station {
  constructor (scene, tx, ty, texture) {
    this.scene = scene
    this.tx = tx
    this.ty = ty
    const c = tileCenter(tx, ty)
    this.x = c.x
    this.y = c.y
    this.anchors = [c]
    this.sprite = scene.add.image(c.x, c.y, texture).setDepth(c.y + 8)
    this.item = null
    this.itemView = new ItemView(scene, c.x, c.y - 6).setDepth(c.y + 9)
    this.bar = scene.add.graphics().setDepth(8500)
    scene.addSolid(c.x, c.y)
  }

  highlightAt () {
    return { x: this.x, y: this.y }
  }

  reachableBy () {
    return true
  }

  setItem (item) {
    this.item = item
    this.itemView.setItem(item)
  }

  refreshItem () {
    this.itemView.refresh()
  }

  accepts () {
    return true
  }

  onPlaced () {}
  onTaken () {}

  // Shared pick up / put down / combine-onto-plate rules for any slot.
  interact (player) {
    const held = player.item
    const here = this.item
    if (!held && here) {
      player.setItem(here)
      this.setItem(null)
      this.onTaken()
      sfx('pickup')
      return true
    }
    if (held && !here) {
      if (!this.accepts(held)) return false
      this.setItem(held)
      player.setItem(null)
      this.onPlaced()
      sfx('drop')
      return true
    }
    if (held && here) {
      const keeper = combine(held, here)
      if (keeper === 'player') {
        this.setItem(null)
        this.onTaken()
        player.refreshItem()
        sfx('pickup')
        return true
      }
      if (keeper === 'slot') {
        player.setItem(null)
        this.refreshItem()
        sfx('drop')
        return true
      }
      if (player.canStack(here)) {
        player.stack(here)
        this.setItem(null)
        this.onTaken()
        sfx('pickup')
        return true
      }
    }
    return false
  }

  // An item arriving without a player (Ingredient Cannon). Same rules as
  // putting it down by hand.
  receive (item) {
    if (!this.item) {
      if (!this.accepts(item)) return false
      this.setItem(item)
      this.onPlaced()
      return true
    }
    if (isCleanPlate(this.item) && addToPlate(this.item, item)) {
      this.refreshItem()
      return true
    }
    return false
  }

  use () {
    return false
  }

  update () {}

  drawBar (ratio, color, yOff = 14) {
    this.bar.clear()
    if (ratio === null) return
    const w = 24
    this.bar.fillStyle(0x1a1423, 1).fillRect(this.x - w / 2 - 1, this.y + yOff - 1, w + 2, 5)
    this.bar.fillStyle(color, 1).fillRect(this.x - w / 2, this.y + yOff, Math.max(1, w * ratio), 3)
  }

  destroy () {
    this.sprite.destroy()
    this.itemView.destroy()
    this.bar.destroy()
  }
}

export class Counter extends Station {
  constructor (scene, tx, ty, texture = 'counter') {
    super(scene, tx, ty, texture)
  }
}

// Where the extinguisher lives. Acts like a counter otherwise.
export class Hook extends Station {
  constructor (scene, tx, ty) {
    super(scene, tx, ty, 'hook')
    this.setItem(tool('extinguisher'))
  }
}

export class Board extends Station {
  constructor (scene, tx, ty) {
    super(scene, tx, ty, 'board')
    this.progress = 0
    this.chopSound = 0
    this.hint = scene.add.text(this.x, this.y - 22, 'X', {
      fontFamily: FONT, fontSize: '8px', color: '#1a1423', backgroundColor: '#00ffd0', padding: { x: 2, y: 1 }
    }).setOrigin(0.5).setDepth(8600).setVisible(false)
  }

  get choppable () {
    const it = this.item
    return !!it && it.type === 'ing' && INGREDIENTS[it.id].chop && it.state === 'raw'
  }

  onPlaced () {
    this.progress = 0
    if (this.choppable && RunState.has('chopper')) this.finishChop()
  }

  onTaken () {
    this.progress = 0
  }

  finishChop () {
    this.item.state = 'chopped'
    this.refreshItem()
    this.progress = 0
    sfx('chopDone')
  }

  use (player, dt) {
    if (player.item || !this.choppable) return false
    this.progress += dt
    this.chopSound -= dt
    if (this.chopSound <= 0) {
      sfx('chop')
      this.chopSound = 0.18
      this.scene.tweens.add({ targets: this.itemView, y: this.y - 8, duration: 50, yoyo: true })
    }
    if (this.progress >= TUNING.chopTime) this.finishChop()
    return true
  }

  update () {
    this.hint.setVisible(this.choppable && Math.floor(this.scene.time.now / 400) % 2 === 0)
    this.drawBar(this.progress > 0 ? this.progress / TUNING.chopTime : null, 0x00ffd0)
  }
}

export class Grill extends Station {
  constructor (scene, tx, ty) {
    super(scene, tx, ty, 'grill')
    this.timer = 0
    this.sizzle = 0
    this.fireTimer = 0
    this.onFire = false
    this.spray = 0
    this.sprayed = false
    this.smoke = scene.add.particles(this.x, this.y - 8, 'smoke', {
      speedY: { min: -30, max: -15 }, speedX: { min: -8, max: 8 },
      lifespan: 900, alpha: { start: 0.6, end: 0 }, scale: { start: 1, end: 2 }, tint: 0x9a9aaa,
      emitting: false
    }).setDepth(8400)
    this.flames = scene.add.particles(this.x, this.y - 4, 'flame', {
      x: { min: -10, max: 10 }, speedY: { min: -60, max: -25 }, speedX: { min: -10, max: 10 },
      lifespan: 520, scale: { start: 2.2, end: 0.4 }, tint: [0xffd93d, 0xf79a3e, 0xe8402f],
      frequency: 30, emitting: false
    }).setDepth(8450)
    this.foam = scene.add.particles(this.x, this.y - 6, 'smoke', {
      x: { min: -12, max: 12 }, speed: { min: 10, max: 40 }, lifespan: 450,
      alpha: { start: 0.9, end: 0 }, scale: { start: 1.5, end: 2.5 }, emitting: false
    }).setDepth(8460)
    this.hint = scene.add.text(this.x, this.y - 22, 'X', {
      fontFamily: FONT, fontSize: '8px', color: '#1a1423', backgroundColor: '#ff4040', padding: { x: 2, y: 1 }
    }).setOrigin(0.5).setDepth(8600).setVisible(false)
  }

  accepts (item) {
    return !this.onFire && item.type === 'ing' && item.id === 'patty' && item.state !== 'burnt'
  }

  interact (player) {
    if (this.onFire) return false
    return super.interact(player)
  }

  receive (item) {
    if (this.onFire) return false
    return super.receive(item)
  }

  onPlaced () {
    this.timer = this.item.state === 'cooked' ? TUNING.grillCookTime : 0
    sfx('sizzle')
  }

  onTaken () {
    this.timer = 0
    this.fireTimer = 0
  }

  use (player, dt) {
    if (!this.onFire || !isTool(player.item, 'extinguisher')) return false
    this.spray += dt
    this.sprayed = true
    if (Math.random() < dt * 30) this.foam.emitParticle(2)
    if (Math.random() < dt * 6) sfx('spray')
    if (this.spray >= TUNING.extinguishTime) this.extinguish()
    return true
  }

  ignite () {
    this.onFire = true
    this.fireTimer = 0
    this.spray = 0
    this.setItem(null)
    this.flames.start()
    this.scene.onFire(this)
  }

  extinguish () {
    this.onFire = false
    this.spray = 0
    this.flames.stop()
    this.sprite.clearTint()
    this.foam.emitParticle(12)
    this.scene.onFireOut(this)
  }

  update (dt) {
    if (this.onFire) {
      this.updateFire(dt)
      return
    }
    this.hint.setVisible(false)
    const it = this.item
    if (!it || it.type !== 'ing' || it.id !== 'patty') {
      this.drawBar(null)
      return
    }
    const cook = TUNING.grillCookTime
    const burn = TUNING.grillBurnTime
    if (it.state !== 'burnt') this.timer += dt

    this.sizzle -= dt
    if (this.sizzle <= 0 && it.state !== 'burnt') {
      sfx('sizzle')
      this.sizzle = 1.4
    }

    if (it.state === 'raw' && this.timer >= cook) {
      it.state = 'cooked'
      this.refreshItem()
      sfx('ready')
    } else if (it.state === 'cooked' && !RunState.has('ghost') && this.timer >= cook + burn) {
      it.state = 'burnt'
      this.refreshItem()
      this.scene.onBurn(this)
    }

    if (it.state === 'raw') {
      this.drawBar(this.timer / cook, 0xf79a3e)
    } else if (it.state === 'cooked' && !RunState.has('ghost')) {
      const r = (this.timer - cook) / burn
      const blink = r > 0.5 && Math.floor(this.scene.time.now / 150) % 2 === 0
      this.drawBar(1 - r, blink ? 0xffffff : 0xff4040)
      if (r > 0.4 && Math.random() < dt * 8) this.smoke.emitParticle(1)
    } else if (it.state === 'burnt' && this.scene.fireEnabled) {
      // Burnt food left on the grill catches fire.
      this.fireTimer += dt
      const blink = Math.floor(this.scene.time.now / 100) % 2 === 0
      this.drawBar(1 - this.fireTimer / TUNING.fireDelay, blink ? 0xffd93d : 0xff4040)
      if (this.fireTimer >= TUNING.fireDelay) this.ignite()
    } else {
      this.drawBar(null)
    }
    if (it.state === 'burnt' && Math.random() < dt * 14) this.smoke.emitParticle(1)
  }

  updateFire (dt) {
    if (!this.sprayed) this.spray = Math.max(0, this.spray - dt * 0.5)
    this.sprayed = false
    this.sprite.setTint(Math.floor(this.scene.time.now / 120) % 2 ? 0xff8060 : 0xffd0a0)
    if (Math.random() < dt * 10) this.smoke.emitParticle(1)
    this.hint.setVisible(Math.floor(this.scene.time.now / 300) % 2 === 0)
    this.drawBar(this.spray > 0 ? this.spray / TUNING.extinguishTime : null, 0xffffff)
  }

  destroy () {
    super.destroy()
    this.smoke.destroy()
    this.flames.destroy()
    this.foam.destroy()
    this.hint.destroy()
  }
}

export class Crate extends Station {
  constructor (scene, tx, ty, id) {
    super(scene, tx, ty, 'crate')
    this.id = id
    this.icon = scene.add.image(this.x, this.y - 1, `${id}_raw`).setDepth(this.y + 9)
  }

  interact (player) {
    const held = player.item
    if (!held) {
      player.setItem(ingredient(this.id))
      sfx('pickup')
      return true
    }
    if (isCleanPlate(held) && addToPlate(held, ingredient(this.id))) {
      player.refreshItem()
      sfx('pickup')
      return true
    }
    if (held.type === 'ing' && held.id === this.id && held.state === 'raw') {
      player.setItem(null)
      sfx('drop')
      return true
    }
    return false
  }

  receive () {
    return false
  }
}

export class PlateStack extends Station {
  constructor (scene, tx, ty) {
    super(scene, tx, ty, 'counter')
    this.count = TUNING.plateCount
    this.plates = []
    this.render()
  }

  addPlate () {
    this.count++
    this.render()
  }

  render () {
    this.plates.forEach(p => p.destroy())
    this.plates = []
    for (let i = 0; i < Math.min(this.count, 6); i++) {
      this.plates.push(this.scene.add.image(this.x, this.y - 2 - i * 3, 'plate').setDepth(this.y + 9 + i * 0.01))
    }
  }

  interact (player) {
    const held = player.item
    if (this.count > 0 && (!held || player.canStack(plate()))) {
      this.count--
      this.render()
      if (held) player.stack(plate())
      else player.setItem(plate())
      sfx('pickup')
      return true
    }
    if (isCleanPlate(held) && held.contents.length === 0) {
      player.setItem(null)
      this.addPlate()
      sfx('drop')
      return true
    }
    return false
  }

  receive () {
    return false
  }
}

export class Sink extends Station {
  constructor (scene, tx, ty, plateStack) {
    super(scene, tx, ty, 'sink')
    this.plateStack = plateStack
    this.queue = 0
    this.timer = 0
    this.countText = scene.add.text(this.x + 10, this.y - 14, '', {
      fontFamily: FONT, fontSize: '8px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(8600)
  }

  addDirty () {
    this.queue++
    this.render()
  }

  render () {
    this.itemView.setItem(this.queue > 0 ? plate(true) : null)
    this.countText.setText(this.queue > 1 ? `x${this.queue}` : '')
  }

  interact (player) {
    if (!isDirtyPlate(player.item)) return false
    player.setItem(null)
    this.addDirty()
    sfx('wash')
    return true
  }

  update (dt) {
    if (this.queue <= 0) {
      this.drawBar(null)
      return
    }
    this.timer += dt
    if (this.timer >= TUNING.washTime) {
      this.timer = 0
      this.queue--
      this.plateStack.addPlate()
      this.render()
      sfx('pickup')
    }
    this.drawBar(this.timer / TUNING.washTime, 0x69b4ea)
  }

  receive () {
    return false
  }
}

export class Bin extends Station {
  constructor (scene, tx, ty) {
    super(scene, tx, ty, 'bin')
  }

  interact (player) {
    const held = player.item
    if (held && held.type === 'ing') {
      player.setItem(null)
      sfx('drop')
      return true
    }
    if (isCleanPlate(held) && held.contents.length) {
      held.contents = []
      player.refreshItem()
      sfx('drop')
      return true
    }
    return false
  }

  receive (item) {
    return item.type === 'ing'
  }
}

// Table tile plus the chair to its right. Front-of-house actions go through here.
export class Table extends Station {
  constructor (scene, tx, ty, number) {
    super(scene, tx, ty, 'table')
    this.number = number
    const seat = tileCenter(tx + 1, ty)
    this.seat = seat
    this.anchors = [{ x: this.x, y: this.y }, seat]
    this.chair = scene.add.image(seat.x, seat.y, 'chair').setDepth(seat.y - 2)
    scene.addSolid(seat.x, seat.y)
    this.open = false
    this.customer = null
    this.dirty = false
    this.itemView.setPosition(this.x, this.y - 4)
    this.label = scene.add.text(this.x - 10, this.y - 12, `${number}`, {
      fontFamily: FONT, fontSize: '8px', color: '#ffd93d'
    }).setOrigin(0.5).setDepth(this.y + 10)
  }

  highlightAt () {
    return { x: (this.x + this.seat.x) / 2, y: this.y }
  }

  reachableBy (player) {
    return player.role === 'server' && this.open
  }

  get free () {
    return this.open && !this.customer && !this.dirty
  }

  setOpen (open) {
    this.open = open
    this.sprite.setTexture(open ? 'table' : 'table_closed')
    this.label.setVisible(open)
  }

  setDirty (dirty) {
    this.dirty = dirty
    this.itemView.setItem(dirty ? plate(true) : null)
  }

  interact (player) {
    const scene = this.scene
    if (this.dirty && (!player.item || player.canStack(plate(true)))) {
      this.setDirty(false)
      if (player.item) player.stack(plate(true))
      else player.setItem(plate(true))
      sfx('pickup')
      return true
    }
    if (scene.leading && this.free) {
      scene.seat(scene.leading, this)
      return true
    }
    const c = this.customer
    if (c && c.state === 'ready') {
      scene.takeOrder(c)
      return true
    }
    if (c && c.state === 'waiting' && (isServable(player.item) || isServable(player.extra))) {
      return scene.deliver(c, player)
    }
    return false
  }

  receive () {
    return false
  }
}
