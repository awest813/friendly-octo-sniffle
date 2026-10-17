// Waves 1-8 are hand-authored. Clearing wave 8 saves the diner.
// Wave 9 is endless: every TUNING.endlessStep customers served, spawns and
// patience get TUNING.endlessScale harsher.
export const WAVES = [
  { name: 'OPENING SHIFT', tag: 'TUTORIAL', customers: 3, tables: 2, patience: 45, spawnEvery: 14, recipes: ['burger'] },
  { name: 'LUNCH RUSH', tag: 'EASY', customers: 5, tables: 3, patience: 35, spawnEvery: 11, recipes: ['burger', 'salad'] },
  { name: 'FIRST DRAFT', tag: 'POWER-UP #1', customers: 6, tables: 3, patience: 32, spawnEvery: 10, recipes: ['burger', 'salad'], draft: true },
  { name: 'DOUBLE BOOKED', tag: 'MEDIUM', customers: 8, tables: 4, patience: 30, spawnEvery: 14, recipes: ['burger', 'salad', 'deluxe'], group: 2 },
  { name: 'FIRE IN KITCHEN', tag: 'MID-BOSS', customers: 8, tables: 4, patience: 28, spawnEvery: 9, recipes: ['burger', 'salad', 'deluxe'], fire: true },
  { name: 'SECOND DRAFT', tag: 'POWER-UP #2', customers: 9, tables: 5, patience: 26, spawnEvery: 9, recipes: ['burger', 'salad', 'deluxe'], draft: true },
  { name: 'VIP FOOD CRITIC', tag: 'HARD', customers: 9, tables: 5, patience: 26, spawnEvery: 9, recipes: ['burger', 'salad', 'deluxe'], critics: 2 },
  { name: 'FULL HOUSE', tag: 'HARDER', customers: 12, tables: 6, patience: 24, spawnEvery: 13, recipes: ['burger', 'salad', 'deluxe'], group: 2 },
  { name: 'CLOSING TIME', tag: 'ENDLESS', customers: Infinity, tables: 6, patience: 24, spawnEvery: 8, recipes: ['burger', 'salad', 'deluxe'], endless: true }
]

export const WIN_WAVE = 8

export const CRITIC = { patience: 15, tipMult: 3 }
