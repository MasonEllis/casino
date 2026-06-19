import type { MusicTrackId } from '../../shared/lobbyProtocol'

export type { MusicTrackId } from '../../shared/lobbyProtocol'

export interface MusicTrackInfo {
  id: MusicTrackId
  name: string
  tagline: string
}

export const MUSIC_TRACKS: MusicTrackInfo[] = [
  { id: 'lounge', name: 'Floor Lounge', tagline: 'Upbeat Vegas swing' },
  { id: 'ambient', name: 'Midnight Haze', tagline: 'Slow moody pads (original)' },
  { id: 'velvet', name: 'Velvet Room', tagline: 'Soft bossa groove' },
  { id: 'neon', name: 'Neon Nights', tagline: 'Synth pulse & arps' },
  { id: 'jackpot', name: 'Jackpot March', tagline: 'Brassy celebration' },
]

const TRACK_KEY = 'casino-music-track'

export function loadMusicTrack(): MusicTrackId {
  const raw = localStorage.getItem(TRACK_KEY)
  return MUSIC_TRACKS.some((t) => t.id === raw) ? (raw as MusicTrackId) : 'lounge'
}

export function saveMusicTrack(id: MusicTrackId) {
  localStorage.setItem(TRACK_KEY, id)
}

type MusicSink = GainNode

function playTone(
  musicGain: MusicSink,
  getCtx: () => AudioContext,
  freq: number,
  start: number,
  duration: number,
  peak: number,
  type: OscillatorType = 'sine',
  filterHz = 2200,
) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  const filter = c.createBiquadFilter()
  osc.type = type
  osc.frequency.value = freq
  filter.type = 'lowpass'
  filter.frequency.value = filterHz
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(musicGain)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function playHiHat(musicGain: MusicSink, getCtx: () => AudioContext, at: number, vol = 0.028) {
  const c = getCtx()
  const samples = Math.floor(c.sampleRate * 0.025)
  const buffer = c.createBuffer(1, samples, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / samples)
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 7000
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, at)
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.025)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(musicGain)
  src.start(at)
  src.stop(at + 0.03)
}

function playShaker(musicGain: MusicSink, getCtx: () => AudioContext, at: number) {
  const c = getCtx()
  const samples = Math.floor(c.sampleRate * 0.06)
  const buffer = c.createBuffer(1, samples, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / samples) ** 1.5
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 4200
  filter.Q.value = 0.8
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.018, at)
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.06)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(musicGain)
  src.start(at)
  src.stop(at + 0.065)
}

export interface TrackPlayer {
  intervalMs: number
  play: () => void
  reset: () => void
}

export function createTrackPlayer(
  id: MusicTrackId,
  musicGain: MusicSink,
  getCtx: () => AudioContext,
): TrackPlayer {
  switch (id) {
    case 'lounge':
      return createLoungePlayer(musicGain, getCtx)
    case 'ambient':
      return createAmbientPlayer(musicGain, getCtx)
    case 'velvet':
      return createVelvetPlayer(musicGain, getCtx)
    case 'neon':
      return createNeonPlayer(musicGain, getCtx)
    case 'jackpot':
      return createJackpotPlayer(musicGain, getCtx)
  }
}

function createLoungePlayer(musicGain: MusicSink, getCtx: () => AudioContext): TrackPlayer {
  const BPM = 124
  const BEAT = 60 / BPM
  const intervalMs = BEAT * 4 * 1000
  const PROGRESSION = [
    { bass: 130.81, chord: [329.63, 392, 493.88], accent: 659.25 },
    { bass: 110, chord: [261.63, 329.63, 392], accent: 523.25 },
    { bass: 174.61, chord: [349.23, 440, 523.25], accent: 587.33 },
    { bass: 196, chord: [392, 493.88, 587.33], accent: 659.25 },
  ] as const
  let barIndex = 0

  return {
    intervalMs,
    reset: () => { barIndex = 0 },
    play: () => {
      const step = PROGRESSION[barIndex % PROGRESSION.length]
      barIndex += 1
      const now = getCtx().currentTime
      playTone(musicGain, getCtx, step.bass, now, BEAT * 0.85, 0.14, 'sine', 520)
      playTone(musicGain, getCtx, step.bass * 1.25, now + BEAT * 2, BEAT * 0.7, 0.1, 'sine', 520)
      for (const freq of step.chord) {
        playTone(musicGain, getCtx, freq, now, BEAT * 0.55, 0.045, 'sine', 2600)
        playTone(musicGain, getCtx, freq, now + BEAT * 2.5, BEAT * 0.4, 0.03, 'sine', 2400)
      }
      playTone(musicGain, getCtx, step.accent, now + BEAT * 1.25, BEAT * 0.35, 0.055, 'triangle', 3000)
      playTone(musicGain, getCtx, step.accent * 1.125, now + BEAT * 3.25, BEAT * 0.3, 0.04, 'triangle', 3000)
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 1) playHiHat(musicGain, getCtx, now + i * BEAT * 0.5)
      }
    },
  }
}

