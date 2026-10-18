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

export function draftOptions (owned, count = 3) {
  const pool = POWERUPS.filter(p => !owned.has(p.id))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
