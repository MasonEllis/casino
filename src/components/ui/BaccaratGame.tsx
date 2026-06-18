import { useCallback, useEffect, useRef, useState } from 'react'
import { newShoe, type Card } from '../../game/blackjack'
import {
  baccaratPayout,
  baccaratValue,
  dealRound,
  type BaccaratBet,
  type BaccaratRound,
} from '../../game/baccarat'
import { useCasino } from '../../game/store'
import { PlayingCard } from './PlayingCard'

type Phase = 'betting' | 'dealing' | 'done'

const CHIP_VALUES = [10, 25, 50, 100]

const SIDE_LABELS: Record<BaccaratBet, string> = {
  player: 'Player (1:1)',
  banker: 'Banker (0.95:1)',
  tie: 'Tie (8:1)',
}

export function BaccaratGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)

  const shoe = useRef<Card[]>(newShoe(8))
  const [phase, setPhase] = useState<Phase>('betting')
  const [side, setSide] = useState<BaccaratBet>('player')
  const [bet, setBet] = useState(0)
  const [round, setRound] = useState<BaccaratRound | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [lastDelta, setLastDelta] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const canLeave = phase !== 'dealing'

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
    if (shoe.current.length < 20) shoe.current = newShoe(8)
    return shoe.current.pop()!
  }

  const deal = () => {
    if (bet <= 0 || phase !== 'betting') return
    const result = dealRound(draw)
    setRound(result)
    setPhase('dealing')
    setMessage(null)

    const t = window.setTimeout(() => {
      const returned = baccaratPayout(side, result.winner, bet)
      if (returned > 0) addBalance(returned)
      setLastDelta(returned - bet)
      const winnerLabel =
        result.winner === 'tie' ? 'Tie!' : result.winner === 'player' ? 'Player wins' : 'Banker wins'
      const pushed = result.winner === 'tie' && side !== 'tie'
      setMessage(pushed ? `${winnerLabel} — bet pushed` : winnerLabel)
      setPhase('done')
    }, 900)
    timers.current.push(t)
  }

  const newRound = () => {
    setPhase('betting')
    setBet(0)
    setRound(null)
    setMessage(null)
    setLastDelta(0)
  }

  const hand = (label: string, cards: Card[] | undefined) => (
    <div className="bj-hand">
      <div className="bj-hand-label">
        {label}
        {cards && cards.length > 0 && <span className="bj-total">{baccaratValue(cards)}</span>}
      </div>
      <div className="bj-cards">
        {cards?.map((c, i) => <PlayingCard key={i} card={c} />)}
        {(!cards || cards.length === 0) && <div className="card card-slot" />}
      </div>
    </div>
  )

  return (
    <div className="overlay">
      <div className="game-panel baccarat-panel">
        <div className="game-header">
          <h2>♦ Baccarat</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={!canLeave}>
            Leave Table
          </button>
        </div>

        <div className="bj-table baccarat-felt">
          {hand('Banker', round?.banker)}

          {message && (
            <div className={`bj-result ${lastDelta > 0 ? 'win' : lastDelta < 0 ? 'lose' : ''}`}>
              {message}
              {phase === 'done' && lastDelta !== 0 && (
                <span className="bj-delta">{lastDelta > 0 ? `+${lastDelta}` : lastDelta}</span>
              )}
            </div>
          )}

          {hand('Player', round?.player)}
        </div>

        <div className="game-footer">
          <div className="balance-line">
            <span className="hud-chip" /> {balance.toLocaleString()}
            {bet > 0 && (
              <span className="bet-line">
                Bet: {bet} on {side === 'tie' ? 'Tie' : side === 'player' ? 'Player' : 'Banker'}
              </span>
            )}
          </div>

          {phase === 'betting' && (
            <div className="controls">
              <div className="bet-options">
                {(Object.keys(SIDE_LABELS) as BaccaratBet[]).map((s) => (
                  <button
                    key={s}
                    className={`btn btn-bet ${side === s ? 'selected' : ''}`}
                    onClick={() => setSide(s)}
                  >
                    {SIDE_LABELS[s]}
                  </button>
                ))}
              </div>
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
