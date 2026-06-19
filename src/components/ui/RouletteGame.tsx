import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  OUTSIDE_LABELS,
  numberColor,
  settleBets,
  spinWheel,
  type OutsideBet,
} from '../../game/roulette'
import { useCasino } from '../../game/store'
import { RouletteWheelVisual, type RouletteSpinSession } from './RouletteWheelVisual'

const CHIP_VALUES = [5, 10, 25, 100]
const SPIN_DURATION_MS = 2200

const DOZENS: OutsideBet[] = ['dozen1', 'dozen2', 'dozen3']
const EVEN_MONEY: OutsideBet[] = ['low', 'even', 'red', 'black', 'odd', 'high']

export function RouletteGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)
  const activeGame = useCasino((s) => s.activeGame)
  const startRouletteSpin = useCasino((s) => s.startRouletteSpin)

  const [chip, setChip] = useState(10)
  const [bets, setBets] = useState<Record<string, number>>({})
  const [spinning, setSpinning] = useState(false)
  const [spinSession, setSpinSession] = useState<RouletteSpinSession | null>(null)
  const [display, setDisplay] = useState<number | null>(null)
  const [result, setResult] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [lastWin, setLastWin] = useState(0)
  const timers = useRef<number[]>([])

  const totalBet = useMemo(() => Object.values(bets).reduce((a, b) => a + b, 0), [bets])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const refundOpenBets = useCallback(() => {
    const open = Object.values(bets).reduce((a, b) => a + b, 0)
    if (open > 0) addBalance(open)
    setBets({})
  }, [bets, addBalance])

  const leave = useCallback(() => {
    if (spinning) return
    refundOpenBets()
    closeGame()
    useCasino.getState().lockPointer()
  }, [spinning, refundOpenBets, closeGame])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave])

  const placeBet = (key: string) => {
    if (spinning || chip > balance) return
    addBalance(-chip)
    setBets((b) => ({ ...b, [key]: (b[key] ?? 0) + chip }))
    setMessage(null)
    setResult(null)
  }

  const spin = () => {
    if (spinning || totalBet === 0) return
    setSpinning(true)
    setMessage(null)
    setResult(null)
    setLastWin(0)

    const final = spinWheel()
    const startedAt = performance.now()
    setSpinSession({ result: final, startedAt })
    if (activeGame) startRouletteSpin(activeGame.id, final, SPIN_DURATION_MS, startedAt)

    const flicker = window.setInterval(() => {
      setDisplay(Math.floor(Math.random() * 37))
    }, 75)
    timers.current.push(flicker)

    const stop = window.setTimeout(() => {
      window.clearInterval(flicker)
      setDisplay(final)
      setResult(final)
      const returned = settleBets(bets, final)
      if (returned > 0) {
        addBalance(returned, true)
        setLastWin(returned)
        setMessage(`${final} ${numberColor(final)} — you collect ${returned}`)
      } else {
        setMessage(`${final} ${numberColor(final)} — house takes it`)
      }
      setBets({})
      setSpinning(false)
    }, SPIN_DURATION_MS)
    timers.current.push(stop)
  }

  const numberCell = (n: number) => (
    <button
      key={n}
      className={`rl-cell rl-${numberColor(n)} ${result === n ? 'rl-hit' : ''}`}
      style={{ gridColumn: Math.floor((n - 1) / 3) + 2, gridRow: 3 - ((n - 1) % 3) }}
      disabled={spinning}
      onClick={() => placeBet(`s:${n}`)}
    >
      {n}
      {bets[`s:${n}`] && <span className="rl-bet-badge">{bets[`s:${n}`]}</span>}
    </button>
  )

  const outsideCell = (key: OutsideBet, className: string, style: React.CSSProperties) => (
    <button
      key={key}
      className={`rl-cell rl-outside ${className}`}
      style={style}
      disabled={spinning}
      onClick={() => placeBet(key)}
    >
      {OUTSIDE_LABELS[key]}
      {bets[key] && <span className="rl-bet-badge">{bets[key]}</span>}
    </button>
  )

  return (
    <div className="overlay">
      <div className="game-panel roulette-panel">
        <div className="game-header">
          <h2>◉ Roulette</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={spinning}>
            Leave Table
          </button>
        </div>

        <div className="rl-wheel-row">
          <RouletteWheelVisual session={spinSession} durationMs={SPIN_DURATION_MS} spinning={spinning} />
          <div
            className={`rl-wheel-display rl-${display !== null ? numberColor(display) : 'green'} ${spinning ? 'rl-spinning' : ''}`}
          >
            {display ?? '—'}
          </div>
          <div className="rl-status">
            {message ?? (spinning ? 'No more bets…' : 'Place your bets, then spin')}
            {lastWin > 0 && <span className="bj-delta">+{lastWin}</span>}
          </div>
        </div>

        <div className="rl-board-scroll">
        <div className="rl-board">
          <button
            className={`rl-cell rl-green rl-zero ${result === 0 ? 'rl-hit' : ''}`}
            style={{ gridColumn: 1, gridRow: '1 / span 3' }}
            disabled={spinning}
            onClick={() => placeBet('s:0')}
          >
            0
            {bets['s:0'] && <span className="rl-bet-badge">{bets['s:0']}</span>}
          </button>
          {Array.from({ length: 36 }, (_, i) => numberCell(i + 1))}
          {DOZENS.map((key, i) =>
            outsideCell(key, '', { gridColumn: `${2 + i * 4} / span 4`, gridRow: 4 }),
          )}
          {EVEN_MONEY.map((key, i) =>
            outsideCell(key, key === 'red' ? 'rl-red' : key === 'black' ? 'rl-black' : '', {
              gridColumn: `${2 + i * 2} / span 2`,
              gridRow: 5,
            }),
          )}
        </div>
        </div>

        <div className="game-footer">
          <div className="balance-line">
            <span className="hud-chip" /> {balance.toLocaleString()}
            {totalBet > 0 && <span className="bet-line">On the table: {totalBet}</span>}
          </div>
          <div className="controls">
            <span className="rl-chip-label">Chip:</span>
            {CHIP_VALUES.map((v) => (
              <button
                key={v}
                className={`btn btn-bet ${chip === v ? 'selected' : ''}`}
                disabled={spinning}
                onClick={() => setChip(v)}
              >
                {v}
              </button>
            ))}
            <button className="btn btn-ghost" disabled={spinning || totalBet === 0} onClick={refundOpenBets}>
              Clear Bets
            </button>
            <button className="btn btn-spin" disabled={spinning || totalBet === 0} onClick={spin}>
              {spinning ? 'Spinning…' : 'SPIN'}
            </button>
            {balance < CHIP_VALUES[0] && totalBet === 0 && !spinning && (
              <button className="btn btn-gold" onClick={resetChips}>
                Claim 1,000 free chips
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
