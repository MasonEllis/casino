export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

export type OutsideBet =
  | 'red'
  | 'black'
  | 'odd'
  | 'even'
  | 'low'
  | 'high'
  | 'dozen1'
  | 'dozen2'
  | 'dozen3'

/** bet keys: "s:<n>" for straight-up numbers, or an OutsideBet name */
export type BetKey = string

export const OUTSIDE_LABELS: Record<OutsideBet, string> = {
  red: 'Red',
  black: 'Black',
  odd: 'Odd',
  even: 'Even',
  low: '1-18',
  high: '19-36',
  dozen1: '1st 12',
  dozen2: '2nd 12',
  dozen3: '3rd 12',
}

/** European single-zero wheel */
export function spinWheel(): number {
  return Math.floor(Math.random() * 37)
}

export function numberColor(n: number): 'green' | 'red' | 'black' {
  if (n === 0) return 'green'
  return RED_NUMBERS.has(n) ? 'red' : 'black'
}

export function keyWins(key: BetKey, n: number): boolean {
  if (key.startsWith('s:')) return Number(key.slice(2)) === n
  switch (key as OutsideBet) {
    case 'red':
      return RED_NUMBERS.has(n)
    case 'black':
      return n !== 0 && !RED_NUMBERS.has(n)
    case 'odd':
      return n !== 0 && n % 2 === 1
    case 'even':
      return n !== 0 && n % 2 === 0
    case 'low':
      return n >= 1 && n <= 18
    case 'high':
      return n >= 19
    case 'dozen1':
      return n >= 1 && n <= 12
    case 'dozen2':
      return n >= 13 && n <= 24
    case 'dozen3':
      return n >= 25
    default:
      return false
  }
}

/** winnings multiplier (excluding returned stake) */
export function keyMultiplier(key: BetKey): number {
  if (key.startsWith('s:')) return 35
  if (key.startsWith('dozen')) return 2
  return 1
}

/** total chips returned for a set of bets on a winning number */
export function settleBets(bets: Record<BetKey, number>, n: number): number {
  let total = 0
  for (const [key, amount] of Object.entries(bets)) {
    if (keyWins(key, n)) {
      total += amount * (keyMultiplier(key) + 1)
    }
  }
  return total
}
