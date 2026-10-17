import Phaser from 'phaser'
import { FONT, CSS, COLORS } from '@/game/constants'
import { sfx } from '@/game/audio/sfx'

// Vertical list driven by PlayerInput.nav / interact. Items:
//   { label, detail?, price?, enabled?: () => bool, action: () => void }
export default class Menu {
  constructor (scene, { x, y, width, rowHeight = 30, items, depth = 9950, cursor = 0 }) {
    this.scene = scene
    this.items = items
    this.cursor = cursor
    this.rows = items.map((item, i) => {
      const ry = y + i * rowHeight
      const bg = scene.add.rectangle(x, ry, width, rowHeight - 4, COLORS.panel).setStrokeStyle(2, COLORS.panelEdge).setDepth(depth)
      const label = scene.add.text(x - width / 2 + 10, ry - (item.detail ? 6 : 0), item.label, {
        fontFamily: FONT, fontSize: '8px', color: CSS.white
      }).setOrigin(0, 0.5).setDepth(depth + 1)
      const detail = scene.add.text(x - width / 2 + 10, ry + 6, item.detail || '', {
        fontFamily: FONT, fontSize: '8px', color: CSS.dim
      }).setOrigin(0, 0.5).setDepth(depth + 1)
      const price = scene.add.text(x + width / 2 - 10, ry, item.price !== undefined ? `$${item.price}` : '', {
        fontFamily: FONT, fontSize: '8px', color: CSS.diner
      }).setOrigin(1, 0.5).setDepth(depth + 1)
      return { bg, label, detail, price }
    })
    this.refresh()
  }

  enabled (i) {
    const item = this.items[i]
    return !item.enabled || item.enabled()
  }

  move (d) {
    if (!d) return
    this.cursor = Phaser.Math.Wrap(this.cursor + d, 0, this.items.length)
    sfx('select')
    this.refresh()
  }

  choose () {
    if (!this.enabled(this.cursor)) {
      sfx('error')
      return
    }
    this.items[this.cursor].action()
    // The action may have closed the scene that owns this menu.
    if (this.rows[0].label.scene) this.refresh()
  }

  refresh () {
    this.rows.forEach((row, i) => {
      const on = i === this.cursor
      const ok = this.enabled(i)
      row.bg.setStrokeStyle(on ? 3 : 2, on ? COLORS.diner : COLORS.panelEdge)
      row.label.setColor(ok ? (on ? CSS.diner : CSS.white) : CSS.dim)
      row.price.setAlpha(ok ? 1 : 0.4)
    })
  }

  // Let every player drive the same cursor.
  handle (inputs) {
    for (const inp of inputs) {
      this.move(inp.nav.y)
      if (inp.pressed('interact')) {
        this.choose()
        return true
      }
    }
    return false
  }

  destroy () {
    this.rows.forEach(r => [r.bg, r.label, r.detail, r.price].forEach(o => o.destroy()))
  }
}
