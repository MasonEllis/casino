import {
  createTrackPlayer,
  loadMusicTrack,
  MUSIC_TRACKS,
  saveMusicTrack,
  type MusicTrackId,
  type MusicTrackInfo,
  type TrackPlayer,
} from './musicTracks'

const MUSIC_VOL = 0.11
const SFX_VOL = 0.38

const WIN_NOTES = [523.25, 659.25, 783.99, 1046.5]

let ctx: AudioContext | null = null
let musicGain: GainNode | null = null
let sfxGain: GainNode | null = null
let musicTimer: ReturnType<typeof setInterval> | null = null
let reelSpinTimer: ReturnType<typeof setInterval> | null = null
let rocketNoise: AudioBufferSourceNode | null = null
let rocketGain: GainNode | null = null
let rocketFilter: BiquadFilterNode | null = null
let rocketLfo: OscillatorNode | null = null
let rocketSub: OscillatorNode | null = null
let musicStarted = false
let muted = false
let currentTrackId: MusicTrackId = loadMusicTrack()
let trackPlayer: TrackPlayer | null = null

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
  if (next) {
    stopReelSpinSound()
    stopRocketSound()
  }
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

function ensureTrackPlayer() {
  if (!musicGain) return
  trackPlayer = createTrackPlayer(currentTrackId, musicGain, getCtx)
}

function playMusicTick() {
  if (!musicGain || muted || !trackPlayer) return
  trackPlayer.play()
}

export function getMusicTrack(): MusicTrackId {
  return currentTrackId
}

export function getMusicTrackList(): MusicTrackInfo[] {
  return MUSIC_TRACKS
}

export function applyMusicTrack(id: MusicTrackId, options?: { persist?: boolean }) {
  if (id === currentTrackId) return
  const wasPlaying = musicStarted
  stopBackgroundMusic()
  currentTrackId = id
  if (options?.persist) saveMusicTrack(id)
  trackPlayer = null
  if (wasPlaying && !muted) startBackgroundMusic()
}

/** Solo play — saved to this device only. */
export function setMusicTrack(id: MusicTrackId) {
  applyMusicTrack(id, { persist: true })
}

/** After leaving a lobby, restore this player's personal jukebox pick. */
export function restorePersonalMusicTrack() {
  applyMusicTrack(loadMusicTrack(), { persist: false })
}

export function startBackgroundMusic() {
  if (musicStarted) return
  musicStarted = true
  ensureGains()
  ensureTrackPlayer()
  void resumeAudio()
  playMusicTick()
  if (trackPlayer) {
    musicTimer = setInterval(playMusicTick, trackPlayer.intervalMs)
  }
}

export function stopBackgroundMusic() {
  if (musicTimer) clearInterval(musicTimer)
  musicTimer = null
  musicStarted = false
  trackPlayer?.reset()
}

function playFilteredNoise(
  duration: number,
  volume: number,
  freq: number,
  q = 1.2,
  type: BiquadFilterType = 'bandpass',
) {
  if (muted || !sfxGain) return
  const c = getCtx()
  const now = c.currentTime
  const samples = Math.floor(c.sampleRate * duration)
  const buffer = c.createBuffer(1, samples, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples * 0.2))
  }
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq
  filter.Q.value = q
  const gain = c.createGain()
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(sfxGain)
  src.start(now)
  src.stop(now + duration + 0.01)
}

function playReelTick() {
  playFilteredNoise(0.018, 0.14, 1600 + Math.random() * 500, 0.9)
}

export function startReelSpinSound(intervalMs = 70) {
  if (muted) return
  stopReelSpinSound()
  ensureGains()
  void resumeAudio()
  playReelTick()
  reelSpinTimer = setInterval(playReelTick, intervalMs)
}

export function stopReelSpinSound() {
  if (reelSpinTimer) clearInterval(reelSpinTimer)
  reelSpinTimer = null
}

