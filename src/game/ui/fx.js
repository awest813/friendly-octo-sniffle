import { FONT } from '@/game/constants'
import Settings from '@/game/state/settings'

export function floatText (scene, x, y, text, color = '#ffd93d') {
  // Keep pops inside the play area: they rise 22px, and the HUD bar is 40px.
  y = Math.max(y, 72)
  const t = scene.add.text(x, y, text, {
    fontFamily: FONT, fontSize: '8px', color, stroke: '#1a1423', strokeThickness: 3
  }).setOrigin(0.5).setDepth(9500)
  const half = t.width / 2
  t.x = Math.max(half + 2, Math.min(scene.scale.width - half - 2, x))
  scene.tweens.add({
    targets: t, y: y - 22, alpha: { from: 1, to: 0 }, duration: 900, ease: 'Cubic.easeOut',
    onComplete: () => t.destroy()
  })
  scene.tweens.add({ targets: t, scale: { from: 1.6, to: 1 }, duration: 180, ease: 'Back.easeOut' })
  return t
}

export function shake (scene, strength = 0.006, duration = 160) {
  if (!Settings.shake) return
  scene.cameras.main.shake(duration, strength)
}

export function banner (scene, title, subtitle, color = '#00ffd0', hold = 1800) {
  const { width, height } = scene.scale
  const bg = scene.add.rectangle(width / 2, height / 2, width, 64, 0x120f1a, 0.92).setDepth(9800)
  const t1 = scene.add.text(width / 2, height / 2 - 10, title, {
    fontFamily: FONT, fontSize: '16px', color
  }).setOrigin(0.5).setDepth(9801)
  const t2 = scene.add.text(width / 2, height / 2 + 14, subtitle || '', {
    fontFamily: FONT, fontSize: '8px', color: '#f4f4f4'
  }).setOrigin(0.5).setDepth(9801)
  const parts = [bg, t1, t2]
  parts.forEach(p => { p.alpha = 0 })
  scene.tweens.add({ targets: parts, alpha: 1, duration: 200 })
  scene.tweens.add({ targets: [t1, t2], x: { from: width / 2 + 40, to: width / 2 }, duration: 260, ease: 'Back.easeOut' })
  scene.time.delayedCall(hold, () => {
    scene.tweens.add({ targets: parts, alpha: 0, duration: 250, onComplete: () => parts.forEach(p => p.destroy()) })
  })
}
