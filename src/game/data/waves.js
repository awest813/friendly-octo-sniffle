// Waves 1-12 are hand-authored. Clearing the difficulty's last wave (8 EASY,
// 10 MEDIUM, 12 HARD) saves the diner; after that comes endless CLOSING TIME,
// where every TUNING.endlessStep customers served, spawns and patience get
// TUNING.endlessScale harsher.
// From wave 5 on (`fire`), burnt food left on a grill catches fire.
// Drafts (`draft`) come before waves 3, 5, 7, 9 and 11.
// `mix` adds guest-type weights on top of the usual pool for a themed wave.
export const WAVES = [
  { name: 'OPENING SHIFT', tag: 'TUTORIAL', customers: 3, tables: 2, patience: 45, spawnEvery: 14, recipes: ['burger'], hint: 'COOK: BUN + GRILLED PATTY ON A PLATE > PASS. SERVER: SEAT > ORDER > SERVE' },
  { name: 'LUNCH RUSH', tag: 'EASY', customers: 5, tables: 3, patience: 36, spawnEvery: 12, recipes: ['burger', 'salad'], hint: 'NEW: SALAD = CHOPPED LETTUCE + TOMATO. HOLD X AT THE BOARD TO CHOP' },
  { name: 'FIRST DRAFT', tag: 'POWER-UP', customers: 6, tables: 3, patience: 34, spawnEvery: 11, recipes: ['burger', 'salad'], draft: true, hint: 'SERVER: BRING DIRTY PLATES TO THE SINK. NO PLATES, NO FOOD' },
  { name: 'DOUBLE BOOKED', tag: 'MEDIUM', customers: 6, tables: 4, patience: 32, spawnEvery: 18, recipes: ['burger', 'salad', 'deluxe'], group: 2, hint: 'NEW: DELUXE = BUN + PATTY + CHOPPED LETTUCE. GUESTS COME IN PAIRS' },
  { name: 'FIRE IN KITCHEN', tag: 'MID-BOSS + DRAFT', draft: true, customers: 7, tables: 4, patience: 30, spawnEvery: 12, recipes: ['burger', 'salad', 'deluxe'], fire: true, hint: 'BURNT FOOD NOW CATCHES FIRE! GRAB THE RED EXTINGUISHER, HOLD X' },
  { name: 'DINNER RUSH', tag: 'BUSY', customers: 7, tables: 5, patience: 30, spawnEvery: 12, recipes: ['burger', 'salad', 'deluxe'], fire: true, hint: 'FIRE SMOKE MAKES EVERY CUSTOMER LOSE PATIENCE FASTER' },
  { name: 'VIP FOOD CRITIC', tag: 'HARD + DRAFT', draft: true, customers: 8, tables: 5, patience: 28, spawnEvery: 11, recipes: ['burger', 'salad', 'deluxe'], critics: 2, fire: true, hint: 'VIP CRITICS: 15S PATIENCE BUT X3 TIPS. SERVE THEM FIRST' },
  { name: 'FULL HOUSE', tag: 'HARDER', customers: 10, tables: 6, patience: 26, spawnEvery: 18, recipes: ['burger', 'salad', 'deluxe'], group: 2, fire: true, hint: 'FULL HOUSE: EVERY TABLE IS OPEN. KEEP THOSE PLATES MOVING' },
  { name: 'NIGHT OWLS', tag: 'HARD + DRAFT', draft: true, customers: 9, tables: 6, patience: 26, spawnEvery: 13, recipes: ['burger', 'salad', 'deluxe'], mix: { rusher: 3 }, fire: true, hint: 'NIGHT OWLS: RUSH GUESTS WAIT LESS BUT TIP X1.6. SEAT THEM FAST' },
  { name: 'BUS TOUR', tag: 'GROUPS OF 3', customers: 9, tables: 6, patience: 27, spawnEvery: 21, recipes: ['burger', 'salad', 'deluxe'], group: 3, mix: { granny: 6 }, fire: true, hint: 'BUS TOUR: GUESTS ARRIVE 3 AT A TIME. GRANNIES ARE CHILL BUT EAT SLOW' },
  { name: 'CRITICS NIGHT', tag: 'BRUTAL + DRAFT', draft: true, customers: 10, tables: 6, patience: 25, spawnEvery: 11, recipes: ['burger', 'salad', 'deluxe'], critics: 3, fire: true, hint: 'CRITICS NIGHT: THREE VIPS TONIGHT. GOLD TICKETS GO FIRST' },
  { name: 'MIDNIGHT RUSH', tag: 'FINAL BOSS', customers: 12, tables: 6, patience: 24, spawnEvery: 15, recipes: ['burger', 'salad', 'deluxe'], group: 2, critics: 2, mix: { rusher: 2 }, fire: true, hint: 'MIDNIGHT RUSH: PAIRS, VIPS AND RUSHERS. EVERYTHING AT ONCE' }
]

export const ENDLESS = { name: 'CLOSING TIME', tag: 'ENDLESS', customers: Infinity, tables: 6, patience: 26, spawnEvery: 9, recipes: ['burger', 'salad', 'deluxe'], endless: true, fire: true, hint: 'ENDLESS: EVERY 4 SERVED, GUESTS COME FASTER AND WAIT LESS' }

// Wave n of a run whose last wave is `goal`. Closing Time starts no gentler
// than the final wave was.
export function waveFor (n, goal) {
  if (n <= goal) return WAVES[Math.min(n, WAVES.length) - 1]
  const last = WAVES[goal - 1]
  return { ...ENDLESS, patience: Math.min(ENDLESS.patience, last.patience) }
}

export const CRITIC = { patience: 15, tipMult: 3 }
