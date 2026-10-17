import Phaser from 'phaser'
import { WIDTH, FONT, CSS, COLORS } from '@/game/constants'
import { WIN_WAVE } from '@/game/data/waves'
import PlayerInput from '@/game/input/PlayerInput'
import RunState from '@/game/state/RunState'
import { sfx } from '@/game/audio/sfx'

export default class GameOverScene extends Phaser.Scene {
  constructor () {
    super({ key: 'GameOverScene' })
  }

  init (data) {
    this.won = !!data.won
  }

  create () {
    this.cameras.main.setBackgroundColor(COLORS.bg)
    const title = this.won ? 'DINER SAVED' : 'RUN OVER'
    this.add.text(WIDTH / 2, 70, title, { fontFamily: FONT, fontSize: '24px', color: this.won ? CSS.diner : CSS.danger }).setOrigin(0.5)
    const sub = this.won ? 'SURVIVED THE NIGHT. CLOSING TIME SCORE BELOW.' : 'ONE COOKED. ONE SERVED. BOTH PANICKED.'
    this.add.text(WIDTH / 2, 104, sub, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)

    const rows = [
      ['WAVES CLEARED', `${Math.min(RunState.wavesCleared, WIN_WAVE)}/${WIN_WAVE}`],
      ['CUSTOMERS SERVED', `${RunState.served}`],
      ['ANGRY WALKOUTS', `${RunState.angry}`],
      ['TIPS', `$${RunState.tips}`]
    ]
    rows.forEach(([label, value], i) => {
      const y = 150 + i * 26
      this.add.text(WIDTH / 2 - 150, y, label, { fontFamily: FONT, fontSize: '8px', color: CSS.white })
      this.add.text(WIDTH / 2 + 150, y, value, { fontFamily: FONT, fontSize: '8px', color: i === 3 ? CSS.diner : CSS.cook }).setOrigin(1, 0)
    })

    this.prompt = this.add.text(WIDTH / 2, 300, 'PRESS A TO GO AGAIN', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5)
    const bindings = this.registry.get('bindings') || {}
    this.inputs = [new PlayerInput(this, 'cook', bindings.cook), new PlayerInput(this, 'server', bindings.server)]
    this.readyAt = this.time.now + 800
  }

  update () {
    this.prompt.setAlpha(0.6 + 0.4 * Math.sin(this.time.now / 150))
    this.inputs.forEach(i => i.update())
    if (this.time.now < this.readyAt) return
    if (this.inputs.some(i => i.pressed('interact'))) {
      sfx('confirm')
      this.scene.start('LobbyScene')
    }
  }
}
