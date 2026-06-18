import type { Card } from './blackjack'

export type BaccaratBet = 'player' | 'banker' | 'tie'
export type BaccaratWinner = 'player' | 'banker' | 'tie'

function cardPoints(card: Card): number {
  if (card.rank === 'A') return 1
  if (card.rank === '10' || card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 0
  return Number(card.rank)
}

export function baccaratValue(hand: Card[]): number {
  return hand.reduce((sum, c) => sum + cardPoints(c), 0) % 10
}

export interface BaccaratRound {
  player: Card[]
  banker: Card[]
  winner: BaccaratWinner
}

/** Deal a full round following the standard third-card tableau. */
export function dealRound(draw: () => Card): BaccaratRound {
  const player = [draw(), draw()]
  const banker = [draw(), draw()]

  const naturals = baccaratValue(player) >= 8 || baccaratValue(banker) >= 8
  if (!naturals) {
    let playerThird: Card | null = null
    if (baccaratValue(player) <= 5) {
      playerThird = draw()
      player.push(playerThird)
    }

    const bankerTotal = baccaratValue(banker)
    if (playerThird === null) {
      if (bankerTotal <= 5) banker.push(draw())
    } else {
      const t = cardPoints(playerThird)
      const bankerDraws =
        bankerTotal <= 2 ||
        (bankerTotal === 3 && t !== 8) ||
        (bankerTotal === 4 && t >= 2 && t <= 7) ||
        (bankerTotal === 5 && t >= 4 && t <= 7) ||
        (bankerTotal === 6 && (t === 6 || t === 7))
      if (bankerDraws) banker.push(draw())
    }
  }

  const pv = baccaratValue(player)
  const bv = baccaratValue(banker)
  const winner: BaccaratWinner = pv > bv ? 'player' : bv > pv ? 'banker' : 'tie'
  return { player, banker, winner }
}

/**
 * Total chips returned for a bet (includes stake).
 * Banker pays 0.95:1 (5% commission), tie pays 8:1.
 * Player/banker bets push when the round ties.
 */
export function baccaratPayout(bet: BaccaratBet, winner: BaccaratWinner, amount: number): number {
  if (winner === 'tie') {
    return bet === 'tie' ? amount * 9 : amount
  }
  if (bet !== winner) return 0
  return bet === 'banker' ? amount + Math.floor(amount * 0.95) : amount * 2
}
