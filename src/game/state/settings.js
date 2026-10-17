// Player settings, saved to localStorage when it's available. Every access is
// guarded: private windows and embedded previews can block storage, and the
// game must still run on defaults.
const KEY = 'duo-diner:settings'

export const AI_SKILLS = ['CHILL', 'NORMAL', 'SHARP']

// Difficulty sets how long the night is (`waves` to save the diner) and how
// much breathing room each wave has. EASY is a first-class way to play, not a
// penalty box. HARD pays a little extra for the extra pressure.
export const DIFFICULTIES = {
  EASY: { waves: 8, patience: 1.4, spawn: 1.25, tips: 1 },
  MEDIUM: { waves: 10, patience: 1, spawn: 1, tips: 1 },
  HARD: { waves: 12, patience: 0.9, spawn: 0.95, tips: 1.25 }
}

// Names used before 0.10, still found in saved settings and scores.
const LEGACY = { RELAXED: 'EASY', NORMAL: 'MEDIUM', FRANTIC: 'HARD' }

export function difficultyName (name) {
  return LEGACY[name] || name
}

const DEFAULTS = {
  sfx: 7, // 0-10
  music: 5, // 0-10
  shake: true,
  rumble: true,
  aiSkill: 'NORMAL',
  difficulty: 'MEDIUM',
  prompts: true
}

function load () {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || '{}')
    const s = { ...DEFAULTS, ...(saved && typeof saved === 'object' ? saved : {}) }
    s.difficulty = difficultyName(s.difficulty)
    if (!DIFFICULTIES[s.difficulty]) s.difficulty = DEFAULTS.difficulty
    return s
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
