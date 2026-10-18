import Phaser from 'phaser'
import { WIDTH, HEIGHT, FONT, CSS, COLORS } from '@/game/constants'
import { adoptionOptions } from '@/game/data/pets'
import PlayerInput from '@/game/input/PlayerInput'
import RunState from '@/game/state/RunState'
import { allBots } from '@/game/state/scores'
import { sfx } from '@/game/audio/sfx'

const CARD_W = 168
const CARD_H = 196

// Adoption Day: meet up to three shelter pets and take one home to the
// diner. Free, optional, and they stay for the whole run.
export default class AdoptScene extends Phaser.Scene {
  constructor () {
    super({ key: 'AdoptScene' })
  }

  init (data) {
    this.onDone = data.onDone
    this.options = adoptionOptions(RunState.pets)
    this.done = false
  }

  create () {
    if (!this.options.length) {
      this.finish(null)
      return
    }
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x120f1a, 0.92).setOrigin(0)
    this.add.text(WIDTH / 2, 26, 'ADOPTION DAY!', { fontFamily: FONT, fontSize: '16px', color: '#ff9bb0' }).setOrigin(0.5)
    this.add.text(WIDTH / 2, 48, 'A SHELTER PET WANTS TO JOIN THE DINER. FREE, FOR GOOD.', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)

    const n = this.options.length
    this.cards = this.options.map((pet, i) => {
      const x = WIDTH / 2 + (i - (n - 1) / 2) * (CARD_W + 16)
      const c = this.add.container(x, 196)
      const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, COLORS.panel).setStrokeStyle(2, COLORS.panelEdge)
      const kind = this.add.text(-CARD_W / 2 + 8, -CARD_H / 2 + 8, pet.kind, { fontFamily: FONT, fontSize: '8px', color: pet.kind === 'DOG' ? CSS.diner : '#69b4ea' })
      const sprite = this.add.image(0, -36, pet.texture).setScale(3)
      const name = this.add.text(0, 8, pet.name, { fontFamily: FONT, fontSize: '16px', color: CSS.white }).setOrigin(0.5, 0)
      const breed = this.add.text(0, 30, pet.breed, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5, 0)
      const desc = this.add.text(0, 48, pet.desc, {
        fontFamily: FONT, fontSize: '8px', color: CSS.white, align: 'center', lineSpacing: 4, wordWrap: { width: CARD_W - 18 }
      }).setOrigin(0.5, 0)
      c.add([bg, kind, sprite, name, breed, desc])
      this.tweens.add({ targets: sprite, y: -40, duration: 400 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      return { c, bg, pet }
    })

    this.add.text(WIDTH / 2, 316, 'LEFT / RIGHT TO MEET  -  A TO ADOPT  -  B: NOT TODAY', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
    this.add.text(WIDTH / 2, 334, 'EVERY PET CAN BE PETTED WITH A FOR A PATIENCE BOOST', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    const bindings = this.registry.get('bindings') || {}
    this.inputs = [new PlayerInput(this, 'cook', bindings.cook), new PlayerInput(this, 'server', bindings.server)]
    this.select(Math.floor(n / 2))
    sfx('adopt')
    if (allBots(this.registry)) this.time.delayedCall(700, () => this.finish(this.cards[this.cursor].pet))
  }

  select (i) {
    this.cursor = Phaser.Math.Wrap(i, 0, this.cards.length)
    this.cards.forEach((card, j) => {
      const on = j === this.cursor
      card.bg.setStrokeStyle(on ? 3 : 2, on ? 0xff9bb0 : COLORS.panelEdge)
      this.tweens.add({ targets: card.c, scale: on ? 1.06 : 1, y: on ? 190 : 196, duration: 140, ease: 'Back.easeOut' })
    })
  }

  update () {
    if (!this.inputs || this.done) return
    for (const inp of this.inputs) {
      inp.update()
      if (inp.nav.x) {
        this.select(this.cursor + inp.nav.x)
        sfx('select')
      }
      if (inp.pressed('interact')) {
        this.finish(this.cards[this.cursor].pet)
        return
      }
      if (inp.pressed('back')) {
        this.finish(null)
        return
      }
    }
  }

  finish (pet) {
    if (this.done) return
    this.done = true
    if (pet) {
      RunState.pets.push(pet.id)
      sfx('adopt')
    } else {
      sfx('drop')
    }
    this.scene.stop()
    this.onDone()
  }
}
