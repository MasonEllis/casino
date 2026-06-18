import type { Card } from '../../game/blackjack'

export function PlayingCard({ card, faceDown = false }: { card?: Card; faceDown?: boolean }) {
  if (faceDown || !card) {
    return <div className="card card-back" />
  }
  const red = card.suit === '♥' || card.suit === '♦'
  return (
    <div className={`card ${red ? 'card-red' : ''}`}>
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{card.suit}</span>
    </div>
  )
}
