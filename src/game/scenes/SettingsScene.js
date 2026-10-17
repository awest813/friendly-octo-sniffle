import Phaser from 'phaser'
import { WIDTH, HEIGHT, FONT, CSS } from '@/game/constants'
import AnyInput from '@/game/input/AnyInput'
import Menu from '@/game/ui/Menu'
import Settings, { AI_SKILLS, DIFFICULTIES, saveSettings } from '@/game/state/settings'
import { sfx } from '@/game/audio/sfx'

const onOff = v => v ? 'ON' : 'OFF'

// Overlay launched from the title screen or the pause menu.
export default class SettingsScene extends Phaser.Scene {
  constructor () {
    super({ key: 'SettingsScene' })
  }

  init (data) {
    this.onClose = data && data.onClose
  }

  create () {
    this.done = false
    this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x120f1a, 0.94).setOrigin(0)
    this.add.text(WIDTH / 2, 28, 'SETTINGS', { fontFamily: FONT, fontSize: '16px', color: CSS.diner }).setOrigin(0.5)

    const volume = key => ({
      value: () => `${Settings[key]}`,
      adjust: d => { Settings[key] = Phaser.Math.Clamp(Settings[key] + d, 0, 10); this.changed(key === 'sfx') }
    })
    const toggle = key => ({
      value: () => onOff(Settings[key]),
      adjust: () => { Settings[key] = !Settings[key]; this.changed() }
    })
    const cycle = (key, list, d) => {
      const i = list.indexOf(Settings[key])
      Settings[key] = list[Phaser.Math.Wrap(i + d, 0, list.length)]
      this.changed()
    }
    const diffs = Object.keys(DIFFICULTIES)
    const items = [
      {
        label: 'DIFFICULTY',
        detail: 'Waves to win. Hard pays +25% tips.',
        value: () => `${Settings.difficulty} (${DIFFICULTIES[Settings.difficulty].waves})`,
        adjust: d => cycle('difficulty', diffs, d)
      },
      { label: 'BUTTON PROMPTS', ...toggle('prompts') },
      { label: 'SOUND EFFECTS', ...volume('sfx') },
      { label: 'MUSIC', ...volume('music') },
      { label: 'SCREEN SHAKE', ...toggle('shake') },
      { label: 'GAMEPAD RUMBLE', ...toggle('rumble') },
      {
        label: 'AI TEAMMATE',
        detail: 'How sharp the bot plays.',
        value: () => Settings.aiSkill,
        adjust: d => cycle('aiSkill', AI_SKILLS, d)
      },
      {
        label: 'FULLSCREEN',
        value: () => onOff(this.scale.isFullscreen),
        action: () => this.scale.toggleFullscreen()
      },
      { label: 'BACK', action: () => this.close() }
    ]
    this.menu = new Menu(this, { x: WIDTH / 2, y: 66, width: 420, rowHeight: 28, items })
    this.add.text(WIDTH / 2, HEIGHT - 16, 'UP / DOWN TO PICK  -  LEFT / RIGHT TO CHANGE  -  B TO GO BACK', {
      fontFamily: FONT, fontSize: '8px', color: CSS.dim
    }).setOrigin(0.5)
    this.inputs = new AnyInput(this)
  }

  changed (preview) {
    saveSettings()
    if (preview) sfx('tip')
  }

  close () {
    if (this.done) return
    this.done = true
    sfx('confirm')
    this.scene.stop()
    if (this.onClose) this.onClose()
  }

  update () {
    if (this.done) return
    this.inputs.update()
    if (this.inputs.pressed('back') || this.inputs.pressed('pause')) {
      this.close()
      return
    }
    this.menu.handle([this.inputs])
    // Fullscreen can change outside the menu (F key, Esc); refresh only then.
    if (this.scale.isFullscreen !== this.wasFullscreen) {
      this.wasFullscreen = this.scale.isFullscreen
      this.menu.refresh()
    }
  }
}
