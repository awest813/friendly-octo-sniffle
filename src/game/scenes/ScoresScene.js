import Phaser from 'phaser'
import { WIDTH, HEIGHT, FONT, CSS, COLORS } from '@/game/constants'
import AnyInput from '@/game/input/AnyInput'
import { loadScores } from '@/game/state/scores'
import { sfx } from '@/game/audio/sfx'

export default class ScoresScene extends Phaser.Scene {
  constructor () {
    super({ key: 'ScoresScene' })
  }

  create () {
    this.cameras.main.setBackgroundColor(COLORS.bg)
    this.add.text(WIDTH / 2, 40, 'HIGH SCORES', { fontFamily: FONT, fontSize: '16px', color: CSS.diner }).setOrigin(0.5)
    this.add.text(WIDTH / 2, 64, 'BEST RUNS ON THIS DEVICE, BY TIPS', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    const list = loadScores()
    if (!list.length) {
      this.add.text(WIDTH / 2, 160, 'NO RUNS YET. GO COOK SOMETHING.', { fontFamily: FONT, fontSize: '8px', color: CSS.white }).setOrigin(0.5)
    }
    list.forEach((s, i) => {
      const y = 104 + i * 32
      const color = i === 0 ? CSS.diner : CSS.white
      this.add.rectangle(WIDTH / 2, y + 4, 380, 26, COLORS.panel).setStrokeStyle(2, i === 0 ? COLORS.diner : COLORS.panelEdge)
      this.add.text(WIDTH / 2 - 176, y, `${i + 1}`, { fontFamily: FONT, fontSize: '8px', color })
      this.add.text(WIDTH / 2 - 150, y, s.mode, { fontFamily: FONT, fontSize: '8px', color: CSS.cook })
      this.add.text(WIDTH / 2 + 10, y, s.waves >= 8 ? 'SAVED THE DINER' : `WAVE ${s.waves}`, { fontFamily: FONT, fontSize: '8px', color }).setOrigin(0.5, 0)
      this.add.text(WIDTH / 2 + 176, y, `$${s.tips}`, { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(1, 0)
    })
    this.add.text(WIDTH / 2, HEIGHT - 16, 'A / B: BACK', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    this.inputs = new AnyInput(this)
  }

  update () {
    this.inputs.update()
    if (this.inputs.pressed('back') || this.inputs.pressed('interact') || this.inputs.pressed('pause')) {
      sfx('confirm')
      this.scene.start('TitleScene', { skipSplash: true })
    }
  }
}
