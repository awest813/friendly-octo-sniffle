import { TILE, MAP_TOP, TUNING, FONT } from '@/game/constants'
import { INGREDIENTS } from '@/game/data/recipes'
import {
  ItemView, ingredient, plate, combine, addToPlate, isCleanPlate, isDirtyPlate
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
    this.smoke = scene.add.particles(this.x, this.y - 8, 'smoke', {
      speedY: { min: -30, max: -15 }, speedX: { min: -8, max: 8 },
      lifespan: 900, alpha: { start: 0.6, end: 0 }, scale: { start: 1, end: 2 }, tint: 0x9a9aaa,
      emitting: false
    }).setDepth(8400)
  }

  accepts (item) {
    return item.type === 'ing' && item.id === 'patty' && item.state !== 'burnt'
  }

  onPlaced () {
    this.timer = this.item.state === 'cooked' ? TUNING.grillCookTime : 0
    sfx('sizzle')
  }

  onTaken () {
    this.timer = 0
  }

  update (dt) {
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
    } else {
      this.drawBar(null)
    }
    if (it.state === 'burnt' && Math.random() < dt * 14) this.smoke.emitParticle(1)
  }

  destroy () {
    super.destroy()
    this.smoke.destroy()
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
    if (!held && this.count > 0) {
      this.count--
      this.render()
      player.setItem(plate())
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
    if (this.dirty && !player.item) {
      this.setDirty(false)
      player.setItem(plate(true))
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
    if (c && c.state === 'waiting' && isCleanPlate(player.item) && player.item.contents.length) {
      return scene.deliver(c, player)
    }
    return false
  }
}
