// Waves 1-8 are hand-authored. Clearing wave 8 saves the diner.
// From wave 5 on (`fire`), burnt food left on a grill catches fire.
// Wave 9 is endless: every TUNING.endlessStep customers served, spawns and
// patience get TUNING.endlessScale harsher.
export const WAVES = [
  { name: 'OPENING SHIFT', tag: 'TUTORIAL', customers: 3, tables: 2, patience: 45, spawnEvery: 14, recipes: ['burger'], hint: 'COOK: BUN + GRILLED PATTY ON A PLATE > PASS. SERVER: SEAT > ORDER > SERVE' },
  { name: 'LUNCH RUSH', tag: 'EASY', customers: 5, tables: 3, patience: 36, spawnEvery: 12, recipes: ['burger', 'salad'], hint: 'NEW: SALAD = CHOPPED LETTUCE + TOMATO. HOLD X AT THE BOARD TO CHOP' },
  { name: 'FIRST DRAFT', tag: 'POWER-UP #1', customers: 6, tables: 3, patience: 34, spawnEvery: 11, recipes: ['burger', 'salad'], draft: true, hint: 'SERVER: BRING DIRTY PLATES TO THE SINK. NO PLATES, NO FOOD' },
  { name: 'DOUBLE BOOKED', tag: 'MEDIUM', customers: 6, tables: 4, patience: 32, spawnEvery: 18, recipes: ['burger', 'salad', 'deluxe'], group: 2, hint: 'NEW: DELUXE = BUN + PATTY + CHOPPED LETTUCE. GUESTS COME IN PAIRS' },
  { name: 'FIRE IN KITCHEN', tag: 'MID-BOSS', customers: 7, tables: 4, patience: 30, spawnEvery: 11, recipes: ['burger', 'salad', 'deluxe'], fire: true, hint: 'BURNT FOOD NOW CATCHES FIRE! GRAB THE RED EXTINGUISHER, HOLD X' },
  { name: 'SECOND DRAFT', tag: 'POWER-UP #2', customers: 8, tables: 5, patience: 30, spawnEvery: 10, recipes: ['burger', 'salad', 'deluxe'], draft: true, fire: true, hint: 'FIRE SMOKE MAKES EVERY CUSTOMER LOSE PATIENCE FASTER' },
  { name: 'VIP FOOD CRITIC', tag: 'HARD', customers: 9, tables: 5, patience: 28, spawnEvery: 10, recipes: ['burger', 'salad', 'deluxe'], critics: 2, fire: true, hint: 'VIP CRITICS: 15S PATIENCE BUT X3 TIPS. SERVE THEM FIRST' },
  { name: 'FULL HOUSE', tag: 'HARDER', customers: 10, tables: 6, patience: 26, spawnEvery: 16, recipes: ['burger', 'salad', 'deluxe'], group: 2, fire: true, hint: 'FULL HOUSE: EVERY TABLE IS OPEN. KEEP THOSE PLATES MOVING' },
  { name: 'CLOSING TIME', tag: 'ENDLESS', customers: Infinity, tables: 6, patience: 26, spawnEvery: 9, recipes: ['burger', 'salad', 'deluxe'], endless: true, fire: true, hint: 'ENDLESS: EVERY 4 SERVED, GUESTS COME FASTER AND WAIT LESS' }
]

export const WIN_WAVE = 8

export const CRITIC = { patience: 15, tipMult: 3 }
