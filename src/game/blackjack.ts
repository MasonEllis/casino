export type Suit = '♠' | '♥' | '♦' | '♣'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  rank: Rank
  suit: Suit
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣']
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function newShoe(numDecks = 4): Card[] {
  const cards: Card[] = []
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ rank, suit })
      }
    }
  }
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

function cardValue(card: Card): number {
  if (card.rank === 'A') return 11
  if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') return 10
  return Number(card.rank)
}

export function handValue(hand: Card[]): { total: number; soft: boolean } {
  let total = 0
  let aces = 0
  for (const card of hand) {
    total += cardValue(card)
    if (card.rank === 'A') aces++
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return { total, soft: aces > 0 }
}

export function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && handValue(hand).total === 21
}

/** True when the player may split an initial two-card hand. */
export function canSplitHand(hand: Card[]): boolean {
  return hand.length === 2 && hand[0].rank === hand[1].rank
}

export function isBust(hand: Card[]): boolean {
  return handValue(hand).total > 21
}

export function dealerShouldHit(hand: Card[]): boolean {
  return handValue(hand).total < 17
}

export type Outcome = 'blackjack' | 'win' | 'push' | 'lose'

/** Settle a non-busted player hand against a finished dealer hand. */
export function settle(player: Card[], dealer: Card[]): Outcome {
  const playerBJ = isBlackjack(player)
  const dealerBJ = isBlackjack(dealer)
  if (playerBJ && dealerBJ) return 'push'
  if (playerBJ) return 'blackjack'
  if (dealerBJ) return 'lose'

  const p = handValue(player).total
  const d = handValue(dealer).total
  if (d > 21) return 'win'
  if (p > d) return 'win'
  if (p < d) return 'lose'
  return 'push'
}

/** Total chips returned to the player for a given outcome (includes the original stake). */
export function payout(outcome: Outcome, bet: number, fromSplit = false): number {
  switch (outcome) {
    case 'blackjack':
      return fromSplit ? bet * 2 : Math.floor(bet * 2.5) // split 21 pays 1:1
    case 'win':
      return bet * 2
    case 'push':
      return bet
    case 'lose':
      return 0
  }
}
