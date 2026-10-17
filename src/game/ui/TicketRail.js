import { FONT, COLORS } from '@/game/constants'
import { RECIPES } from '@/game/data/recipes'
import { readyTexture } from '@/game/entities/items'
import bus from '@/game/state/bus'
import { sfx } from '@/game/audio/sfx'

const W = 56
const H = 34
const GAP = 4

// Orders slide in from the right, oldest on the left. Each ticket shows the
// table, the plate-ready ingredients and the customer's food patience.
export default class TicketRail {
  constructor (scene, x, y, width) {
    this.scene = scene
    this.x = x
    this.y = y
    this.width = width
    this.tickets = []
    scene.add.rectangle(x, y + H / 2 + 1, width, 2, COLORS.panelEdge).setOrigin(0, 0.5).setDepth(9100)

    this.onTaken = ({ order }) => this.add(order)
    this.onClosed = ({ order, served }) => this.remove(order, served)
    bus.on('order_taken', this.onTaken)
    bus.on('order_closed', this.onClosed)
    scene.events.once('shutdown', () => {
      bus.off('order_taken', this.onTaken)
      bus.off('order_closed', this.onClosed)
    })
  }

  slotX (i) {
    return this.x + i * (W + GAP)
  }

  add (order) {
    const s = this.scene
    const c = s.add.container(this.x + this.width + 10, this.y).setDepth(9200)
    const bg = s.add.rectangle(0, 0, W, H, 0xf4ecd8).setOrigin(0).setStrokeStyle(2, 0x1a1423)
    const pin = s.add.rectangle(W / 2, 0, 10, 3, 0x8a8399)
    const label = s.add.text(4, 4, `T${order.table}`, { fontFamily: FONT, fontSize: '8px', color: '#1a1423' })
    const name = s.add.text(W - 3, 4, RECIPES[order.recipe].name[0], { fontFamily: FONT, fontSize: '8px', color: '#c0246a' }).setOrigin(1, 0)
    const parts = RECIPES[order.recipe].parts
    const icons = parts.map((id, i) => s.add.image(W / 2 + (i - (parts.length - 1) / 2) * 17, 20, readyTexture(id)))
    const bar = s.add.graphics()
    c.add([bg, pin, label, name, ...icons, bar])
    const ticket = { order, c, bar }
    this.tickets.push(ticket)
    this.layout()
    sfx('ding')
  }

  remove (order, served) {
    const i = this.tickets.findIndex(t => t.order === order)
    if (i < 0) return
    const [t] = this.tickets.splice(i, 1)
    this.scene.tweens.add({
      targets: t.c, y: this.y - (served ? 20 : -20), alpha: 0, duration: 250,
      onComplete: () => t.c.destroy()
    })
    this.layout()
  }

  layout () {
    this.tickets.forEach((t, i) => {
      this.scene.tweens.add({ targets: t.c, x: this.slotX(i), duration: 280, ease: 'Cubic.easeOut' })
    })
  }

  update () {
    this.tickets.forEach(t => {
      const r = t.order.customer.ratio
      const color = r > 0.2 ? 0x7ed957 : 0xff4040
      t.bar.clear()
      t.bar.fillStyle(0x1a1423, 1).fillRect(3, H - 6, W - 6, 4)
      t.bar.fillStyle(color, 1).fillRect(4, H - 5, Math.max(1, (W - 8) * r), 2)
    })
  }
}
