import { useEffect, useState } from 'react'
import { useCasino } from '../../game/store'

export function HUD() {
  const balance = useCasino((s) => s.balance)
  const nearby = useCasino((s) => s.nearby)
  const activeGame = useCasino((s) => s.activeGame)
  const [locked, setLocked] = useState(false)
  const [showStart, setShowStart] = useState(false)

  useEffect(() => {
    const onChange = () => setLocked(document.pointerLockElement !== null)
    document.addEventListener('pointerlockchange', onChange)
    return () => document.removeEventListener('pointerlockchange', onChange)
  }, [])

  // delay the start screen slightly so it doesn't flash while the pointer
  // re-locks after leaving a game
  useEffect(() => {
    if (locked || activeGame) {
      setShowStart(false)
      return
    }
    const t = setTimeout(() => setShowStart(true), 300)
    return () => clearTimeout(t)
  }, [locked, activeGame])

  return (
    <>
      <div className="hud-balance">
        <span className="hud-chip" />
        <span>{balance.toLocaleString()}</span>
      </div>

      {locked && !activeGame && <div className="hud-crosshair" />}

      {locked && !activeGame && nearby && (
        <div className="hud-prompt">
          Press <kbd>E</kbd> to play {nearby.label}
        </div>
      )}

      {locked && !activeGame && (
        <div className="hud-hint">WASD move · Shift sprint · E interact</div>
      )}

      {showStart && (
        <div className="hud-start">
          <h1>
            <span className="suit">♠</span> GRAND ROYALE <span className="suit red">♦</span>
          </h1>
          <p className="hud-start-sub">CASINO</p>
          <p className="hud-start-click">Click anywhere to step onto the floor</p>
          <div className="hud-start-controls">
            <span><kbd>W A S D</kbd> walk</span>
            <span><kbd>Mouse</kbd> look</span>
            <span><kbd>E</kbd> play a game</span>
            <span><kbd>Esc</kbd> release cursor</span>
          </div>
        </div>
      )}
    </>
  )
}
