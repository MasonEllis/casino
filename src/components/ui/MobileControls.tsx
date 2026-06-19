import { useEffect, useRef, useState } from 'react'
import { mobileInput } from '../../game/input'
import { interactVerb, useCasino } from '../../game/store'
import { useIsMobile } from '../../hooks/useIsMobile'

const JOY_RADIUS = 54

export function MobileControls() {
  const isMobile = useIsMobile()
  const floorEntered = useCasino((s) => s.floorEntered)
  const activeGame = useCasino((s) => s.activeGame)
  const nearby = useCasino((s) => s.nearby)
  const openGame = useCasino((s) => s.openGame)

  const joyRef = useRef<HTMLDivElement>(null)
  const joyTouchId = useRef<number | null>(null)
  const lookTouchId = useRef<number | null>(null)
  const lookLast = useRef({ x: 0, y: 0 })
  const [stick, setStick] = useState({ x: 0, y: 0 })
  const [sprinting, setSprinting] = useState(false)

  useEffect(() => {
    mobileInput.sprint = sprinting
  }, [sprinting])

  useEffect(() => {
    if (!isMobile || !floorEntered || activeGame) {
      joyTouchId.current = null
      lookTouchId.current = null
      mobileInput.moveX = 0
      mobileInput.moveY = 0
      mobileInput.lookX = 0
      mobileInput.lookY = 0
      setStick({ x: 0, y: 0 })
      return
    }

    const joyZone = (x: number, y: number) => {
      const el = joyRef.current
      if (!el) return x < window.innerWidth * 0.45 && y > window.innerHeight * 0.48
      const r = el.getBoundingClientRect()
      const pad = 24
      return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad
    }

    const updateJoystick = (x: number, y: number) => {
      const el = joyRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      let dx = x - cx
      let dy = y - cy
      const dist = Math.hypot(dx, dy)
      if (dist > JOY_RADIUS) {
        dx = (dx / dist) * JOY_RADIUS
        dy = (dy / dist) * JOY_RADIUS
      }
      setStick({ x: dx, y: dy })
      mobileInput.moveX = dx / JOY_RADIUS
      mobileInput.moveY = -(dy / JOY_RADIUS)
    }

    const resetJoystick = () => {
      joyTouchId.current = null
      setStick({ x: 0, y: 0 })
      mobileInput.moveX = 0
      mobileInput.moveY = 0
    }

    const onTouchStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (joyTouchId.current === null && joyZone(t.clientX, t.clientY)) {
          joyTouchId.current = t.identifier
          updateJoystick(t.clientX, t.clientY)
          continue
        }
        if (
          lookTouchId.current === null &&
          t.clientX > window.innerWidth * 0.35 &&
          t.identifier !== joyTouchId.current
        ) {
          lookTouchId.current = t.identifier
          lookLast.current = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyTouchId.current) {
          e.preventDefault()
          updateJoystick(t.clientX, t.clientY)
        }
        if (t.identifier === lookTouchId.current) {
          e.preventDefault()
          mobileInput.lookX += t.clientX - lookLast.current.x
          mobileInput.lookY += t.clientY - lookLast.current.y
          lookLast.current = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyTouchId.current) resetJoystick()
        if (t.identifier === lookTouchId.current) lookTouchId.current = null
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      resetJoystick()
      lookTouchId.current = null
    }
  }, [isMobile, floorEntered, activeGame])

  if (!isMobile || !floorEntered || activeGame) return null

  return (
    <div className="mobile-controls" aria-hidden>
      <div className="mobile-joystick" ref={joyRef}>
        <div className="mobile-joystick-base" />
        <div
          className="mobile-joystick-stick"
          style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }}
        />
      </div>

      <button
        type="button"
        className={`mobile-sprint-btn ${sprinting ? 'active' : ''}`}
        onTouchStart={(e) => {
          e.preventDefault()
          setSprinting(true)
        }}
        onTouchEnd={() => setSprinting(false)}
        onTouchCancel={() => setSprinting(false)}
        onMouseDown={() => setSprinting(true)}
        onMouseUp={() => setSprinting(false)}
        onMouseLeave={() => setSprinting(false)}
      >
        Sprint
      </button>

      {nearby && (
        <button
          type="button"
          className="mobile-interact-btn"
          onClick={() => openGame(nearby)}
        >
          {interactVerb(nearby.type) === 'use' ? 'Use' : 'Play'} {nearby.label}
        </button>
      )}
    </div>
  )
}