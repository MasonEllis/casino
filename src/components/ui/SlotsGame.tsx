import { useCallback, useEffect, useRef, useState } from 'react'
import { playReelStopSound, startReelSpinSound, stopReelSpinSound } from '../../game/audio'
import { SYMBOLS, randomSymbol, spinReels, calcPayout, type SlotSymbol } from '../../game/slots'
import { useCasino } from '../../game/store'

const BET_OPTIONS = [5, 10, 25, 50]
const REEL_STOP_BASE_MS = 700
const REEL_STOP_STAGGER_MS = 500

export function SlotsGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)

  const [bet, setBet] = useState(BET_OPTIONS[1])
  const [display, setDisplay] = useState<SlotSymbol[]>([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]])
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false])
  const [message, setMessage] = useState<string | null>(null)
  const [lastWin, setLastWin] = useState(0)

  const spinningRef = useRef([false, false, false])
  const timers = useRef<number[]>([])

  const isSpinning = spinning.some(Boolean)

  // re-lock the pointer in the same user gesture so the player walks
  // straight back onto the floor without the "click to enter" screen
  const leave = useCallback(() => {
    closeGame()
    useCasino.getState().lockPointer()
  }, [closeGame])

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((t) => window.clearTimeout(t))
      stopReelSpinSound()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && !isSpinning) leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isSpinning, leave])

  const spin = () => {
    if (isSpinning || bet > balance) return
    addBalance(-bet)
    setMessage(null)
    setLastWin(0)
    spinningRef.current = [true, true, true]
    setSpinning([true, true, true])
    startReelSpinSound()

    const result = spinReels()

    // rapid symbol flicker on reels that are still spinning
    const flicker = window.setInterval(() => {
      setDisplay((d) => d.map((s, i) => (spinningRef.current[i] ? randomSymbol() : s)))
    }, 70)
    timers.current.push(flicker)

    result.forEach((symbol, i) => {
      const stop = window.setTimeout(() => {
        spinningRef.current[i] = false
        playReelStopSound()
        setDisplay((d) => {
          const next = [...d]
          next[i] = symbol
          return next
        })
        setSpinning((sp) => {
          const next = [...sp]
          next[i] = false
          return next
        })
        if (i === result.length - 1) {
          stopReelSpinSound()
          window.clearInterval(flicker)
          const { amount, label } = calcPayout(result, bet)
          if (amount > 0) {
            addBalance(amount, true)
            setLastWin(amount)
            setMessage(label)
          } else {
            setMessage('No luck — spin again!')
          }
        }
      }, REEL_STOP_BASE_MS + i * REEL_STOP_STAGGER_MS)
      timers.current.push(stop)
    })
  }

  return (
    <div className="overlay">
      <div className="game-panel slots-panel">
        <div className="game-header">
          <h2>🎰 Lucky Slots</h2>
          <button className="btn btn-ghost" onClick={leave} disabled={isSpinning}>
            Walk Away
          </button>
        </div>

        <div className="slots-body">
          <div className="slots-machine">
            <div className="reels">
              {display.map((s, i) => (
                <div key={i} className={`reel ${spinning[i] ? 'reel-spinning' : ''}`}>
                  <span className="reel-glyph">{s.glyph}</span>
                </div>
              ))}
            </div>

            <div className={`slots-message ${lastWin > 0 ? 'win' : ''}`}>
              {message ?? 'Place your bet and pull the lever'}
              {lastWin > 0 && <span className="bj-delta">+{lastWin}</span>}
            </div>

            <div className="balance-line">
              <span className="hud-chip" /> {balance.toLocaleString()}
            </div>

            <div className="controls">
              <div className="bet-options">
                {BET_OPTIONS.map((v) => (
                  <button
                    key={v}
                    className={`btn btn-bet ${bet === v ? 'selected' : ''}`}
                    disabled={isSpinning}
                    onClick={() => setBet(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button className="btn btn-spin" disabled={isSpinning || bet > balance} onClick={spin}>
                {isSpinning ? 'Spinning…' : `SPIN (${bet})`}
              </button>
              {balance < BET_OPTIONS[0] && !isSpinning && (
                <button className="btn btn-gold" onClick={resetChips}>
                  Claim 1,000 free chips
                </button>
              )}
            </div>
          </div>

          <div className="paytable paytable--classic">
            <h3>Paytable</h3>
            <div className="paytable-grid paytable-grid--classic">
              <span className="paytable-head">Match</span>
              <span className="paytable-head paytable-head-right">Pays</span>
              {[...SYMBOLS].reverse().map((s) => (
                <div className="paytable-row" key={s.id}>
                  <span className="paytable-glyphs" aria-label={s.name}>
                    {s.glyph}{s.glyph}{s.glyph}
                  </span>
                  <span className="paytable-val">{s.triple}×</span>
                </div>
              ))}
              <div className="paytable-row">
                <span className="paytable-glyphs" aria-label="Two cherries">🍒🍒</span>
                <span className="paytable-val">3×</span>
              </div>
              <div className="paytable-row">
                <span className="paytable-glyphs" aria-label="One cherry">🍒</span>
                <span className="paytable-val">1×</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
