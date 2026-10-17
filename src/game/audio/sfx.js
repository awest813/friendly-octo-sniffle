// Tiny WebAudio synth so the slice needs no audio assets.
import Settings, { onSettingsChange } from '@/game/state/settings'

let ctx = null
let master = null

export function initSfx (scene) {
  if (ctx) return
  ctx = scene.sound && scene.sound.context
  if (!ctx) return
  master = ctx.createGain()
  master.connect(ctx.destination)
  const apply = () => { master.gain.value = 0.26 * Settings.sfx / 10 }
  apply()
  onSettingsChange(apply)
}

function tone (freq, start, dur, type = 'square', vol = 1, slideTo = null) {
  const t = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(gain).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise (start, dur, vol = 0.6, freq = 3000) {
  const t = ctx.currentTime + start
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
  src.connect(filter).connect(gain).connect(master)
  src.start(t)
}

const SOUNDS = {
  pickup: () => tone(520, 0, 0.06, 'square', 0.5, 780),
  drop: () => tone(420, 0, 0.06, 'square', 0.5, 260),
  error: () => { tone(140, 0, 0.12, 'sawtooth', 0.6); tone(110, 0.1, 0.16, 'sawtooth', 0.6) },
  chop: () => noise(0, 0.05, 0.5, 2400),
  chopDone: () => { noise(0, 0.05, 0.5, 2400); tone(880, 0.03, 0.08, 'triangle', 0.6) },
  sizzle: () => noise(0, 0.35, 0.25, 5200),
  ready: () => tone(988, 0, 0.12, 'triangle', 0.7),
  burn: () => { noise(0, 0.5, 0.6, 900); tone(220, 0, 0.4, 'sawtooth', 0.4, 90) },
  ding: () => { tone(1568, 0, 0.5, 'sine', 0.8); tone(2093, 0, 0.4, 'sine', 0.4) },
  tip: () => { tone(784, 0, 0.07, 'square', 0.5); tone(1047, 0.07, 0.07, 'square', 0.5); tone(1568, 0.14, 0.12, 'square', 0.5) },
  angry: () => tone(330, 0, 0.45, 'sawtooth', 0.6, 110),
  seat: () => { tone(660, 0, 0.06, 'triangle', 0.6); tone(880, 0.06, 0.08, 'triangle', 0.6) },
  wash: () => noise(0, 0.25, 0.3, 1500),
  select: () => tone(660, 0, 0.05, 'square', 0.4),
  confirm: () => { tone(523, 0, 0.08, 'square', 0.5); tone(784, 0.08, 0.14, 'square', 0.5) },
  spray: () => noise(0, 0.18, 0.35, 6000),
  fire: () => { tone(880, 0, 0.12, 'square', 0.5); tone(660, 0.14, 0.12, 'square', 0.5) },
  fireOut: () => { noise(0, 0.4, 0.4, 7000); tone(523, 0.1, 0.1, 'triangle', 0.6, 1046) },
  throw: () => noise(0, 0.22, 0.4, 1800),
  buy: () => { tone(1047, 0, 0.06, 'square', 0.5); tone(1319, 0.06, 0.06, 'square', 0.5); tone(2093, 0.12, 0.1, 'square', 0.4) },
  pause: () => tone(440, 0, 0.08, 'triangle', 0.6),
  wave: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.14, 'square', 0.45))
}

export function audioContext () {
  return ctx
}

export function sfx (name) {
  if (!ctx || !SOUNDS[name] || !Settings.sfx) return
  if (ctx.state === 'suspended') ctx.resume()
  SOUNDS[name]()
}
