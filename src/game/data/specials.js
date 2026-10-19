// Tonight's Special: a random twist on some waves so no two runs feel the
// same. Specials only tweak a wave (order mix, guest mix, tips, pace); they
// never land on the tutorial waves, a themed wave (one with its own `mix`)
// or the finale, so the hand-tuned difficulty curve stays intact.
//   menu:      extra order weight per recipe (recipes the wave lacks are ignored)
//   mix:       extra guest-type weight, as in waves.js
//   tips / patience / spawn: multipliers on the wave's numbers
//   customers: guests added (or removed) this wave
//   luck:      Big Tipper chance multiplier
export const SPECIALS = [
  { id: 'happy', name: 'HAPPY HOUR', desc: 'TIPS X1.5, BUT GUESTS ARRIVE FASTER', color: '#ffd93d', tips: 1.5, spawn: 0.85 },
  { id: 'burgers', name: 'BURGER NIGHT', desc: 'MOSTLY BURGERS, PLUS ONE EXTRA GUEST', color: '#f79a3e', menu: { burger: 4 }, customers: 1 },
  { id: 'salads', name: 'SALAD BAR', desc: 'MOSTLY SALADS: KEEP THOSE BOARDS CHOPPING', color: '#7ed957', menu: { salad: 4 }, tips: 1.1 },
  { id: 'deluxe', name: 'DELUXE DAY', desc: 'MOSTLY DELUXES, AND THEY PAY X1.3', color: '#ff3b8d', menu: { deluxe: 3 }, tips: 1.3, minWave: 5 },
  { id: 'grannies', name: 'EARLY BIRDS', desc: 'GRANNIES OUT IN FORCE: CHILL, BUT SLOW EATERS', color: '#7ed957', mix: { granny: 5 } },
  { id: 'kids', name: 'SCHOOL TRIP', desc: 'KIDS ORDER BURGERS AND WANT THEM NOW', color: '#69b4ea', mix: { kid: 5 }, minWave: 4 },
  { id: 'quiet', name: 'QUIET NIGHT', desc: 'A BREATHER: ONE FEWER GUEST, MORE PATIENCE', color: '#00ffd0', customers: -1, patience: 1.15 },
  { id: 'lucky', name: 'BIG SPENDERS', desc: 'BIG TIPPERS SHOW UP THREE TIMES AS OFTEN', color: '#ffd93d', luck: 3 }
]

export const SPECIAL_BY_ID = Object.fromEntries(SPECIALS.map(s => [s.id, s]))

// Chance that an eligible wave gets a special.
export const SPECIAL_CHANCE = 0.5
export const SPECIAL_FROM_WAVE = 3

// Picks tonight's special for wave n (or null). `last` is the previous
// wave's special id, never repeated back to back.
export function rollSpecial (n, goal, cfg, last = null, rand = Math.random) {
  if (n < SPECIAL_FROM_WAVE || n >= goal || cfg.mix || cfg.endless) return null
  if (rand() >= SPECIAL_CHANCE) return null
  const pool = SPECIALS.filter(s => s.id !== last && n >= (s.minWave || 0) &&
    (!s.menu || Object.keys(s.menu).some(r => cfg.recipes.includes(r))))
  return pool.length ? pool[Math.floor(rand() * pool.length)].id : null
}

// The wave config with a special folded in.
export function withSpecial (cfg, id) {
  const s = id && SPECIAL_BY_ID[id]
  if (!s) return cfg
  const mix = { ...(cfg.mix || {}) }
  Object.entries(s.mix || {}).forEach(([k, w]) => { mix[k] = (mix[k] || 0) + w })
  return {
    ...cfg,
    special: s,
    customers: Math.max(3, cfg.customers + (s.customers || 0)),
    patience: cfg.patience * (s.patience || 1),
    spawnEvery: cfg.spawnEvery * (s.spawn || 1),
    tips: (cfg.tips || 1) * (s.tips || 1),
    luck: (cfg.luck || 1) * (s.luck || 1),
    menu: s.menu || cfg.menu,
    mix
  }
}

// Weighted order pick: every recipe on the wave's menu has weight 1, plus
// whatever the special adds.
export function pickOrder (recipes, menu = {}, rand = Math.random) {
  const weights = recipes.map(r => 1 + (menu[r] || 0))
  let r = rand() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < recipes.length; i++) {
    r -= weights[i]
    if (r <= 0) return recipes[i]
  }
  return recipes[recipes.length - 1]
}
