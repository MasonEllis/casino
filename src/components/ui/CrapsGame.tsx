import { useCallback, useEffect, useRef, useState } from 'react'
import { comeOutOutcome, pointOutcome, rollDice, rollDie, type CrapsBet } from '../../game/craps'
import { useCasino } from '../../game/store'

type Phase = 'betting' | 'comeout' | 'point' | 'done'

const CHIP_VALUES = [10, 25, 50, 100]
const ROLL_ANIM_MS = 900

// pip layout per die value on a 3x3 grid (cells 0..8, row-major)
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div className={`die ${rolling ? 'die-rolling' : ''}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={PIPS[value].includes(i) ? 'pip' : 'pip pip-off'} />
      ))}
    </div>
  )
}

export function CrapsGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)

  const [phase, setPhase] = useState<Phase>('betting')
  const [betType, setBetType] = useState<CrapsBet>('pass')
  const [bet, setBet] = useState(0)
  const [dice, setDice] = useState<[number, number]>([3, 4])
  const [rolling, setRolling] = useState(false)
  const [point, setPoint] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [lastDelta, setLastDelta] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const canLeave = (phase === 'betting' || phase === 'done') && !rolling

  const leave = useCallback(() => {
    if (!canLeave) return
    if (phase === 'betting' && bet > 0) addBalance(bet) // refund unrolled bet
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

  const settle = (outcome: 'win' | 'lose' | 'push') => {
    if (outcome === 'win') {
      addBalance(bet * 2, true)
      setLastDelta(bet)
      setMessage(betType === 'pass' ? 'Winner! Pass line pays' : "Winner! Don't pass pays")
    } else if (outcome === 'push') {
      addBalance(bet)
      setLastDelta(0)
      setMessage('Twelve — barred. Push')
    } else {
      setLastDelta(-bet)
      setMessage(point !== null ? 'Seven out!' : 'Craps! You lose')
    }
    setPhase('done')
  }

  const roll = () => {
    if (rolling) return
    const isComeOut = phase === 'betting' || phase === 'comeout'
    if (isComeOut && phase === 'betting') {
      if (bet <= 0) return
      setPhase('comeout')
    }

    setRolling(true)
    setMessage(null)
    const final = rollDice()

    const flicker = window.setInterval(() => {
      setDice([rollDie(), rollDie()])
    }, 80)
    timers.current.push(flicker)

    const stop = window.setTimeout(() => {
      window.clearInterval(flicker)
      setDice(final)
      setRolling(false)
      const total = final[0] + final[1]

      if (isComeOut) {
        const outcome = comeOutOutcome(total, betType)
        if (outcome === 'point') {
          setPoint(total)
          setPhase('point')
          setMessage(`Point is ${total} — roll it again before a 7`)
        } else {
          settle(outcome as 'win' | 'lose' | 'push')
        }
      } else {
        const outcome = pointOutcome(total, point!, betType)
        if (outcome === 'continue') {
          setMessage(`${total} — no dice. Keep rolling`)
        } else {
          settle(outcome as 'win' | 'lose')
        }
      }
    }, ROLL_ANIM_MS)
    timers.current.push(stop)
  }

  const newRound = () => {
    setPhase('betting')
    setBet(0)
    setPoint(null)
    setMessage(null)
    setLastDelta(0)
  }

  const total = dice[0] + dice[1]

  return (
    <div className="overlay">
      <div className="game-panel craps-panel">
        <div className="game-header">
          <h2>⚂ Street Craps</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={!canLeave}>
            Walk Away
          </button>
        </div>

        <div className="craps-alley">
          <div className="craps-dice">
            <Die value={dice[0]} rolling={rolling} />
            <Die value={dice[1]} rolling={rolling} />
          </div>
          <div className="craps-total">{rolling ? '…' : total}</div>

          {point !== null && phase !== 'done' && (
            <div className="craps-point">
              POINT <span>{point}</span>
            </div>
          )}

          <div className={`craps-message ${lastDelta > 0 ? 'win' : lastDelta < 0 ? 'lose' : ''}`}>
            {message ?? (phase === 'betting' ? 'Pick a side, put your money down' : '')}
            {phase === 'done' && lastDelta !== 0 && (
              <span className="bj-delta">{lastDelta > 0 ? `+${lastDelta}` : lastDelta}</span>
            )}
          </div>
        </div>

        <div className="game-footer">
          <div className="balance-line">
            <span className="hud-chip" /> {balance.toLocaleString()}
            {bet > 0 && <span className="bet-line">Bet: {bet} on {betType === 'pass' ? 'Pass' : "Don't Pass"}</span>}
          </div>

          {phase === 'betting' && (
            <div className="controls">
              <div className="bet-options">
                <button
                  className={`btn btn-bet ${betType === 'pass' ? 'selected' : ''}`}
                  onClick={() => setBetType('pass')}
                >
                  Pass
                </button>
                <button
                  className={`btn btn-bet ${betType === 'dontpass' ? 'selected' : ''}`}
                  onClick={() => setBetType('dontpass')}
                >
                  Don't Pass
                </button>
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
              <button className="btn btn-primary" disabled={bet === 0 || rolling} onClick={roll}>
                Roll
              </button>
              {balance + bet < CHIP_VALUES[0] && (
                <button className="btn btn-gold" onClick={resetChips}>
                  Claim 1,000 free chips
                </button>
              )}
            </div>
          )}

          {(phase === 'comeout' || phase === 'point') && (
            <div className="controls">
              <button className="btn btn-primary" disabled={rolling} onClick={roll}>
                {rolling ? 'Rolling…' : 'Roll'}
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div className="controls">
              <button className="btn btn-primary" onClick={newRound}>New Round</button>
              <button className="btn btn-ghost" onClick={leave}>Walk Away</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
