import Phaser from 'phaser'
import { WIDTH, HEIGHT, FONT, CSS, COLORS } from '@/game/constants'
import { draftOptions } from '@/game/data/powerups'
import PlayerInput from '@/game/input/PlayerInput'
import RunState from '@/game/state/RunState'
import { sfx } from '@/game/audio/sfx'

const CAT_COLOR = { COOK: COLORS.cook, SERVER: COLORS.server, DINER: COLORS.diner }
const CAT_CSS = { COOK: CSS.cook, SERVER: CSS.server, DINER: CSS.diner }
const CARD_W = 168
const CARD_H = 180

// Pick 1 of 3 power-ups. Either player can move the cursor and confirm.
export default class DraftScene extends Phaser.Scene {
  constructor () {
    super({ key: 'DraftScene' })
  }

  init (data) {
    this.onPick = data.onPick
    this.options = draftOptions(RunState.modifiers)
  }

  create () {
    if (!this.options.length) {
      this.finish(null)
      return
    }
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x120f1a, 0.9).setOrigin(0)
    this.add.text(WIDTH / 2, 30, 'POWER-UP DRAFT', { fontFamily: FONT, fontSize: '16px', color: CSS.diner }).setOrigin(0.5)
    this.add.text(WIDTH / 2, 52, `BEFORE WAVE ${RunState.wave}  -  PICK 1`, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)

    const bindings = this.registry.get('bindings') || {}
    this.inputs = [new PlayerInput(this, 'cook', bindings.cook), new PlayerInput(this, 'server', bindings.server)]
    this.stickLatch = this.inputs.map(() => false)

    const n = this.options.length
    this.cards = this.options.map((pu, i) => {
      const x = WIDTH / 2 + (i - (n - 1) / 2) * (CARD_W + 16)
      const y = 196
      const c = this.add.container(x, y)
      const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, COLORS.panel).setStrokeStyle(2, COLORS.panelEdge)
      const cat = this.add.text(-CARD_W / 2 + 8, -CARD_H / 2 + 8, pu.cat, { fontFamily: FONT, fontSize: '8px', color: CAT_CSS[pu.cat] })
      const rarity = this.add.text(CARD_W / 2 - 8, -CARD_H / 2 + 8, pu.rarity, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(1, 0)
      const icon = this.add.image(0, -32, pu.icon).setScale(3)
      const name = this.add.text(0, 14, pu.name, {
        fontFamily: FONT, fontSize: '8px', color: CSS.white, align: 'center', wordWrap: { width: CARD_W - 16 }
      }).setOrigin(0.5, 0)
      const desc = this.add.text(0, 40, pu.desc, {
        fontFamily: FONT, fontSize: '8px', color: CSS.dim, align: 'center', lineSpacing: 4, wordWrap: { width: CARD_W - 20 }
      }).setOrigin(0.5, 0)
      c.add([bg, cat, rarity, icon, name, desc])
      return { c, bg, pu, icon }
    })

    this.add.text(WIDTH / 2, 330, 'LEFT / RIGHT TO CHOOSE  -  A TO PICK', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
    this.cursor = Math.floor(n / 2)
    this.select(this.cursor)
  }

  select (i) {
    this.cursor = Phaser.Math.Wrap(i, 0, this.cards.length)
    this.cards.forEach((card, j) => {
      const on = j === this.cursor
      card.bg.setStrokeStyle(on ? 3 : 2, on ? CAT_COLOR[card.pu.cat] : COLORS.panelEdge)
      this.tweens.add({ targets: card.c, scale: on ? 1.06 : 1, y: on ? 190 : 196, duration: 140, ease: 'Back.easeOut' })
    })
  }

  update () {
    if (!this.inputs) return
    this.inputs.forEach((inp, i) => {
      inp.update()
      let dir = 0
      if (inp.pressed('left')) dir = -1
      if (inp.pressed('right')) dir = 1
      const sx = inp.move.x
      if (Math.abs(sx) > 0.6 && !this.stickLatch[i] && !inp.held('left') && !inp.held('right')) {
        dir = Math.sign(sx)
        this.stickLatch[i] = true
      } else if (Math.abs(sx) < 0.3) {
        this.stickLatch[i] = false
      }
      if (dir) {
        this.select(this.cursor + dir)
        sfx('select')
      }
      if (inp.pressed('interact')) this.finish(this.cards[this.cursor].pu)
    })
  }

  finish (pu) {
    if (this.done) return
    this.done = true
    if (pu) {
      RunState.modifiers.add(pu.id)
      sfx('confirm')
    }
    this.scene.stop()
    this.onPick(pu)
  }
}
