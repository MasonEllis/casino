import { useEffect, useRef, useState } from 'react'
import { createRouletteWheelCanvasForUI, spinTargetRotation } from '../scene/rouletteLayout'

export interface RouletteSpinSession {
  result: number
  startedAt: number
}

interface RouletteWheelVisualProps {
  session: RouletteSpinSession | null
  durationMs: number
  spinning: boolean
}

function toCssDeg(rad: number): number {
  // Three.js Y rotation is CCW; CSS rotate() is CW-positive.
  return (-rad * 180) / Math.PI
}

export function RouletteWheelVisual({ session, durationMs, spinning }: RouletteWheelVisualProps) {
  const [wheelSrc, setWheelSrc] = useState<string | null>(null)
  const rotorRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = createRouletteWheelCanvasForUI()
    setWheelSrc(canvas.toDataURL())
  }, [])

  useEffect(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    if (!spinning || !session || !rotorRef.current) return

    const rotor = rotorRef.current
    const start = rotationRef.current
    const target = spinTargetRotation(start, session.result, 7)

    const tick = () => {
      const elapsed = performance.now() - session.startedAt
      const t = Math.min(1, elapsed / durationMs)
      const eased = 1 - (1 - t) ** 3
      const rot = start + (target - start) * eased
      rotationRef.current = rot
      rotor.style.transform = `rotate(${toCssDeg(rot)}deg)`
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        animRef.current = null
      }
    }

    animRef.current = requestAnimationFrame(tick)
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
    }
  }, [spinning, session, durationMs])

  return (
    <div className={`rl-wheel-visual ${spinning ? 'rl-wheel-visual--spinning' : ''}`}>
      <div className="rl-wheel-pointer" aria-hidden />
      <div className="rl-wheel-rim">
        <div className="rl-wheel-rotor" ref={rotorRef}>
          {wheelSrc && <img src={wheelSrc} className="rl-wheel-img" alt="" draggable={false} />}
        </div>
        <div className="rl-wheel-ball" aria-hidden />
      </div>
    </div>
  )
}