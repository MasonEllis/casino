/** House edge ~4% — instant crash at 1.00x roughly 4% of rounds. */
const HOUSE_EDGE = 0.04
const MAX_MULTIPLIER = 50

/** Random crash point using an exponential distribution (typical crash-game curve). */
export function generateCrashPoint(): number {
  const r = Math.random()
  if (r < HOUSE_EDGE) return 1.0
  const point = (1 - HOUSE_EDGE) / (1 - r)
  return Math.min(Math.floor(point * 100) / 100, MAX_MULTIPLIER)
}

/** Multiplier as a function of elapsed milliseconds since launch. */
export function multiplierAt(elapsedMs: number): number {
  const raw = Math.exp(0.00015 * elapsedMs)
  return Math.floor(raw * 100) / 100
}

/** Milliseconds until the multiplier reaches the crash point. */
export function timeToReach(target: number): number {
  if (target <= 1) return 0
  return Math.log(target) / 0.00015
}

export function formatMultiplier(m: number): string {
  return `${m.toFixed(2)}×`
}

export function calcPayout(bet: number, multiplier: number): number {
  return Math.floor(bet * multiplier)
}