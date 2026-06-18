export interface SlotSymbol {
  id: string
  glyph: string
  name: string
  weight: number
  /** payout multiplier for three of a kind (classic single-line machine) */
  triple: number
  /** per-line bet multipliers for runs of 3, 4, 5 (multi-line machines) */
  runPays: [number, number, number]
}

export const SYMBOLS: SlotSymbol[] = [
  { id: 'cherry', glyph: '🍒', name: 'Cherry', weight: 5, triple: 8, runPays: [3, 10, 25] },
  { id: 'lemon', glyph: '🍋', name: 'Lemon', weight: 4, triple: 10, runPays: [5, 15, 50] },
  { id: 'star', glyph: '⭐', name: 'Star', weight: 3, triple: 15, runPays: [10, 30, 100] },
  { id: 'bell', glyph: '🔔', name: 'Bell', weight: 3, triple: 20, runPays: [15, 50, 150] },
  { id: 'diamond', glyph: '💎', name: 'Diamond', weight: 2, triple: 40, runPays: [25, 100, 400] },
  { id: 'seven', glyph: '7️⃣', name: 'Seven', weight: 1, triple: 100, runPays: [40, 200, 1000] },
]

const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0)

export function randomSymbol(): SlotSymbol {
  let roll = Math.random() * TOTAL_WEIGHT
  for (const s of SYMBOLS) {
    roll -= s.weight
    if (roll < 0) return s
  }
  return SYMBOLS[0]
}

export function spinReels(): [SlotSymbol, SlotSymbol, SlotSymbol] {
  return [randomSymbol(), randomSymbol(), randomSymbol()]
}

export interface SpinResult {
  /** total chips returned (0 when the spin loses) */
  amount: number
  label: string | null
}

export function calcPayout(reels: [SlotSymbol, SlotSymbol, SlotSymbol], bet: number): SpinResult {
  const [a, b, c] = reels
  if (a.id === b.id && b.id === c.id) {
    return { amount: bet * a.triple, label: `Triple ${a.name}! ${a.triple}x` }
  }
  const cherries = reels.filter((s) => s.id === 'cherry').length
  if (cherries === 2) {
    return { amount: bet * 3, label: 'Two Cherries! 3x' }
  }
  if (cherries === 1) {
    return { amount: bet, label: 'One Cherry — bet returned' }
  }
  return { amount: 0, label: null }
}

/* ---------- multi-line machines (5 reels x 3 rows) ---------- */

export type SlotVariantId = 'classic' | 'nine' | 'twenty'

export interface SlotVariant {
  id: SlotVariantId
  name: string
  reels: number
  rows: number
  /** payline patterns: row index per reel */
  lines: number[][]
  /** bet-per-line options */
  betOptions: number[]
}

// standard payline patterns for a 5x3 grid; first 9 are the 9-line set
const LINES_5X3: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [0, 2, 2, 2, 0],
]

export const SLOT_VARIANTS: Record<SlotVariantId, SlotVariant> = {
  classic: {
    id: 'classic',
    name: 'Lucky Slots',
    reels: 3,
    rows: 1,
    lines: [[0, 0, 0]],
    betOptions: [5, 10, 25, 50],
  },
  nine: {
    id: 'nine',
    name: 'Fruit Frenzy',
    reels: 5,
    rows: 3,
    lines: LINES_5X3.slice(0, 9),
    betOptions: [1, 2, 5, 10],
  },
  twenty: {
    id: 'twenty',
    name: 'Royal Riches',
    reels: 5,
    rows: 3,
    lines: LINES_5X3,
    betOptions: [1, 2, 5, 10],
  },
}

/** grid[reel][row] */
export function spinGrid(reels: number, rows: number): SlotSymbol[][] {
  return Array.from({ length: reels }, () => Array.from({ length: rows }, () => randomSymbol()))
}

export interface LineWin {
  lineIndex: number
  symbol: SlotSymbol
  count: number
  amount: number
}

/** left-to-right runs of 3+ matching symbols on each payline */
export function evaluateLines(
  grid: SlotSymbol[][],
  variant: SlotVariant,
  betPerLine: number,
): { wins: LineWin[]; total: number } {
  const wins: LineWin[] = []
  variant.lines.forEach((line, lineIndex) => {
    const first = grid[0][line[0]]
    let count = 1
    for (let r = 1; r < variant.reels; r++) {
      if (grid[r][line[r]].id === first.id) count++
      else break
    }
    if (count >= 3) {
      const amount = betPerLine * first.runPays[count - 3]
      wins.push({ lineIndex, symbol: first, count, amount })
    }
  })
  return { wins, total: wins.reduce((sum, w) => sum + w.amount, 0) }
}
