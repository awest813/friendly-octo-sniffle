export const POWERUPS = [
  { id: 'skates', cat: 'SERVER', name: 'ROLLER SKATES', desc: '+40% Server move speed.', rarity: 'COMMON', icon: 'pu_skates', implemented: true },
  { id: 'charm', cat: 'SERVER', name: 'CHARM AURA', desc: 'Patience +30%. Tips +15%.', rarity: 'COMMON', icon: 'pu_charm', implemented: true },
  { id: 'chopper', cat: 'COOK', name: 'AUTO-CHOPPER', desc: 'Boards chop instantly.', rarity: 'COMMON', icon: 'pu_chopper', implemented: true },
  { id: 'tips', cat: 'DINER', name: 'BIGGER TIPS', desc: 'All tips x1.5.', rarity: 'COMMON', icon: 'pu_tips', implemented: true },
  { id: 'grill', cat: 'COOK', name: 'DOUBLE GRILL', desc: 'Spare counter becomes a second grill.', rarity: 'RARE', icon: 'pu_grill', implemented: true },
  { id: 'ghost', cat: 'COOK', name: 'GHOST PAN', desc: 'Grills never burn food.', rarity: 'RARE', icon: 'pu_ghost', implemented: true },
  { id: 'busboy', cat: 'DINER', name: 'ROBOT BUSBOY', desc: 'Clears a dirty table every 12s.', rarity: 'EPIC', icon: 'pu_busboy', implemented: true },
  { id: 'octo', cat: 'SERVER', name: 'OCTO-TRAY', desc: 'Carry 2 plates at once.', rarity: 'RARE', icon: 'pu_octo', implemented: false },
  { id: 'cannon', cat: 'COOK', name: 'INGREDIENT CANNON', desc: 'Yeet held items across the kitchen.', rarity: 'EPIC', icon: 'pu_cannon', implemented: false }
]

export function draftOptions (owned, count = 3) {
  const pool = POWERUPS.filter(p => p.implemented && !owned.has(p.id))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
