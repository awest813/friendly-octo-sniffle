// Procedural chiptune loops (no audio files). A lookahead scheduler queues
// 16th-note steps slightly ahead of the audio clock so timing stays tight
// even when frames hitch.
import Settings, { onSettingsChange } from '@/game/state/settings'

const LOOKAHEAD = 0.12
const BASE_VOLUME = 0.14

const midi = n => 440 * Math.pow(2, (n - 69) / 12)

// Chords as [bass root, chord tones]; each chord lasts 16 steps.
const TRACKS = {
  menu: {
    bpm: 96,
    chords: [[48, [60, 64, 67]], [45, [57, 60, 64]], [41, [53, 57, 60]], [43, [55, 59, 62]]],
    bass: [0, 6, 8, 14],
    lead: [[0, 0], [4, 1], [6, 2], [10, 1], [12, 0]],
    hats: [4, 12],
    kick: []
  },
  game: {
    bpm: 132,
    chords: [[45, [57, 60, 64]], [41, [53, 57, 60]], [48, [60, 64, 67]], [43, [55, 59, 62]]],
    bass: [0, 2, 4, 6, 8, 10, 12, 14],
    lead: [[0, 0], [3, 2], [6, 1], [8, 2], [10, 0], [14, 1]],
    hats: [2, 6, 10, 14],
    kick: [0, 8]
  }
}

let ctx = null
let out = null
let noiseBuf = null
let current = null
let timer = null
let step = 0
let nextTime = 0
let ducked = false
let intensity = 1

function applyVolume () {
  if (!out) return
  out.gain.value = BASE_VOLUME * (Settings.music / 10) * (ducked ? 0.35 : 1)
}

export function initMusic (audioContext) {
  if (ctx || !audioContext) return
  ctx = audioContext
  out = ctx.createGain()
  out.connect(ctx.destination)
  noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.05), ctx.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  applyVolume()
  onSettingsChange(applyVolume)
}

function voice (freq, t, dur, type, vol, slideTo) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(gain).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function hat (t) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 7000
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.25, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
  src.connect(filter).connect(gain).connect(out)
  src.start(t)
}

function playStep (track, s, t, stepLen) {
  const chord = track.chords[Math.floor(s / 16) % track.chords.length]
  const inBar = s % 16
  const [root, tones] = chord
  if (track.bass.includes(inBar)) {
    const fifth = track === TRACKS.game && inBar % 4 === 2 ? 7 : 0
    voice(midi(root + fifth), t, stepLen * 1.6, 'triangle', 0.7)
  }
  const lead = track.lead.find(([at]) => at === inBar)
  if (lead) voice(midi(tones[lead[1]] + 12), t, stepLen * 1.8, 'square', 0.18)
  if (track.hats.includes(inBar)) hat(t)
  if (track.kick.includes(inBar)) voice(110, t, 0.12, 'sine', 0.8, 40)
}

function schedule () {
  if (!current || ctx.state !== 'running') return
  const stepLen = 60 / (current.bpm * intensity) / 4
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.02
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    if (Settings.music > 0) playStep(current, step, nextTime, stepLen)
    nextTime += stepLen
    step = (step + 1) % (current.chords.length * 16)
  }
}

export function playMusic (name) {
  if (!ctx || current === TRACKS[name]) return
  current = TRACKS[name]
  intensity = 1
  step = 0
  nextTime = ctx.currentTime + 0.05
  if (!timer) timer = setInterval(schedule, 25)
}

// Speeds the loop up for the final stretch of a wave (1 = normal).
export function setMusicIntensity (value) {
  intensity = value
}

export function stopMusic () {
  current = null
}

// Quieter while paused or in a menu over the game.
export function duckMusic (on) {
  ducked = on
  applyVolume()
}
