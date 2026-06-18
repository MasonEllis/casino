import { useCallback, useEffect, useRef, useState } from 'react'
import { newShoe, type Card } from '../../game/blackjack'
import { scheduleCardReveals } from '../../game/dealSequence'
import { compareCards } from '../../game/war'
import { useCasino } from '../../game/store'
import { PlayingCard } from './PlayingCard'

type Phase = 'betting' | 'dealing' | 'war-choice' | 'done'

const CHIP_VALUES = [10, 25, 50, 100]

export function WarGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)

  const shoe = useRef<Card[]>(newShoe(6))
  const timers = useRef<number[]>([])
  const [phase, setPhase] = useState<Phase>('betting')
  const [bet, setBet] = useState(0)
  const [playerCards, setPlayerCards] = useState<Card[]>([])
  const [dealerCards, setDealerCards] = useState<Card[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [lastDelta, setLastDelta] = useState(0)

  const canLeave = phase === 'betting' || phase === 'done'

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const leave = useCallback(() => {
    if (!canLeave) return
    if (phase === 'betting' && bet > 0) addBalance(bet)
    closeGame()
    useCasino.getState().lockPointer()
  }, [canLeave, phase, bet, addBalance, closeGame])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave])

  const draw = (): Card => {
    if (shoe.current.length < 10) shoe.current = newShoe(6)
    return shoe.current.pop()!
  }

  const resolveInitial = (p: Card, d: Card) => {
    const cmp = compareCards(p, d)
    if (cmp === 1) {
      addBalance(bet * 2)
      setLastDelta(bet)
      setMessage('You win!')
      setPhase('done')
    } else if (cmp === -1) {
      setLastDelta(-bet)
      setMessage('Dealer wins')
      setPhase('done')
    } else {
      setMessage('Tie! Surrender for half, or go to war')
      setPhase('war-choice')
    }
  }

  const deal = () => {
    if (bet <= 0 || phase !== 'betting') return
    const p = draw()
    const d = draw()
    setPlayerCards([])
    setDealerCards([])
    setMessage(null)
    setLastDelta(0)
    setPhase('dealing')

    timers.current.push(
      ...scheduleCardReveals(
        [
          { hand: 'player', card: p },
          { hand: 'dealer', card: d },
        ],
        (step) => {
          if (step.hand === 'player') setPlayerCards((h) => [...h, step.card])
          else setDealerCards((h) => [...h, step.card])
        },
        () => resolveInitial(p, d),
      ),
    )
  }

  const surrender = () => {
    const refund = Math.floor(bet / 2)
    addBalance(refund)
    setLastDelta(refund - bet)
    setMessage('Surrendered — half your bet back')
    setPhase('done')
  }

  const canWar = balance >= bet

  const resolveWar = (p: Card, d: Card) => {
    const cmp = compareCards(p, d)
    if (cmp === 1) {
      addBalance(bet * 3)
      setLastDelta(bet)
      setMessage('War won!')
    } else if (cmp === 0) {
      addBalance(bet * 4)
      setLastDelta(bet * 2)
      setMessage('Double tie! Bonus payout!')
    } else {
      setLastDelta(-bet * 2)
      setMessage('War lost')
    }
    setPhase('done')
  }

  const goToWar = () => {
    if (!canWar || phase !== 'war-choice') return
    addBalance(-bet)
    const p = draw()
    const d = draw()
    setPhase('dealing')
    setMessage(null)

    timers.current.push(
      ...scheduleCardReveals(
        [
          { hand: 'player', card: p },
          { hand: 'dealer', card: d },
        ],
        (step) => {
          if (step.hand === 'player') setPlayerCards((h) => [...h, step.card])
          else setDealerCards((h) => [...h, step.card])
        },
        () => resolveWar(p, d),
      ),
    )
  }

  const newRound = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setPhase('betting')
    setBet(0)
    setPlayerCards([])
    setDealerCards([])
    setMessage(null)
    setLastDelta(0)
  }

  const hand = (label: string, cards: Card[]) => (
    <div className="bj-hand">
      <div className="bj-hand-label">{label}</div>
      <div className="bj-cards">
        {cards.map((c, i) => <PlayingCard key={i} card={c} />)}
        {cards.length === 0 && <div className="card card-slot" />}
      </div>
    </div>
  )

  return (
    <div className="overlay">
      <div className="game-panel war-panel">
        <div className="game-header">
          <h2>⚔ Casino War</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={!canLeave}>
            Leave Table
          </button>
        </div>

        <div className="bj-table war-felt">
          {hand('Dealer', dealerCards)}

          {message && (
            <div className={`bj-result ${lastDelta > 0 ? 'win' : lastDelta < 0 ? 'lose' : ''}`}>
              {message}
              {phase === 'done' && lastDelta !== 0 && (
                <span className="bj-delta">{lastDelta > 0 ? `+${lastDelta}` : lastDelta}</span>
              )}
            </div>
          )}

          {hand('You', playerCards)}
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
                  disabled={v > balance}
                  onClick={() => {
                    addBalance(-v)
                    setBet((b) => b + v)
                  }}
                >
                  {v}
                </button>
              ))}
              <button
                className="btn btn-ghost"
                disabled={bet === 0}
                onClick={() => {
                  addBalance(bet)
                  setBet(0)
                }}
              >
                Clear
              </button>
              <button className="btn btn-primary" disabled={bet === 0} onClick={deal}>
                Deal
              </button>
              {balance + bet < CHIP_VALUES[0] && (
                <button className="btn btn-gold" onClick={resetChips}>
                  Claim 1,000 free chips
                </button>
              )}
            </div>
          )}

          {phase === 'dealing' && <div className="controls dealer-thinking">Dealing…</div>}

          {phase === 'war-choice' && (
            <div className="controls">
              <button className="btn btn-gold" disabled={!canWar} onClick={goToWar}>
                Go to War (+{bet})
              </button>
              <button className="btn btn-ghost" onClick={surrender}>
                Surrender (keep {Math.floor(bet / 2)})
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div className="controls">
              <button className="btn btn-primary" onClick={newRound}>New Round</button>
              <button className="btn btn-ghost" onClick={leave}>Leave Table</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}