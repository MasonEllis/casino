import type { Card, Rank } from './blackjack'

const RANK_ORDER: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

export function warRank(card: Card): number {
  return RANK_ORDER[card.rank]
}

/** 1 = first card wins, -1 = second card wins, 0 = tie */
export function compareCards(a: Card, b: Card): 1 | 0 | -1 {
  const ra = warRank(a)
  const rb = warRank(b)
  if (ra > rb) return 1
  if (ra < rb) return -1
  return 0
}
