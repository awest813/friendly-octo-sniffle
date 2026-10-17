// Player settings, saved to localStorage when it's available. Every access is
// guarded: private windows and embedded previews can block storage, and the
// game must still run on defaults.
const KEY = 'duo-diner:settings'

export const AI_SKILLS = ['CHILL', 'NORMAL', 'SHARP']

const DEFAULTS = {
  sfx: 7, // 0-10
  music: 5, // 0-10
  shake: true,
  rumble: true,
  aiSkill: 'NORMAL'
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
