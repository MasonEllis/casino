import { useEffect, useState } from 'react'
import { useCasino } from '../../game/store'
import { useIsMobile } from '../../hooks/useIsMobile'

export function HUD() {
  const balance = useCasino((s) => s.balance)
  const nearby = useCasino((s) => s.nearby)
  const activeGame = useCasino((s) => s.activeGame)
  const floorEntered = useCasino((s) => s.floorEntered)
  const enterFloor = useCasino((s) => s.enterFloor)
  const isMobile = useIsMobile()
  const [locked, setLocked] = useState(false)
  const [showStart, setShowStart] = useState(false)

  const inWorld = isMobile ? floorEntered : locked

  useEffect(() => {
    const onChange = () => setLocked(document.pointerLockElement !== null)
    document.addEventListener('pointerlockchange', onChange)
    return () => document.removeEventListener('pointerlockchange', onChange)
  }, [])

  useEffect(() => {
    if (inWorld || activeGame) {
      setShowStart(false)
      return
    }
    const t = setTimeout(() => setShowStart(true), 300)
    return () => clearTimeout(t)
  }, [inWorld, activeGame])

  return (
    <>
      <div className="hud-balance">
        <span className="hud-chip" />
        <span>{balance.toLocaleString()}</span>
      </div>

      {inWorld && !activeGame && <div className="hud-crosshair" />}

      {inWorld && !activeGame && nearby && !isMobile && (
        <div className="hud-prompt">
          Press <kbd>E</kbd> to play {nearby.label}
        </div>
      )}

      {inWorld && !activeGame && !isMobile && (
        <div className="hud-hint">WASD move · Shift sprint · E interact</div>
      )}

      {inWorld && !activeGame && isMobile && (
        <div className="hud-hint hud-hint--mobile">Drag right to look · Joystick to walk</div>
      )}

      {showStart && !isMobile && (
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

      {showStart && isMobile && (
        <div className="hud-start hud-start--interactive">
          <h1>
            <span className="suit">♠</span> GRAND ROYALE <span className="suit red">♦</span>
          </h1>
          <p className="hud-start-sub">CASINO</p>
          <button type="button" className="btn btn-gold hud-enter-btn" onClick={enterFloor}>
            Enter Casino
          </button>
          <div className="hud-start-controls">
            <span>Joystick walk</span>
            <span>Drag to look</span>
            <span>Tap Play at tables</span>
          </div>
        </div>
      )}
    </>
  )
}