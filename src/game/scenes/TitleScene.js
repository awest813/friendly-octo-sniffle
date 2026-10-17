import Phaser from 'phaser'
import { WIDTH, HEIGHT, COLORS, CSS, FONT, VERSION } from '@/game/constants'
import AnyInput from '@/game/input/AnyInput'
import Menu from '@/game/ui/Menu'
import RunState from '@/game/state/RunState'
import { loadScores } from '@/game/state/scores'
import { sfx, audioContext } from '@/game/audio/sfx'
import { playMusic } from '@/game/audio/music'

const DEMO_AFTER = 30 // seconds idle before the attract demo starts

// "Press any button" splash, then the main menu. Idle long enough and the
// bots play a demo round, like an arcade cabinet.
export default class TitleScene extends Phaser.Scene {
  constructor () {
    super({ key: 'TitleScene' })
  }

  init (data) {
    this.skipSplash = !!(data && data.skipSplash)
  }

  create () {
    if (new URLSearchParams(window.location.search).has('autoplay')) {
      this.scene.start('LobbyScene')
      return
    }
    this.cameras.main.setBackgroundColor(COLORS.bg)
    this.registry.set('demo', false)
    playMusic('menu')

    this.drawBackdrop()
    const logo = this.add.container(WIDTH / 2, 0)
    logo.add(this.add.text(0, 44, 'DUO', { fontFamily: FONT, fontSize: '32px', color: CSS.white }).setOrigin(0.5))
    logo.add(this.add.text(0, 84, 'DINER', { fontFamily: FONT, fontSize: '32px', color: CSS.cook }).setOrigin(0.5))
    logo.add(this.add.text(0, 116, 'ONE COOKS. ONE SERVES. BOTH PANIC.', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5))
    this.tweens.add({ targets: logo, y: 4, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    const cook = this.add.image(150, 96, 'cook').setScale(3)
    const server = this.add.image(WIDTH - 150, 96, 'server').setScale(3).setFlipX(true)
    this.tweens.add({ targets: [cook, server], y: 90, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    this.splash = this.add.text(WIDTH / 2, 230, 'PRESS ANY BUTTON', { fontFamily: FONT, fontSize: '8px', color: CSS.white }).setOrigin(0.5)
    this.footer = this.add.text(WIDTH / 2, HEIGHT - 12, '', { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5)
    this.add.text(WIDTH - 6, 6, `v${VERSION}`, { fontFamily: FONT, fontSize: '8px', color: '#3a3150' }).setOrigin(1, 0)

    this.inputs = new AnyInput(this)
    this.idle = 0
    this.menu = null
    this.sub = false
    this.input.on('pointerdown', () => { if (!this.menu) this.openMenu() })
    if (this.skipSplash) this.openMenu()
  }

  drawBackdrop () {
    // A strip of the diner floor and counters along the bottom.
    for (let x = 0; x < WIDTH; x += 32) {
      this.add.image(x + 16, HEIGHT - 48, x < WIDTH / 2 ? 'floor_k' : 'floor_d').setAlpha(0.35)
      this.add.image(x + 16, HEIGHT - 16, 'wall').setAlpha(0.6)
    }
  }

  openMenu () {
    if (this.menu) return
    sfx('confirm')
    this.splash.setVisible(false)
    const best = loadScores()[0]
    this.menu = new Menu(this, {
      x: WIDTH / 2,
      y: 162,
      width: 220,
      rowHeight: 26,
      items: [
        { label: 'PLAY', action: () => this.go('LobbyScene') },
        { label: 'HOW TO PLAY', action: () => this.go('HowToPlayScene') },
        { label: 'SETTINGS', action: () => this.openSettings() },
        { label: best ? `HIGH SCORES  ($${best.tips})` : 'HIGH SCORES', action: () => this.go('ScoresScene') }
      ]
    })
  }

  go (key) {
    sfx('confirm')
    this.scene.start(key)
  }

  openSettings () {
    this.sub = true
    this.scene.launch('SettingsScene', {
      onClose: () => {
        this.sub = false
        this.inputs.update()
        this.inputs.update()
      }
    })
  }

  startDemo () {
    this.registry.set('demo', true)
    this.registry.set('ai', { cook: true, server: true })
    this.registry.set('bindings', { cook: null, server: null })
    RunState.reset()
    this.scene.start('GameScene')
  }

  update (time, delta) {
    const ctx = audioContext()
    const muted = ctx && ctx.state !== 'running'
    this.footer.setText(muted ? 'CLICK OR PRESS A KEY TO TURN ON SOUND' : 'F: FULLSCREEN   -   BEST WITH TWO GAMEPADS')
    this.splash.setAlpha(0.5 + 0.5 * Math.sin(time / 200))
    if (this.sub) return

    this.inputs.update()
    if (this.inputs.anyPressed()) this.idle = 0
    else this.idle += delta / 1000
    if (this.idle > DEMO_AFTER) {
      this.startDemo()
      return
    }

    if (!this.menu) {
      if (this.inputs.anyPressed()) this.openMenu()
      return
    }
    this.menu.handle([this.inputs])
  }
}