export function playCardDealSound() {
  if (muted) return
  ensureGains()
  void resumeAudio()
  const c = getCtx()
  const now = c.currentTime

  playFilteredNoise(0.055, 0.11, 2200 + Math.random() * 800, 1.2, 'highpass')

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(115 + Math.random() * 35, now + 0.01)
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.05)
  osc.connect(gain)
  gain.connect(sfxGain!)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.22, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  osc.start(now + 0.01)
  osc.stop(now + 0.065)
}

export function playReelStopSound() {
  if (muted) return
  ensureGains()
  void resumeAudio()
  const c = getCtx()
  const now = c.currentTime

  playFilteredNoise(0.04, 0.2, 620, 1.4, 'lowpass')

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, now)
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.06)
  osc.connect(gain)
  gain.connect(sfxGain!)
  gain.gain.setValueAtTime(0.28, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
  osc.start(now)
  osc.stop(now + 0.09)
}

export function startRocketSound() {
  if (muted || rocketNoise) return
  stopRocketSound()
  ensureGains()
  void resumeAudio()
  const c = getCtx()
  const now = c.currentTime

  const bufferSize = c.sampleRate * 2
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

  rocketNoise = c.createBufferSource()
  rocketNoise.buffer = buffer
  rocketNoise.loop = true

  rocketFilter = c.createBiquadFilter()
  rocketFilter.type = 'lowpass'
  rocketFilter.frequency.value = 520
  rocketFilter.Q.value = 0.7

  rocketGain = c.createGain()
  rocketGain.gain.setValueAtTime(0, now)
  rocketGain.gain.linearRampToValueAtTime(0.22, now + 0.2)

  rocketNoise.connect(rocketFilter)
  rocketFilter.connect(rocketGain)
  rocketGain.connect(sfxGain!)

  rocketLfo = c.createOscillator()
  rocketLfo.type = 'sine'
  rocketLfo.frequency.value = 11
  const lfoDepth = c.createGain()
  lfoDepth.gain.value = 180
  rocketLfo.connect(lfoDepth)
  lfoDepth.connect(rocketFilter.frequency)

  rocketSub = c.createOscillator()
  rocketSub.type = 'sawtooth'
  rocketSub.frequency.value = 52
  const subFilter = c.createBiquadFilter()
  subFilter.type = 'lowpass'
  subFilter.frequency.value = 140
  const subGain = c.createGain()
  subGain.gain.value = 0.06
  rocketSub.connect(subFilter)
  subFilter.connect(subGain)
  subGain.connect(sfxGain!)

  rocketNoise.start(now)
  rocketLfo.start(now)
  rocketSub.start(now)
}

export function stopRocketSound() {
  if (!rocketGain) return
  const c = getCtx()
  const now = c.currentTime
  rocketGain.gain.cancelScheduledValues(now)
  rocketGain.gain.setValueAtTime(rocketGain.gain.value, now)
  rocketGain.gain.linearRampToValueAtTime(0, now + 0.15)

  const noise = rocketNoise
  const lfo = rocketLfo
  const sub = rocketSub
  rocketNoise = null
  rocketGain = null
  rocketFilter = null
  rocketLfo = null
  rocketSub = null

  window.setTimeout(() => {
    try { noise?.stop() } catch { /* already stopped */ }
    try { lfo?.stop() } catch { /* already stopped */ }
    try { sub?.stop() } catch { /* already stopped */ }
  }, 180)
}

export function playRocketExplosionSound() {
  if (muted) return
  ensureGains()
  void resumeAudio()
  const c = getCtx()
  const now = c.currentTime

  playFilteredNoise(0.35, 0.42, 220, 0.6, 'lowpass')
  playFilteredNoise(0.2, 0.3, 900, 1.1, 'bandpass')

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(110, now)
  osc.frequency.exponentialRampToValueAtTime(28, now + 0.25)
  osc.connect(gain)
  gain.connect(sfxGain!)
  gain.gain.setValueAtTime(0.35, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
  osc.start(now)
  osc.stop(now + 0.32)
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