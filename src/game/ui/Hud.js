import { FONT, COLORS, TUNING, WIDTH, MAP_TOP } from '@/game/constants'
import { WIN_WAVE } from '@/game/data/waves'
import RunState from '@/game/state/RunState'

export default class Hud {
  constructor (scene) {
    this.scene = scene
    scene.add.rectangle(0, 0, WIDTH, MAP_TOP, COLORS.bg).setOrigin(0).setDepth(9050)
    scene.add.rectangle(0, 0, 140, MAP_TOP, COLORS.panel).setOrigin(0).setDepth(9060)
    this.wave = scene.add.text(6, 5, '', { fontFamily: FONT, fontSize: '8px', color: '#00ffd0' }).setDepth(9100)
    this.hearts = []
    for (let i = 0; i < TUNING.lives; i++) {
      this.hearts.push(scene.add.image(13 + i * 18, 27, 'heart').setDepth(9100))
    }
    this.tips = scene.add.text(134, 22, '', { fontFamily: FONT, fontSize: '8px', color: '#ffd93d' }).setOrigin(1, 0).setDepth(9100)
    this.mods = []
  }

  update () {
    const w = RunState.wave
    this.wave.setText(w > WIN_WAVE ? 'CLOSING TIME' : `WAVE ${w}/${WIN_WAVE}`)
    this.hearts.forEach((h, i) => h.setTexture(i < RunState.lives ? 'heart' : 'heart_empty'))
    this.tips.setText(`$${RunState.tips}`)
  }

  bumpTips () {
    this.scene.tweens.add({ targets: this.tips, scale: { from: 1.5, to: 1 }, duration: 220, ease: 'Back.easeOut' })
  }

  showModifiers (icons) {
    this.mods.forEach(m => m.destroy())
    // Stacked down the right-hand wall.
    this.mods = icons.map((key, i) => this.scene.add.image(WIDTH - 16, MAP_TOP + 44 + i * 22, key).setDepth(9100))
  }
}
