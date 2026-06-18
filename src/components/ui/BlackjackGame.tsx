import { useCallback, useEffect, useRef, useState } from 'react'
import {
  newShoe,
  handValue,
  isBlackjack,
  isBust,
  dealerShouldHit,
  settle,
  payout,
  type Card,
  type Outcome,
} from '../../game/blackjack'
import { useCasino } from '../../game/store'
import { PlayingCard } from './PlayingCard'

type Phase = 'betting' | 'playing' | 'dealer' | 'done'

const CHIP_VALUES = [10, 25, 50, 100]

const OUTCOME_MESSAGES: Record<Outcome, string> = {
  blackjack: 'Blackjack! Paid 3:2',
  win: 'You win!',
  push: 'Push — bet returned',
  lose: 'Dealer wins',
}

export function BlackjackGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)

  // re-lock the pointer in the same user gesture so the player walks
  // straight back onto the floor without the "click to enter" screen
  const leave = useCallback(() => {
    closeGame()
    useCasino.getState().lockPointer()
  }, [closeGame])

  const shoe = useRef<Card[]>(newShoe())
  const [phase, setPhase] = useState<Phase>('betting')
  const [bet, setBet] = useState(0)
  const [player, setPlayer] = useState<Card[]>([])
  const [dealer, setDealer] = useState<Card[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [lastDelta, setLastDelta] = useState(0)

  const draw = useCallback((): Card => {
    if (shoe.current.length < 15) shoe.current = newShoe()
    return shoe.current.pop()!
  }, [])

  const finishHand = useCallback(
    (playerHand: Card[], dealerHand: Card[], wager: number) => {
      const outcome: Outcome = isBust(playerHand) ? 'lose' : settle(playerHand, dealerHand)
      const returned = payout(outcome, wager)
      if (returned > 0) addBalance(returned)
      setLastDelta(returned - wager)
      setMessage(isBust(playerHand) ? 'Bust!' : OUTCOME_MESSAGES[outcome])
      setPhase('done')
    },
    [addBalance],
  )

  const deal = () => {
    if (bet <= 0 || bet > balance) return
    addBalance(-bet)
    const p = [draw(), draw()]
    const d = [draw(), draw()]
    setPlayer(p)
    setDealer(d)
    setMessage(null)
    setLastDelta(0)
    if (isBlackjack(p) || isBlackjack(d)) {
      finishHand(p, d, bet)
    } else {
      setPhase('playing')
    }
  }

  const hit = () => {
    const card = draw()
    const next = [...player, card]
    setPlayer(next)
    if (isBust(next)) {
      finishHand(next, dealer, bet)
    }
  }

  const stand = () => setPhase('dealer')

  const canDouble = phase === 'playing' && player.length === 2 && balance >= bet

  const doubleDown = () => {
    if (!canDouble) return
    addBalance(-bet)
    const doubled = bet * 2
    setBet(doubled)
    const card = draw()
    const next = [...player, card]
    setPlayer(next)
    if (isBust(next)) {
      finishHand(next, dealer, doubled)
    } else {
      setPhase('dealer')
    }
  }

  // dealer draws one card at a time for suspense
  useEffect(() => {
    if (phase !== 'dealer') return
    if (dealerShouldHit(dealer)) {
      const t = setTimeout(() => {
        const card = draw()
        setDealer((d) => [...d, card])
      }, 650)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => finishHand(player, dealer, bet), 500)
    return () => clearTimeout(t)
  }, [phase, dealer, player, bet, draw, finishHand])

  const newHand = () => {
    setPhase('betting')
    setPlayer([])
    setDealer([])
    setBet(0)
    setMessage(null)
  }

  const canLeave = phase === 'betting' || phase === 'done'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && canLeave) leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canLeave, leave])

  const dealerRevealed = phase === 'dealer' || phase === 'done'
  const playerVal = player.length ? handValue(player).total : null
  const dealerVal = dealer.length
    ? dealerRevealed
      ? handValue(dealer).total
      : handValue([dealer[0]]).total
    : null

  return (
    <div className="overlay">
      <div className="game-panel blackjack-panel">
        <div className="game-header">
          <h2>♠ Blackjack</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={!canLeave}>
            Leave Table
          </button>
        </div>

        <div className="bj-table">
          <div className="bj-hand">
            <div className="bj-hand-label">
              Dealer {dealerVal !== null && <span className="bj-total">{dealerVal}{!dealerRevealed && ' + ?'}</span>}
            </div>
            <div className="bj-cards">
              {dealer.map((c, i) => (
                <PlayingCard key={i} card={c} faceDown={i === 1 && !dealerRevealed} />
              ))}
              {dealer.length === 0 && <div className="card card-slot" />}
            </div>
          </div>

          {message && (
            <div className={`bj-result ${lastDelta > 0 ? 'win' : lastDelta < 0 ? 'lose' : ''}`}>
              {message}
              {phase === 'done' && lastDelta !== 0 && (
                <span className="bj-delta">{lastDelta > 0 ? `+${lastDelta}` : lastDelta}</span>
              )}
            </div>
          )}

          <div className="bj-hand">
            <div className="bj-hand-label">
              You {playerVal !== null && <span className="bj-total">{playerVal}</span>}
            </div>
            <div className="bj-cards">
              {player.map((c, i) => (
                <PlayingCard key={i} card={c} />
              ))}
              {player.length === 0 && <div className="card card-slot" />}
            </div>
          </div>
        </div>

        <div className="game-footer">
          <div className="balance-line">
            <span className="hud-chip" /> {balance.toLocaleString()}
            {bet > 0 && <span className="bet-line">Bet: {bet}</span>}
          </div>

          {phase === 'betting' && (
            <div className="controls">
              {CHIP_VALUES.map((v) => (
                <button
                  key={v}
                  className={`chip-btn chip-${v}`}
                  disabled={bet + v > balance}
                  onClick={() => setBet((b) => b + v)}
                >
                  {v}
                </button>
              ))}
              <button className="btn btn-ghost" disabled={bet === 0} onClick={() => setBet(0)}>
                Clear
              </button>
              <button className="btn btn-primary" disabled={bet === 0} onClick={deal}>
                Deal
              </button>
              {balance < CHIP_VALUES[0] && bet === 0 && (
                <button className="btn btn-gold" onClick={resetChips}>
                  Claim 1,000 free chips
                </button>
              )}
            </div>
          )}

          {phase === 'playing' && (
            <div className="controls">
              <button className="btn btn-primary" onClick={hit}>Hit</button>
              <button className="btn btn-primary" onClick={stand}>Stand</button>
              <button className="btn btn-gold" disabled={!canDouble} onClick={doubleDown}>
                Double
              </button>
            </div>
          )}

          {phase === 'dealer' && <div className="controls dealer-thinking">Dealer is drawing…</div>}

          {phase === 'done' && (
            <div className="controls">
              <button className="btn btn-primary" onClick={newHand}>New Hand</button>
              <button className="btn btn-ghost" onClick={leave}>Leave Table</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
