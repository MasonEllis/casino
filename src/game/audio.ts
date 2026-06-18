const MUSIC_VOL = 0.1
const SFX_VOL = 0.38
const CHORD_DURATION = 4

const CHORDS = [
  [220, 261.63, 329.63, 392],
  [174.61, 220, 261.63, 329.63],
  [261.63, 329.63, 392, 493.88],
  [196, 246.94, 293.66, 349.23],
] as const

const WIN_NOTES = [523.25, 659.25, 783.99, 1046.5]

let ctx: AudioContext | null = null
let musicGain: GainNode | null = null
let sfxGain: GainNode | null = null
let musicTimer: ReturnType<typeof setInterval> | null = null
let chordIndex = 0
let musicStarted = false
let muted = false

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function ensureGains() {
  const c = getCtx()
  if (!musicGain) {
    musicGain = c.createGain()
    musicGain.gain.value = muted ? 0 : MUSIC_VOL
    musicGain.connect(c.destination)
  }
  if (!sfxGain) {
    sfxGain = c.createGain()
    sfxGain.gain.value = muted ? 0 : SFX_VOL
    sfxGain.connect(c.destination)
  }
}

export function initAudio() {
  muted = localStorage.getItem('casino-muted') === 'true'
}

export function isMuted() {
  return muted
}

export function setMuted(next: boolean) {
  muted = next
  localStorage.setItem('casino-muted', String(next))
  if (musicGain) musicGain.gain.value = next ? 0 : MUSIC_VOL
  if (sfxGain) sfxGain.gain.value = next ? 0 : SFX_VOL
}

export function toggleMuted() {
  const next = !muted
  setMuted(next)
  if (!next) startBackgroundMusic()
  return next
}

export async function resumeAudio() {
  const c = getCtx()
  if (c.state === 'suspended') await c.resume()
}

function playChord() {
  if (!musicGain || muted) return
  const c = getCtx()
  const chord = CHORDS[chordIndex % CHORDS.length]
  chordIndex += 1
  const now = c.currentTime

  for (const freq of chord) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const filter = c.createBiquadFilter()
    osc.type = 'triangle'
    osc.frequency.value = freq
    filter.type = 'lowpass'
    filter.frequency.value = 720
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(musicGain)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.09, now + 0.6)
    gain.gain.setValueAtTime(0.09, now + CHORD_DURATION - 0.7)
    gain.gain.linearRampToValueAtTime(0, now + CHORD_DURATION)
    osc.start(now)
    osc.stop(now + CHORD_DURATION + 0.05)
  }
}

export function startBackgroundMusic() {
  if (musicStarted) return
  musicStarted = true
  ensureGains()
  void resumeAudio()
  playChord()
  musicTimer = setInterval(playChord, CHORD_DURATION * 1000)
}

export function stopBackgroundMusic() {
  if (musicTimer) clearInterval(musicTimer)
  musicTimer = null
  musicStarted = false
}

export function playWinSound() {
  if (muted) return
  ensureGains()
  void resumeAudio()
  const c = getCtx()
  const now = c.currentTime

  WIN_NOTES.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(sfxGain!)
    const t = now + i * 0.07
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.45, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
    osc.start(t)
    osc.stop(t + 0.35)
  })

  const noise = c.createBufferSource()
  const buffer = c.createBuffer(1, c.sampleRate * 0.06, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  noise.buffer = buffer
  const noiseGain = c.createGain()
  const noiseFilter = c.createBiquadFilter()
  noiseFilter.type = 'highpass'
  noiseFilter.frequency.value = 4000
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(sfxGain!)
  noiseGain.gain.setValueAtTime(0.18, now + 0.22)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
  noise.start(now + 0.22)
  noise.stop(now + 0.32)
}