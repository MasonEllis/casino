import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  SLOT_VARIANTS,
  SYMBOLS,
  evaluateLines,
  randomSymbol,
  spinGrid,
  type LineWin,
  type SlotSymbol,
} from '../../game/slots'
import { useCasino } from '../../game/store'

const REEL_STOP_BASE_MS = 500
const REEL_STOP_STAGGER_MS = 300

export function MultiSlotsGame() {
  const balance = useCasino((s) => s.balance)
  const addBalance = useCasino((s) => s.addBalance)
  const closeGame = useCasino((s) => s.closeGame)
  const resetChips = useCasino((s) => s.resetChips)
  const activeGame = useCasino((s) => s.activeGame)

  const variant = SLOT_VARIANTS[activeGame?.variant ?? 'nine']
  const totalBetFor = (perLine: number) => perLine * variant.lines.length

  const [betPerLine, setBetPerLine] = useState(variant.betOptions[1])
  const [grid, setGrid] = useState<SlotSymbol[][]>(() => spinGrid(variant.reels, variant.rows))
  const [spinningReels, setSpinningReels] = useState<boolean[]>(() =>
    Array(variant.reels).fill(false),
  )
  const [wins, setWins] = useState<LineWin[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [lastWin, setLastWin] = useState(0)

  const spinningRef = useRef<boolean[]>(Array(variant.reels).fill(false))
  const timers = useRef<number[]>([])

  const isSpinning = spinningReels.some(Boolean)
  const totalBet = totalBetFor(betPerLine)

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const leave = useCallback(() => {
    if (isSpinning) return
    closeGame()
    useCasino.getState().lockPointer()
  }, [isSpinning, closeGame])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') leave()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [leave])

  // cells lit up by winning lines: "reel,row"
  const winningCells = useMemo(() => {
    const cells = new Set<string>()
    for (const w of wins) {
      const line = variant.lines[w.lineIndex]
      for (let r = 0; r < w.count; r++) {
        cells.add(`${r},${line[r]}`)
      }
    }
    return cells
  }, [wins, variant])

  const spin = () => {
    if (isSpinning || totalBet > balance) return
    addBalance(-totalBet)
    setMessage(null)
    setWins([])
    setLastWin(0)
    spinningRef.current = Array(variant.reels).fill(true)
    setSpinningReels(Array(variant.reels).fill(true))

    const result = spinGrid(variant.reels, variant.rows)

    const flicker = window.setInterval(() => {
      setGrid((g) =>
        g.map((reel, r) =>
          spinningRef.current[r] ? reel.map(() => randomSymbol()) : reel,
        ),
      )
    }, 70)
    timers.current.push(flicker)

    for (let r = 0; r < variant.reels; r++) {
      const stop = window.setTimeout(() => {
        spinningRef.current[r] = false
        setGrid((g) => {
          const next = [...g]
          next[r] = result[r]
          return next
        })
        setSpinningReels((sp) => {
          const next = [...sp]
          next[r] = false
          return next
        })
        if (r === variant.reels - 1) {
          window.clearInterval(flicker)
          const { wins: lineWins, total } = evaluateLines(result, variant, betPerLine)
          setWins(lineWins)
          if (total > 0) {
            addBalance(total, true)
            setLastWin(total)
            setMessage(
              lineWins.length === 1
                ? `${lineWins[0].symbol.name} x${lineWins[0].count} on line ${lineWins[0].lineIndex + 1}!`
                : `${lineWins.length} lines hit!`,
            )
          } else {
            setMessage('No luck — spin again!')
          }
        }
      }, REEL_STOP_BASE_MS + r * REEL_STOP_STAGGER_MS)
      timers.current.push(stop)
    }
  }

  return (
    <div className="overlay">
      <div className="game-panel multislots-panel">
        <div className="game-header">
          <h2>
            🎰 {variant.name} <span className="ms-lines-tag">{variant.lines.length} lines</span>
          </h2>
          <button className="btn btn-ghost" onClick={leave} disabled={isSpinning}>
            Walk Away
          </button>
        </div>

        <div className="slots-body">
          <div className="slots-machine">
            <div
              className="ms-grid"
              style={{ gridTemplateColumns: `repeat(${variant.reels}, 1fr)` }}
            >
              {Array.from({ length: variant.rows }, (_, row) =>
                Array.from({ length: variant.reels }, (_, r) => (
                  <div
                    key={`${r},${row}`}
                    className={`ms-cell ${spinningReels[r] ? 'reel-spinning' : ''} ${
                      winningCells.has(`${r},${row}`) ? 'ms-win' : ''
                    }`}
                    style={{ gridColumn: r + 1, gridRow: row + 1 }}
                  >
                    <span className="reel-glyph ms-glyph">{grid[r][row].glyph}</span>
                  </div>
                )),
              )}
            </div>

            <div className={`slots-message ${lastWin > 0 ? 'win' : ''}`}>
              {message ?? `Bet ${betPerLine} per line across ${variant.lines.length} lines`}
              {lastWin > 0 && <span className="bj-delta">+{lastWin}</span>}
            </div>

            <div className="balance-line">
              <span className="hud-chip" /> {balance.toLocaleString()}
            </div>

            <div className="controls">
              <span className="rl-chip-label">Per line:</span>
              <div className="bet-options">
                {variant.betOptions.map((v) => (
                  <button
                    key={v}
                    className={`btn btn-bet ${betPerLine === v ? 'selected' : ''}`}
                    disabled={isSpinning}
                    onClick={() => setBetPerLine(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-spin"
                disabled={isSpinning || totalBet > balance}
                onClick={spin}
              >
                {isSpinning ? 'Spinning…' : `SPIN (${totalBet})`}
              </button>
              {balance < totalBetFor(variant.betOptions[0]) && !isSpinning && (
                <button className="btn btn-gold" onClick={resetChips}>
                  Claim 1,000 free chips
                </button>
              )}
            </div>
          </div>

          <div className="paytable">
            <h3>Paytable (per line)</h3>
            <ul>
              {[...SYMBOLS].reverse().map((s) => (
                <li key={s.id}>
                  <span className="pay-glyphs">{s.glyph}</span>
                  <span className="pay-mult ms-runs">
                    {s.runPays.map((p, i) => (
                      <span key={i}>
                        {i + 3}×&hairsp;{p}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="ms-note">Runs pay left to right, 3+ in a row on a payline.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
