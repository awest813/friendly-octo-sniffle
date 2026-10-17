// Guest types. Multipliers apply to the wave's base numbers. Every trait is
// shown on the guest (tag over their head) so the rules stay readable.
export const GUESTS = {
  regular: { id: 'regular', patience: 1, tip: 1, eat: 1, walk: 1 },
  granny: { id: 'granny', tag: 'CHILL', color: '#7ed957', patience: 1.5, tip: 1.2, eat: 1.6, walk: 0.6, texture: 'guest_granny' },
  kid: { id: 'kid', tag: 'KID', color: '#69b4ea', patience: 0.85, tip: 0.7, eat: 0.6, walk: 1.25, scale: 0.8, orders: ['burger'] },
  rusher: { id: 'rusher', tag: 'RUSH', color: '#ff7a3d', patience: 0.7, tip: 1.6, eat: 0.5, walk: 1.3, texture: 'guest_rusher' },
  critic: { id: 'critic', tag: 'VIP', color: '#ffd93d', patience: 1, tip: 3, eat: 1, walk: 1, texture: 'critic' },
  // A rare, glittering big tipper. A small surprise, never something you can buy.
  lucky: { id: 'lucky', tag: '$$$', color: '#ffd93d', patience: 1.1, tip: 3, eat: 1, walk: 1, golden: true }
}

// Which guests can show up, by wave, as [type, weight]. A themed wave's `mix`
// adds weight on top, e.g. { rusher: 5 }.
export function guestPool (wave, mix = {}) {
  const pool = [['regular', 6]]
  if (wave >= 2) pool.push(['granny', 2])
  if (wave >= 3) pool.push(['kid', 2])
  if (wave >= 4) pool.push(['rusher', 2])
  return pool.map(([id, w]) => [id, w + (mix[id] || 0)])
}

export const LUCKY_CHANCE = 0.08
export const LUCKY_FROM_WAVE = 2

export function rollGuest (wave, luck = 1, mix = {}, rand = Math.random) {
  if (wave >= LUCKY_FROM_WAVE && rand() < LUCKY_CHANCE * luck) return GUESTS.lucky
  const pool = guestPool(wave, mix)
  const total = pool.reduce((s, [, w]) => s + w, 0)
  let r = rand() * total
  for (const [id, w] of pool) {
    r -= w
    if (r <= 0) return GUESTS[id]
  }
  return GUESTS.regular
}
