// Player settings, saved to localStorage when it's available. Every access is
// guarded: private windows and embedded previews can block storage, and the
// game must still run on defaults.
const KEY = 'duo-diner:settings'

export const AI_SKILLS = ['CHILL', 'NORMAL', 'SHARP']

// RELAXED is a first-class way to play, not a penalty box: same content,
// more breathing room. FRANTIC pays a little extra for the extra pressure.
export const DIFFICULTIES = {
  RELAXED: { patience: 1.4, spawn: 1.25, tips: 1 },
  NORMAL: { patience: 1, spawn: 1, tips: 1 },
  FRANTIC: { patience: 0.85, spawn: 0.9, tips: 1.25 }
}

const DEFAULTS = {
  sfx: 7, // 0-10
  music: 5, // 0-10
  shake: true,
  rumble: true,
  aiSkill: 'NORMAL',
  difficulty: 'NORMAL',
  prompts: true
}

function load () {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || '{}')
    return { ...DEFAULTS, ...(saved && typeof saved === 'object' ? saved : {}) }
  } catch (e) {
    return { ...DEFAULTS }
  }
}

const listeners = new Set()
const Settings = load()

export function saveSettings () {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Settings))
  } catch (e) {
    // Not saved; the change still applies for this session.
  }
  listeners.forEach(fn => fn(Settings))
}

export function onSettingsChange (fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export default Settings
