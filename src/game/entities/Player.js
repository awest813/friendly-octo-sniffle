import Phaser from 'phaser'
import { TUNING, COLORS, WIDTH } from '@/game/constants'
import { ItemView, isPlate } from '@/game/entities/items'
import RunState from '@/game/state/RunState'

const TRAIL_STEP = 3
const TRAIL_MAX = 160

// Keyboard names for the two action buttons, per role.
const KEY_NAMES = {
  cook: { A: 'SPACE', X: 'E' },
  server: { A: 'ENTER', X: 'SHIFT' }
}

export default class Player {
  constructor (scene, role, x, y, input) {
    this.scene = scene
    this.role = role
    this.input = input
    this.color = role === 'cook' ? COLORS.cook : COLORS.server
    this.item = null
    this.extra = null // second plate, Octo-Tray only
    this.facing = new Phaser.Math.Vector2(0, 1)
    this.target = null
    this.trail = []
    this.bobTime = 0

    // Invisible physics body at the feet; the visible sprite follows it.
    this.body = scene.physics.add.image(x, y, 'px').setVisible(false)
    this.body.body.setSize(16, 10)
    this.body.setCollideWorldBounds(true)
    this.shadow = scene.add.image(x, y, 'shadow')
    this.sprite = scene.add.image(x, y, role).setOrigin(0.5, 1)
    this.extraView = new ItemView(scene, x, y)
    this.itemView = new ItemView(scene, x, y)
    this.highlight = scene.add.image(0, 0, 'highlight').setTint(this.color).setVisible(false).setDepth(9000)
    this.tag = scene.add.text(x, y, role === 'cook' ? 'P1' : 'P2', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: role === 'cook' ? '#00ffd0' : '#ff3b8d'
    }).setOrigin(0.5, 1).setDepth(9001)
    this.promptText = scene.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: role === 'cook' ? '#00ffd0' : '#ff3b8d',
      backgroundColor: '#120f1add',
      padding: { x: 3, y: 2 }
    }).setOrigin(0.5, 1).setDepth(9600).setVisible(false)
  }

  buttonName (button) {
    return this.input.lastPad ? button : KEY_NAMES[this.role][button]
  }

  // Context prompt over the current target, e.g. "A: GRAB BUN".
  showPrompt (text, target) {
    if (!text || !target) {
      this.promptText.setVisible(false)
      this.tag.setVisible(true)
      return
    }
    // The prompt is in the player's colour, so it replaces the P1/P2 tag.
    this.tag.setVisible(false)
    const label = text.replace('{A}', `${this.buttonName('A')}:`).replace('{X}', `${this.buttonName('X')}:`)
    const at = target.highlightAt()
    if (this.promptText.text !== label) this.promptText.setText(label)
    const half = this.promptText.width / 2
    this.promptText
      .setPosition(Math.max(half + 2, Math.min(WIDTH - half - 2, at.x)), at.y - 18)
      .setVisible(true)
  }

  get feet () {
    return this.body.body.center
  }

  // Emptying the hands promotes the Octo-Tray plate, if any.
  setItem (item) {
    if (!item && this.extra) {
      item = this.extra
      this.extra = null
    }
    this.item = item
    this.refreshItem()
  }

  refreshItem () {
    this.itemView.setItem(this.item)
    this.extraView.setItem(this.extra)
  }

  canStack (item) {
    return this.role === 'server' && RunState.has('octo') && !this.extra && isPlate(this.item) && isPlate(item)
  }

  stack (item) {
    this.extra = this.item
    this.item = item
    this.refreshItem()
  }

  setExtra (item) {
    this.extra = item
    this.refreshItem()
  }

  update (dt) {
    const move = this.input.move
    const speed = TUNING.playerSpeed * RunState.speedMult(this.role)
    this.body.setVelocity(move.x * speed, move.y * speed)
    const moving = move.lengthSq() > 0.01
    if (moving) {
      this.facing.copy(move).normalize()
      if (Math.abs(move.x) > 0.2) this.sprite.setFlipX(move.x < 0)
      this.bobTime += dt * 14
    } else {
      this.bobTime = 0
    }

    const feet = this.feet
    const last = this.trail[this.trail.length - 1]
    if (!last || Phaser.Math.Distance.Between(last.x, last.y, feet.x, feet.y) >= TRAIL_STEP) {
      this.trail.push({ x: feet.x, y: feet.y })
      if (this.trail.length > TRAIL_MAX) this.trail.shift()
    }

    const bob = moving ? Math.abs(Math.sin(this.bobTime)) * -2 : 0
    const frame = moving && Math.sin(this.bobTime) > 0 ? `${this.role}_b` : this.role
    if (this.sprite.texture.key !== frame) this.sprite.setTexture(frame)
    this.sprite.setPosition(feet.x, feet.y + 5 + bob).setDepth(feet.y)
    this.shadow.setPosition(feet.x, feet.y + 4).setDepth(feet.y - 1)
    const dx = this.extra ? 5 : 0
    this.extraView.setPosition(feet.x - 5, feet.y - 27 + bob).setDepth(feet.y + 0.4)
    this.itemView.setPosition(feet.x + dx, feet.y - 30 - dx + bob).setDepth(feet.y + 0.5)
    this.tag.setPosition(feet.x, feet.y - (this.item ? 40 + dx : 26) + bob)
  }

  // Point slightly ahead of the player, used to pick an interaction target.
  probe () {
    const f = this.feet
    return { x: f.x + this.facing.x * TUNING.interactReach, y: f.y - 6 + this.facing.y * TUNING.interactReach }
  }

  setTarget (target) {
    this.target = target
    if (target) {
      const a = target.highlightAt()
      this.highlight.setPosition(a.x, a.y).setVisible(true)
    } else {
      this.highlight.setVisible(false)
    }
  }

  // A crumb roughly `distance` px behind the player, for customers following them.
  crumb (distance) {
    const idx = Math.max(0, this.trail.length - 1 - Math.round(distance / TRAIL_STEP))
    return this.trail[idx] || this.feet
  }
}
