import { useEffect, useMemo, useRef } from 'react'
import { pocketFillColor, spinTargetSvgRotationDeg, WHEEL_POCKET_ORDER } from '../scene/rouletteLayout'

export interface RouletteSpinSession {
  result: number
  startedAt: number
}

interface RouletteWheelVisualProps {
  session: RouletteSpinSession | null
  durationMs: number
  spinning: boolean
}

const SIZE = 440
const CX = SIZE / 2
const CY = SIZE / 2
const RIM_R = 208
const POCKET_R = 196
const LABEL_R = 168
const HUB_R = 34

function pocketPath(i: number, total: number, radius: number): string {
  const a0 = (i / total) * Math.PI * 2 - Math.PI / 2
  const a1 = ((i + 1) / total) * Math.PI * 2 - Math.PI / 2
  const x0 = CX + Math.cos(a0) * radius
  const y0 = CY + Math.sin(a0) * radius
  const x1 = CX + Math.cos(a1) * radius
  const y1 = CY + Math.sin(a1) * radius
  return `M ${CX} ${CY} L ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1} Z`
}

export function RouletteWheelVisual({ session, durationMs, spinning }: RouletteWheelVisualProps) {
  const rotorRef = useRef<SVGGElement>(null)
  const rotationRef = useRef(0)
  const animRef = useRef<number | null>(null)

  const pockets = useMemo(() => {
    const total = WHEEL_POCKET_ORDER.length
    return WHEEL_POCKET_ORDER.map((val, i) => {
      const a0 = (i / total) * Math.PI * 2 - Math.PI / 2
      const a1 = ((i + 1) / total) * Math.PI * 2 - Math.PI / 2
      const mid = (a0 + a1) / 2
      const label = String(val)
      return {
        val,
        label,
        path: pocketPath(i, total, POCKET_R),
        fill: pocketFillColor(val),
        x: CX + Math.cos(mid) * LABEL_R,
        y: CY + Math.sin(mid) * LABEL_R,
        rotate: (mid * 180) / Math.PI + 90,
        fontSize: label.length > 1 ? 15 : 17,
      }
    })
  }, [])

  useEffect(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    if (!spinning || !session || !rotorRef.current) return

    const rotor = rotorRef.current
    const start = rotationRef.current
    const target = spinTargetSvgRotationDeg(start, session.result, 7)

    const tick = () => {
      const elapsed = performance.now() - session.startedAt
      const t = Math.min(1, elapsed / durationMs)
      const eased = 1 - (1 - t) ** 3
      const deg = start + (target - start) * eased
      rotationRef.current = deg
      rotor.setAttribute('transform', `rotate(${deg} ${CX} ${CY})`)
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
        <svg
          className="rl-wheel-svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Roulette wheel"
        >
          <circle cx={CX} cy={CY} r={RIM_R} className="rl-wheel-outer-track" />
          <g ref={rotorRef}>
            {pockets.map((p) => (
              <g key={p.val}>
                <path d={p.path} fill={p.fill} stroke="#c9a13f" strokeWidth={1.5} />
                <text
                  x={p.x}
                  y={p.y}
                  fill="#f5f0e6"
                  fontSize={p.fontSize}
                  fontWeight={700}
                  fontFamily="Georgia, serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  stroke="#0a0a0f"
                  strokeWidth={3}
                  paintOrder="stroke"
                  transform={`rotate(${p.rotate} ${p.x} ${p.y})`}
                >
                  {p.label}
                </text>
              </g>
            ))}
            <circle cx={CX} cy={CY} r={HUB_R} fill="#c9a13f" stroke="#8a6d24" strokeWidth={2} />
          </g>
        </svg>
        <div className="rl-wheel-ball" aria-hidden />
      </div>
    </div>
  )
}