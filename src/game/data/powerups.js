export const POWERUPS = [
  { id: 'skates', cat: 'SERVER', name: 'ROLLER SKATES', desc: '+40% Server move speed.', rarity: 'COMMON', icon: 'pu_skates' },
  { id: 'charm', cat: 'SERVER', name: 'CHARM AURA', desc: 'Patience +30%. Tips +15%.', rarity: 'COMMON', icon: 'pu_charm' },
  { id: 'chopper', cat: 'COOK', name: 'AUTO-CHOPPER', desc: 'Boards chop instantly.', rarity: 'COMMON', icon: 'pu_chopper' },
  { id: 'tips', cat: 'DINER', name: 'BIGGER TIPS', desc: 'All tips x1.5.', rarity: 'COMMON', icon: 'pu_tips' },
  { id: 'grill', cat: 'COOK', name: 'DOUBLE GRILL', desc: 'Spare counter becomes a second grill.', rarity: 'RARE', icon: 'pu_grill' },
  { id: 'ghost', cat: 'COOK', name: 'GHOST PAN', desc: 'Grills never burn food.', rarity: 'RARE', icon: 'pu_ghost' },
  { id: 'busboy', cat: 'DINER', name: 'ROBOT BUSBOY', desc: 'Clears a dirty table every 12s.', rarity: 'EPIC', icon: 'pu_busboy' },
  { id: 'octo', cat: 'SERVER', name: 'OCTO-TRAY', desc: 'Carry 2 plates. +$2 serving with both full.', rarity: 'RARE', icon: 'pu_octo' },
  { id: 'cannon', cat: 'COOK', name: 'INGREDIENT CANNON', desc: 'Y yeets ingredients onto counters or the Server.', rarity: 'EPIC', icon: 'pu_cannon' },
  { id: 'coffee', cat: 'COOK', name: 'COFFEE BREAK', desc: '+30% Cook move speed.', rarity: 'COMMON', icon: 'pu_coffee' },
  { id: 'sink', cat: 'DINER', name: 'POWER SINK', desc: 'Plates wash twice as fast.', rarity: 'COMMON', icon: 'pu_sink' },
  { id: 'comfy', cat: 'DINER', name: 'COMFY CHAIRS', desc: 'Seated guests lose patience 30% slower.', rarity: 'RARE', icon: 'pu_chair' },
  { id: 'clover', cat: 'SERVER', name: 'LUCKY STREAK', desc: 'Streaks build twice as fast, up to x2.', rarity: 'RARE', icon: 'pu_clover' }
]

// How often each rarity turns up in a draft, relative to the others.
export const RARITY_WEIGHT = { COMMON: 5, RARE: 3, EPIC: 2 }

// Pick `count` power-ups not already owned, weighted by rarity, no repeats
// (weighted sampling: each card gets a random key rand^(1/weight), best keys win).
export function draftOptions (owned, count = 3, rand = Math.random) {
  return POWERUPS.filter(p => !owned.has(p.id))
    .map(p => ({ p, key: Math.pow(rand(), 1 / RARITY_WEIGHT[p.rarity]) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map(e => e.p)
}