function createAmbientPlayer(musicGain: MusicSink, getCtx: () => AudioContext): TrackPlayer {
  const CHORD_DURATION = 4
  const intervalMs = CHORD_DURATION * 1000
  const CHORDS = [
    [220, 261.63, 329.63, 392],
    [174.61, 220, 261.63, 329.63],
    [261.63, 329.63, 392, 493.88],
    [196, 246.94, 293.66, 349.23],
  ] as const
  let chordIndex = 0

  return {
    intervalMs,
    reset: () => { chordIndex = 0 },
    play: () => {
      const chord = CHORDS[chordIndex % CHORDS.length]
      chordIndex += 1
      const c = getCtx()
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
    },
  }
}

function createVelvetPlayer(musicGain: MusicSink, getCtx: () => AudioContext): TrackPlayer {
  const BPM = 102
  const BEAT = 60 / BPM
  const intervalMs = BEAT * 4 * 1000
  const PROGRESSION = [
    { bass: 146.83, pluck: [293.66, 369.99, 440] },
    { bass: 196, pluck: [392, 493.88, 587.33] },
    { bass: 130.81, pluck: [261.63, 329.63, 392] },
    { bass: 110, pluck: [220, 277.18, 329.63] },
  ] as const
  let barIndex = 0

  return {
    intervalMs,
    reset: () => { barIndex = 0 },
    play: () => {
      const step = PROGRESSION[barIndex % PROGRESSION.length]
      barIndex += 1
      const now = getCtx().currentTime
      playTone(musicGain, getCtx, step.bass, now, BEAT * 1.1, 0.1, 'sine', 380)
      playTone(musicGain, getCtx, step.bass * 0.5, now + BEAT * 2, BEAT * 0.9, 0.07, 'sine', 320)
      step.pluck.forEach((freq, i) => {
        playTone(musicGain, getCtx, freq, now + BEAT * (0.5 + i * 0.5), BEAT * 0.28, 0.038, 'sine', 1800)
      })
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 1) playShaker(musicGain, getCtx, now + i * BEAT * 0.5)
      }
    },
  }
}

function createNeonPlayer(musicGain: MusicSink, getCtx: () => AudioContext): TrackPlayer {
  const BPM = 118
  const BEAT = 60 / BPM
  const intervalMs = BEAT * 2 * 1000
  const ARP = [261.63, 329.63, 392, 523.25, 392, 329.63] as const
  const BASS = [130.81, 130.81, 174.61, 196] as const
  let step = 0

  return {
    intervalMs,
    reset: () => { step = 0 },
    play: () => {
      const now = getCtx().currentTime
      const bass = BASS[Math.floor(step / 3) % BASS.length]
      playTone(musicGain, getCtx, bass, now, BEAT * 0.35, 0.12, 'square', 420)
      playTone(musicGain, getCtx, bass, now + BEAT, BEAT * 0.35, 0.1, 'square', 420)
      for (let i = 0; i < 4; i++) {
        const freq = ARP[(step + i) % ARP.length]
        playTone(musicGain, getCtx, freq, now + i * BEAT * 0.5, BEAT * 0.22, 0.04, 'square', 1400)
      }
      if (step % 2 === 0) playHiHat(musicGain, getCtx, now + BEAT * 1.5, 0.02)
      step += 1
    },
  }
}

function createJackpotPlayer(musicGain: MusicSink, getCtx: () => AudioContext): TrackPlayer {
  const BPM = 132
  const BEAT = 60 / BPM
  const intervalMs = BEAT * 4 * 1000
  const CHORDS = [
    [261.63, 329.63, 392],
    [220, 277.18, 329.63],
    [174.61, 220, 261.63],
    [196, 246.94, 293.66],
  ] as const
  let barIndex = 0

  return {
    intervalMs,
    reset: () => { barIndex = 0 },
    play: () => {
      const chord = CHORDS[barIndex % CHORDS.length]
      barIndex += 1
      const now = getCtx().currentTime
      playTone(musicGain, getCtx, chord[0] / 2, now, BEAT * 0.4, 0.16, 'sine', 300)
      playTone(musicGain, getCtx, chord[0] / 2, now + BEAT * 2, BEAT * 0.4, 0.14, 'sine', 300)
      for (const freq of chord) {
        playTone(musicGain, getCtx, freq, now, BEAT * 0.25, 0.05, 'sawtooth', 1600)
        playTone(musicGain, getCtx, freq * 1.5, now + BEAT * 2, BEAT * 0.2, 0.04, 'sawtooth', 1800)
      }
      playTone(musicGain, getCtx, chord[2] * 2, now + BEAT * 3, BEAT * 0.18, 0.06, 'triangle', 2400)
      playHiHat(musicGain, getCtx, now + BEAT, 0.04)
      playHiHat(musicGain, getCtx, now + BEAT * 3, 0.04)
    },
  }
}