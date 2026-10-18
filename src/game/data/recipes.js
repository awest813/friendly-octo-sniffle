export const INGREDIENTS = {
  bun: { plateReady: 'raw' },
  patty: { grill: true, plateReady: 'cooked' },
  lettuce: { chop: true, plateReady: 'chopped' },
  tomato: { chop: true, plateReady: 'chopped' }
}

export const RECIPES = {
  burger: { name: 'BURGER', icon: 'dish_burger', parts: ['bun', 'patty'] },
  salad: { name: 'SALAD', icon: 'dish_salad', parts: ['lettuce', 'tomato'] },
  deluxe: { name: 'DELUXE', icon: 'dish_deluxe', parts: ['bun', 'patty', 'lettuce'] }
}

export function matchRecipe (contents) {
  const key = [...contents].sort().join('+')
  return Object.keys(RECIPES).find(id => [...RECIPES[id].parts].sort().join('+') === key) || null
}

export function canAddToPlate (contents, ingredient) {
  if (contents.includes(ingredient)) return false
  return Object.values(RECIPES).some(r =>
    r.parts.includes(ingredient) && contents.every(c => r.parts.includes(c))
  )
}
