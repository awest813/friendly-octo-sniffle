import { WIDTH, HEIGHT, FONT, CSS, COLORS } from '@/game/constants'
import { sfx } from '@/game/audio/sfx'

const DEPTH = 9850

// End-of-wave summary. Stars land one at a time and the bonus counts up:
// a short, earned celebration of how the team did, never a guilt trip.
export function showReportCard (scene, { title, subtitle, stats, streak, stars, bonus }) {
  const cx = WIDTH / 2
  const cy = HEIGHT / 2 + 4
  const parts = []
  const add = o => { parts.push(o); return o.setDepth(DEPTH + 1) }

  parts.push(scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x120f1a, 0.55).setOrigin(0).setDepth(DEPTH))
  add(scene.add.rectangle(cx, cy, 320, 190, COLORS.panel).setStrokeStyle(2, stars === 3 ? COLORS.diner : COLORS.panelEdge))
  add(scene.add.text(cx, cy - 76, title, { fontFamily: FONT, fontSize: '16px', color: stars === 3 ? CSS.diner : '#7ed957' }).setOrigin(0.5))
  add(scene.add.text(cx, cy - 56, subtitle, { fontFamily: FONT, fontSize: '8px', color: CSS.dim }).setOrigin(0.5))

  const slots = [-1, 0, 1].map(i => add(scene.add.image(cx + i * 40, cy - 22, 'star_empty').setScale(3)))

  const lines = [
    ['SERVED', `${stats.served}`],
    ['PERFECT', `${stats.perfect}`],
    ['WALKOUTS', `${stats.angry}`],
    ['STREAK', `${streak}`]
  ]
  lines.forEach(([label, value], i) => {
    const y = cy + 10 + i * 14
    add(scene.add.text(cx - 120, y, label, { fontFamily: FONT, fontSize: '8px', color: CSS.white }))
    add(scene.add.text(cx + 120, y, value, { fontFamily: FONT, fontSize: '8px', color: CSS.cook }).setOrigin(1, 0))
  })
  const bonusText = add(scene.add.text(cx, cy + 78, '', { fontFamily: FONT, fontSize: '8px', color: CSS.diner }).setOrigin(0.5))

  for (let i = 0; i < stars; i++) {
    scene.time.delayedCall(450 + i * 380, () => {
      slots[i].setTexture('star')
      scene.tweens.add({ targets: slots[i], scale: { from: 5, to: 3 }, duration: 260, ease: 'Back.easeOut' })
      sfx('star', i)
    })
  }

  const counter = { v: 0 }
  scene.time.delayedCall(500 + stars * 380, () => {
    if (!bonus) return
    scene.tweens.add({
      targets: counter,
      v: bonus,
      duration: 500,
      onUpdate: () => bonusText.setText(`STAR BONUS +$${Math.round(counter.v)}`)
    })
    if (stars === 3) confetti(scene, cx, cy - 40)
  })

  scene.time.delayedCall(3900, () => {
    scene.tweens.add({ targets: parts, alpha: 0, duration: 250, onComplete: () => parts.forEach(p => p.destroy()) })
  })
}

function confetti (scene, x, y) {
  const burst = scene.add.particles(x, y, 'px', {
    speed: { min: 60, max: 180 },
    angle: { min: 200, max: 340 },
    gravityY: 220,
    lifespan: 1400,
    scale: { start: 2, end: 1 },
    tint: [0x00ffd0, 0xff3b8d, 0xffd93d, 0x7ed957],
    emitting: false
  }).setDepth(DEPTH + 2)
  burst.explode(60)
  scene.time.delayedCall(1600, () => burst.destroy())
}
