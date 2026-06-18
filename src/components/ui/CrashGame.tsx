import { useCallback, useEffect, useRef, useState } from 'react'
import {
  calcPayout,
  formatMultiplier,
  generateCrashPoint,
  multiplierAt,
} from '../../game/crash'
import { useCasino } from '../../game/store'

type Phase = 'betting' | 'flying' | 'crashed' | 'cashed_out'

const BET_OPTIONS = [10, 25, 50, 100]

export function CrashGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)

  const [phase, setPhase] = useState<Phase>('betting')
  const [bet, setBet] = useState(BET_OPTIONS[1])
  const [multiplier, setMultiplier] = useState(1)
  const [crashPoint, setCrashPoint] = useState(1)
  const [cashOutAt, setCashOutAt] = useState<number | null>(null)
  const [lastDelta, setLastDelta] = useState(0)

  const startTime = useRef(0)
  const raf = useRef(0)
  const crashPointRef = useRef(1)
  const phaseRef = useRef<Phase>('betting')
  const multiplierRef = useRef(1)
  const betRef = useRef(bet)

  const canLeave = phase === 'betting' || phase === 'crashed' || phase === 'cashed_out'

  const leave = useCallback(() => {
    if (!canLeave) return
    closeGame()
    useCasino.getState().lockPointer()
  }, [canLeave, closeGame])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    multiplierRef.current = multiplier
  }, [multiplier])

  useEffect(() => {
    betRef.current = bet
  }, [bet])

  const cashOut = useCallback(() => {
    if (phaseRef.current !== 'flying') return
    cancelAnimationFrame(raf.current)
    const m = multiplierRef.current
    const b = betRef.current
    const payout = calcPayout(b, m)
    addBalance(payout)
    setCashOutAt(m)
    setLastDelta(payout - b)
    setPhase('cashed_out')
  }, [addBalance])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') leave()
      if (e.code === 'Space' && phaseRef.current === 'flying') {
        e.preventDefault()
        cashOut()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave, cashOut])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const tick = () => {
    const elapsed = performance.now() - startTime.current
    const m = multiplierAt(elapsed)
    setMultiplier(m)

    if (m >= crashPointRef.current) {
      setPhase('crashed')
      setLastDelta(-betRef.current)
      setMultiplier(crashPointRef.current)
      return
    }

    raf.current = requestAnimationFrame(tick)
  }

  const launch = () => {
    if (bet > balance || phase !== 'betting') return
    const point = generateCrashPoint()
    crashPointRef.current = point
    setCrashPoint(point)
    addBalance(-bet)
    setCashOutAt(null)
    setLastDelta(0)
    setMultiplier(1)
    setPhase('flying')
    startTime.current = performance.now()
    raf.current = requestAnimationFrame(tick)
  }

  const newRound = () => {
    cancelAnimationFrame(raf.current)
    setPhase('betting')
    setMultiplier(1)
    setCrashPoint(1)
    setCashOutAt(null)
    setLastDelta(0)
  }

  const rocketHeight = phase === 'flying' || phase === 'cashed_out'
    ? Math.min(10 + Math.log(multiplier) * 24, 48)
    : phase === 'crashed'
      ? Math.min(10 + Math.log(crashPoint) * 24, 48)
      : 10

  const showExplosion = phase === 'crashed'

  return (
    <div className="overlay">
      <div className="game-panel crash-panel">
        <div className="game-header">
          <h2>🚀 Rocket Crash</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={!canLeave}>
            Leave Terminal
          </button>
        </div>

        <div className="crash-arena">
          <div className="crash-sky">
            <div className="crash-sky-bg">
              <div className="crash-stars" />
            </div>

            <div className="crash-pad" />

            <div className={`crash-mult ${phase === 'flying' ? 'live' : ''} ${phase === 'crashed' ? 'boom' : ''} ${phase === 'cashed_out' ? 'win' : ''}`}>
              {phase === 'crashed'
                ? formatMultiplier(crashPoint)
                : phase === 'cashed_out' && cashOutAt
                  ? formatMultiplier(cashOutAt)
                  : formatMultiplier(multiplier)}
            </div>

            <div
              className={`crash-rocket-wrap ${phase === 'flying' ? 'flying' : ''} ${showExplosion ? 'exploded' : ''}`}
              style={{ bottom: `${rocketHeight}%` }}
            >
              {showExplosion ? (
                <div className="crash-explosion">
                  <span className="crash-boom">💥</span>
                </div>
              ) : (
                <div className="crash-rocket">
                  <div className="crash-rocket-nose" />
                  <div className="crash-rocket-body">
                    <div className="crash-rocket-window" />
                  </div>
                  <div className="crash-rocket-fin crash-rocket-fin-l" />
                  <div className="crash-rocket-fin crash-rocket-fin-r" />
                  {(phase === 'flying' || phase === 'cashed_out') && (
                    <div className="crash-flame">
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                </div>
              )}
            </div>

            {phase === 'crashed' && (
              <div className="crash-message lose">
                Rocket exploded! You lost {bet} chips.
              </div>
            )}
            {phase === 'cashed_out' && cashOutAt && (
              <div className="crash-message win">
                Cashed out at {formatMultiplier(cashOutAt)} — +{lastDelta} chips
              </div>
            )}
            {phase === 'betting' && (
              <div className="crash-message hint">
                Place your bet and launch. Cash out before the rocket explodes!
              </div>
            )}
            {phase === 'flying' && (
              <div className="crash-message hint">
                Cash out now or risk it all…
              </div>
            )}
          </div>
        </div>

        <div className="game-footer">
          <div className="balance-line">
            <span className="hud-chip" /> {balance.toLocaleString()}
            {phase !== 'betting' && <span className="bet-line">Bet: {bet}</span>}
          </div>

          {phase === 'betting' && (
            <div className="controls">
              <div className="bet-options">
                {BET_OPTIONS.map((v) => (
                  <button
                    key={v}
                    className={`chip-btn chip-${v} ${bet === v ? 'selected' : ''}`}
                    disabled={v > balance}
                    onClick={() => setBet(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary crash-launch-btn" disabled={bet > balance} onClick={launch}>
                Launch 🚀
              </button>
              {balance < BET_OPTIONS[0] && (
                <button className="btn btn-gold" onClick={resetChips}>
                  Claim 1,000 free chips
                </button>
              )}
            </div>
          )}

          {phase === 'flying' && (
            <div className="controls">
              <button className="btn btn-gold crash-cashout-btn" onClick={cashOut}>
                Cash Out — {formatMultiplier(multiplier)} ({calcPayout(bet, multiplier)} chips)
              </button>
              <span className="crash-space-hint">or press <kbd>Space</kbd></span>
            </div>
          )}

          {(phase === 'crashed' || phase === 'cashed_out') && (
            <div className="controls">
              <button className="btn btn-primary" onClick={newRound}>Launch Again</button>
              <button className="btn btn-ghost" onClick={leave}>Leave Terminal</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}