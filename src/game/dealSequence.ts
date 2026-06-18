import type { Card } from './blackjack'

export const CARD_REVEAL_MS = 420

export type DealHand = 'player' | 'dealer' | 'banker'

export interface DealStep {
  hand: DealHand
  card: Card
}

/** Schedule cards to appear one at a time. Returns timer ids for cleanup. */
export function scheduleCardReveals(
  steps: DealStep[],
  onStep: (step: DealStep) => void,
  onComplete: () => void,
  delayMs = CARD_REVEAL_MS,
): number[] {
  const timers: number[] = []
  if (steps.length === 0) {
    onComplete()
    return timers
  }
  steps.forEach((step, i) => {
    const t = window.setTimeout(() => {
      onStep(step)
      if (i === steps.length - 1) onComplete()
    }, delayMs * (i + 1))
    timers.push(t)
  })
  return timers
}

export function blackjackInitialSteps(player: Card[], dealer: Card[]): DealStep[] {
  return [
    { hand: 'player', card: player[0] },
    { hand: 'dealer', card: dealer[0] },
    { hand: 'player', card: player[1] },
    { hand: 'dealer', card: dealer[1] },
  ]
}

/** Standard baccarat reveal: player, banker, player, banker, then third cards. */
export function baccaratRevealSteps(player: Card[], banker: Card[]): DealStep[] {
  const steps: DealStep[] = []
  const rounds = Math.max(player.length, banker.length)
  for (let i = 0; i < rounds; i++) {
    if (i < player.length) steps.push({ hand: 'player', card: player[i] })
    if (i < banker.length) steps.push({ hand: 'banker', card: banker[i] })
  }
  return steps
}

export function revealOne(
  hand: DealHand,
  card: Card,
  onReveal: (hand: DealHand, card: Card) => void,
  onComplete: () => void,
  delayMs = CARD_REVEAL_MS,
): number {
  return window.setTimeout(() => {
    onReveal(hand, card)
    onComplete()
  }, delayMs)
}