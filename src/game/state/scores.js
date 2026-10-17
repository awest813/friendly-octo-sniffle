// Local top-5 by tips. Storage can be missing or blocked (private windows,
// embedded previews), so every access is guarded and the game works without it.
const KEY = 'duo-diner:scores'
const MAX = 5

export function loadScores () {
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch (e) {
    return []
  }
}

// Returns the 0-based rank of the new entry, or -1 if it didn't place.
export function addScore (entry) {
  const list = loadScores()
  list.push(entry)
  list.sort((a, b) => b.tips - a.tips || b.waves - a.waves)
  const rank = list.indexOf(entry)
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch (e) {
    // Not saved; the run still shows its result.
  }
  return rank < MAX ? rank : -1
}

// Runs from before 0.10 had no `goal`; back then 8 waves saved the diner.
export function savedDiner (entry) {
  return entry.waves >= (entry.goal || 8)
}

export function allBots (registry) {
  const ai = registry.get('ai') || {}
  return !!(ai.cook && ai.server)
}
