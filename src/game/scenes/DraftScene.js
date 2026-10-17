import Phaser from 'phaser'
import { WIDTH, HEIGHT, FONT, CSS, COLORS, SHOP } from '@/game/constants'
import { draftOptions } from '@/game/data/powerups'
import PlayerInput from '@/game/input/PlayerInput'
import RunState from '@/game/state/RunState'
import { allBots } from '@/game/state/scores'
import { sfx } from '@/game/audio/sfx'

const CAT_COLOR = { COOK: COLORS.cook, SERVER: COLORS.server, DINER: COLORS.diner }
const CAT_CSS = { COOK: CSS.cook, SERVER: CSS.server, DINER: CSS.diner }
const CARD_W = 168
const CARD_H = 180

// Pick 1 of 3 power-ups. Either player can move the cursor, confirm, or
// spend tips on a reroll.
export default class DraftScene extends Phaser.Scene {
  constructor () {
    super({ key: 'DraftScene' })
  }

  init (data) {
    this.onPick = data.onPick
    this.options = draftOptions(RunState.modifiers)
    this.done = false
    this.cards = []
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
    this.rerollPrice = RunState.price(SHOP.reroll)
    this.add.text(WIDTH / 2, 322, 'LEFT / RIGHT TO CHOOSE  -  A TO PICK', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
    this.rerollText = this.add.text(WIDTH / 2, 340, '', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    this.buildCards()
    // Nobody to choose in a bot-only run.
    if (allBots(this.registry)) this.time.delayedCall(700, () => this.finish(this.cards[this.cursor].pu))
  }

  buildCards () {
    this.cards.forEach(card => card.c.destroy())
    const n = this.options.length
    this.cards = this.options.map((pu, i) => {
      const x = WIDTH / 2 + (i - (n - 1) / 2) * (CARD_W + 16)
      const c = this.add.container(x, 196)
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
      return { c, bg, pu }
    })
    this.select(Math.floor(n / 2))
  }

  select (i) {
    this.cursor = Phaser.Math.Wrap(i, 0, this.cards.length)
    this.cards.forEach((card, j) => {
      const on = j === this.cursor
      card.bg.setStrokeStyle(on ? 3 : 2, on ? CAT_COLOR[card.pu.cat] : COLORS.panelEdge)
      this.tweens.add({ targets: card.c, scale: on ? 1.06 : 1, y: on ? 190 : 196, duration: 140, ease: 'Back.easeOut' })
    })
  }

  reroll () {
    if (!RunState.spend(this.rerollPrice)) {
      sfx('error')
      return
    }
    this.options = draftOptions(RunState.modifiers)
    sfx('buy')
    this.buildCards()
  }

  update () {
    if (!this.inputs || this.done) return
    const canReroll = RunState.tips >= this.rerollPrice
    this.rerollText.setText(`Y: REROLL FOR $${this.rerollPrice}  (YOU HAVE $${RunState.tips})`)
    if (this.canReroll !== canReroll) {
      this.canReroll = canReroll
      this.rerollText.setColor(canReroll ? CSS.white : CSS.dim)
    }
    for (const inp of this.inputs) {
      inp.update()
      if (inp.nav.x) {
        this.select(this.cursor + inp.nav.x)
        sfx('select')
      }
      if (inp.pressed('throw')) this.reroll()
      if (inp.pressed('interact')) {
        this.finish(this.cards[this.cursor].pu)
        return
      }
    }
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
