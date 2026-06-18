export type CrapsBet = 'pass' | 'dontpass'

export type RollOutcome = 'win' | 'lose' | 'push' | 'point' | 'continue'

export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

export function rollDice(): [number, number] {
  return [rollDie(), rollDie()]
}

/**
 * Come-out roll, street rules:
 * - Pass: 7/11 wins, 2/3/12 craps out, anything else sets the point
 * - Don't pass: 2/3 wins, 7/11 loses, 12 is barred (push), else sets the point
 */
export function comeOutOutcome(total: number, bet: CrapsBet): RollOutcome {
  if (total === 7 || total === 11) return bet === 'pass' ? 'win' : 'lose'
  if (total === 2 || total === 3) return bet === 'pass' ? 'lose' : 'win'
  if (total === 12) return bet === 'pass' ? 'lose' : 'push'
  return 'point'
}

/**
 * Rolling for the point:
 * - hit the point: pass wins, don't pass loses
 * - seven out: pass loses, don't pass wins
 * - anything else: keep rolling
 */
export function pointOutcome(total: number, point: number, bet: CrapsBet): RollOutcome {
  if (total === point) return bet === 'pass' ? 'win' : 'lose'
  if (total === 7) return bet === 'pass' ? 'lose' : 'win'
  return 'continue'
}
