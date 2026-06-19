export type EmoteId = 'wave' | 'thumbsup'

export const EMOTE_KEY_BINDINGS: Record<string, EmoteId> = {
  Digit1: 'wave',
  Digit2: 'thumbsup',
  Numpad1: 'wave',
  Numpad2: 'thumbsup',
}

export const EMOTE_DURATION_MS: Record<EmoteId, number> = {
  wave: 2200,
  thumbsup: 2600,
}

export const EMOTE_LABELS: Record<EmoteId, string> = {
  wave: 'Wave',
  thumbsup: 'Thumbs Up',
}

export function isEmoteId(value: string): value is EmoteId {
  return value === 'wave' || value === 'thumbsup'
}

/** Accept legacy salute id from older clients; treat as thumbs up. */
export function normalizeEmoteId(value: string | null | undefined): EmoteId | null {
  if (!value) return null
  if (value === 'salute' || value === 'thumbsup') return 'thumbsup'
  if (value === 'wave') return 'wave'
  return null
}

export function emoteFromKeyCode(code: string): EmoteId | null {
  return EMOTE_KEY_BINDINGS[code] ?? null
}

/** 0–1 while playing; null when finished or inactive. */
export function emoteProgress(type: EmoteId, startedAt: number, now = Date.now()): number | null {
  if (startedAt <= 0) return null
  const duration = EMOTE_DURATION_MS[type]
  const elapsed = Math.max(0, now - startedAt)
  if (elapsed > duration) return null
  return elapsed / duration
}

export function activeEmoteAt(type: EmoteId | null, startedAt: number, now = Date.now()): EmoteId | null {
  if (!type) return null
  return emoteProgress(type, startedAt, now) === null ? null : type
}