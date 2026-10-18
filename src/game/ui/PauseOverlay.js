import { WIDTH, HEIGHT, FONT, CSS } from '@/game/constants'
import Menu from '@/game/ui/Menu'
import RunState from '@/game/state/RunState'

const DEPTH = 9940

// Pause menu, and the "pad disconnected" prompt that pauses the game.
export default class PauseOverlay {
  constructor (scene) {
    this.scene = scene
    this.mode = null
    this.menu = null
    this.dim = scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x120f1a, 0.85).setOrigin(0).setDepth(DEPTH).setVisible(false)
    this.title = scene.add.text(WIDTH / 2, 110, '', { fontFamily: FONT, fontSize: '16px', color: CSS.diner }).setOrigin(0.5).setDepth(DEPTH + 1)
    this.body = scene.add.text(WIDTH / 2, 150, '', {
      fontFamily: FONT, fontSize: '8px', color: CSS.white, align: 'center', lineSpacing: 8
    }).setOrigin(0.5, 0).setDepth(DEPTH + 1)
  }

  get visible () {
    return this.mode !== null
  }

  showMenu (actions) {
    this.clear()
    this.mode = 'menu'
    this.dim.setVisible(true)
    this.title.setText('PAUSED').setColor(CSS.diner)
    const where = RunState.wave > RunState.goal ? 'CLOSING TIME' : RunState.wave ? `WAVE ${RunState.wave} OF ${RunState.goal}` : 'GET READY'
    this.body.setY(128).setText(`${RunState.difficulty}  -  ${where}`)
    this.menu = new Menu(this.scene, {
      x: WIDTH / 2,
      y: 160,
      width: 240,
      depth: DEPTH + 2,
      items: [
        { label: 'RESUME', action: actions.resume },
        { label: 'SETTINGS', action: actions.settings },
        { label: 'RESTART RUN', action: actions.restart },
        { label: 'QUIT TO TITLE', action: actions.quit }
      ]
    })
  }

  showLost (role, keyHint) {
    this.clear()
    this.mode = 'lost'
    this.dim.setVisible(true)
    const name = role === 'cook' ? 'COOK' : 'SERVER'
    this.title.setText(`${name} PAD DISCONNECTED`).setColor(role === 'cook' ? CSS.cook : CSS.server)
    this.body.setY(150).setText(`RECONNECT IT AND PRESS A,\nPRESS A ON ANOTHER FREE PAD,\nOR PRESS ${keyHint} TO PLAY ON KEYBOARD`)
  }

  clear () {
    if (this.menu) this.menu.destroy()
    this.menu = null
    this.body.setText('')
  }

  hide () {
    this.clear()
    this.mode = null
    this.dim.setVisible(false)
    this.title.setText('')
  }
}
