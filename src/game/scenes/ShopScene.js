import Phaser from 'phaser'
import { WIDTH, HEIGHT, FONT, CSS, TUNING, SHOP } from '@/game/constants'
import { WAVES } from '@/game/data/waves'
import PlayerInput from '@/game/input/PlayerInput'
import Menu from '@/game/ui/Menu'
import RunState from '@/game/state/RunState'
import { allBots } from '@/game/state/scores'
import { sfx } from '@/game/audio/sfx'

// Between waves: spend tips (which are also your score) on survival.
export default class ShopScene extends Phaser.Scene {
  constructor () {
    super({ key: 'ShopScene' })
  }

  init (data) {
    this.onDone = data.onDone
  }

  create () {
    this.done = false
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x120f1a, 0.92).setOrigin(0)
    this.add.text(WIDTH / 2, 30, 'THE SHOP', { fontFamily: FONT, fontSize: '16px', color: CSS.diner }).setOrigin(0.5)
    this.add.text(WIDTH / 2, 52, `WAVE ${RunState.wave} CLEARED  -  TIPS ARE YOUR SCORE`, {
      fontFamily: FONT, fontSize: '8px', color: CSS.dim
    }).setOrigin(0.5)
    this.tipsText = this.add.text(WIDTH / 2, 76, '', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)

    const next = WAVES[Math.min(RunState.wave + 1, WAVES.length) - 1]
    const prices = {
      // 30, 50, 80, 120... (steps of 20, 30, 40) with each life bought this run.
      life: RunState.price(SHOP.life + SHOP.lifeStep / 4 * RunState.livesBought * (RunState.livesBought + 3)),
      plate: RunState.price(SHOP.plate),
      calm: RunState.price(SHOP.calm)
    }
    const items = [
      {
        label: '+1 LIFE',
        detail: 'Price rises with each life bought.',
        price: prices.life,
        enabled: () => RunState.lives < TUNING.lives && RunState.tips >= prices.life,
        action: () => this.buy(prices.life, () => {
          RunState.lives++
          RunState.livesBought++
        })
      },
      {
        label: '+1 PLATE',
        detail: 'Less time stuck at the sink.',
        price: prices.plate,
        enabled: () => TUNING.plateCount + RunState.bonusPlates < TUNING.maxPlates && RunState.tips >= prices.plate,
        action: () => this.buy(prices.plate, () => { RunState.bonusPlates++ })
      },
      {
        label: 'CALM MUSIC',
        detail: 'Next wave: customer patience +20%.',
        price: prices.calm,
        enabled: () => !RunState.calm && RunState.tips >= prices.calm,
        action: () => this.buy(prices.calm, () => { RunState.calm = true })
      },
      {
        label: 'OPEN THE DOORS',
        detail: `NEXT: ${next.name}`,
        action: () => this.finish()
      }
    ]
    this.menu = new Menu(this, { x: WIDTH / 2, y: 112, width: 380, rowHeight: 40, items, cursor: items.length - 1 })

    this.add.text(WIDTH / 2, 330, 'UP / DOWN + A TO BUY  -  B TO LEAVE', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
    const bindings = this.registry.get('bindings') || {}
    this.inputs = [new PlayerInput(this, 'cook', bindings.cook), new PlayerInput(this, 'server', bindings.server)]
    if (allBots(this.registry)) this.time.delayedCall(700, () => this.autoShop(items))
  }

  // Bot-only runs: keep lives topped up, then a plate if affordable.
  autoShop (items) {
    items.slice(0, 2).forEach(item => { if (item.enabled()) item.action() })
    this.finish()
  }

  buy (price, apply) {
    if (!RunState.spend(price)) {
      sfx('error')
      return
    }
    apply()
    sfx('buy')
    this.tweens.add({ targets: this.tipsText, scale: { from: 1.4, to: 1 }, duration: 200, ease: 'Back.easeOut' })
  }

  update () {
    this.tipsText.setText(`$${RunState.tips}   LIVES ${RunState.lives}/${TUNING.lives}   PLATES ${TUNING.plateCount + RunState.bonusPlates}`)
    this.inputs.forEach(i => i.update())
    this.menu.handle(this.inputs)
    if (this.inputs.some(i => i.pressed('back'))) this.finish()
  }

  finish () {
    if (this.done) return
    this.done = true
    sfx('confirm')
    this.scene.stop()
    this.onDone()
  }
}
