import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import type { Interactable } from '../../game/store'
import { useCasino } from '../../game/store'
import { createRouletteLayoutTexture, createRouletteWheelTexture, spinTargetRotation } from './rouletteLayout'

const WHEEL_X = -1.05
const WHEEL_Y = 1.018
const TRACK_RADIUS = 0.62
const IDLE_SPEED = 0.12

export function RouletteTable({ interactable }: { interactable: Interactable }) {
  const [x, , z] = interactable.position
  const wheel = useRef<THREE.Group>(null)
  const layoutMap = useMemo(() => createRouletteLayoutTexture(), [])
  const wheelMap = useMemo(() => createRouletteWheelTexture(), [])

  const activeGame = useCasino((s) => s.activeGame)
  const rouletteSpin = useCasino((s) => s.rouletteSpin)
  const isActiveTable = activeGame?.id === interactable.id

  const spinAnim = useRef<{
    start: number
    target: number
    startedAt: number
    durationMs: number
  } | null>(null)

  useEffect(() => {
    if (!isActiveTable) {
      spinAnim.current = null
      return
    }
    if (!rouletteSpin || rouletteSpin.tableId !== interactable.id) return
    const start = wheel.current?.rotation.y ?? 0
    spinAnim.current = {
      start,
      target: spinTargetRotation(start, rouletteSpin.result),
      startedAt: rouletteSpin.startedAt,
      durationMs: rouletteSpin.durationMs,
    }
  }, [isActiveTable, rouletteSpin, interactable.id])

  useFrame((_, delta) => {
    if (!wheel.current) return

    const anim = spinAnim.current
    if (isActiveTable && anim) {
      const elapsed = performance.now() - anim.startedAt
      const t = Math.min(1, elapsed / anim.durationMs)
      const eased = 1 - (1 - t) ** 3
      wheel.current.rotation.y = anim.start + (anim.target - anim.start) * eased
      return
    }

    wheel.current.rotation.y += delta * IDLE_SPEED
  })

  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* main felt slab */}
      <mesh position={[0.35, 0.95, 0]}>
        <boxGeometry args={[3.35, 0.09, 1.65]} />
        <meshStandardMaterial color="#0a5c34" roughness={0.88} />
      </mesh>

      {/* wood apron */}
      <mesh position={[0.35, 0.88, 0]}>
        <boxGeometry args={[3.5, 0.1, 1.82]} />
        <meshStandardMaterial color="#4a2f14" roughness={0.55} />
      </mesh>

      {/* legs */}
      {[
        [-1.2, -0.72],
        [1.9, -0.72],
        [-1.2, 0.72],
        [1.9, 0.72],
      ].map(([lx, lz]) => (
        <mesh key={`${lx}-${lz}`} position={[lx, 0.44, lz]}>
          <boxGeometry args={[0.14, 0.88, 0.14]} />
          <meshStandardMaterial color="#2b1a0d" roughness={0.6} />
        </mesh>
      ))}

      {/* wheel pit — flat recessed ring (no vertical cylinder walls) */}
      <mesh position={[WHEEL_X, 0.992, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.58, 0.8, 48]} />
        <meshStandardMaterial color="#2a1810" roughness={0.55} metalness={0.1} />
      </mesh>

      {/* gold rim */}
      <mesh position={[WHEEL_X, WHEEL_Y - 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.74, 0.035, 10, 40]} />
        <meshStandardMaterial color="#c9a13f" metalness={0.75} roughness={0.28} />
      </mesh>

      {/* outer ball track */}
      <mesh position={[WHEEL_X, WHEEL_Y - 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TRACK_RADIUS, 0.018, 8, 48]} />
        <meshStandardMaterial color="#8b7355" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* spinning wheel — single flat disc on the table */}
      <group ref={wheel} position={[WHEEL_X, WHEEL_Y, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.56, 64]} />
          <meshStandardMaterial map={wheelMap} roughness={0.45} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <circleGeometry args={[0.12, 24]} />
          <meshStandardMaterial color="#c9a13f" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* ball — fixed on the track while the wheel spins beneath */}
      <mesh position={[WHEEL_X, WHEEL_Y + 0.006, -TRACK_RADIUS]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.25} metalness={0.15} />
      </mesh>

      {/* dealer chip rail on wheel side */}
      <mesh position={[WHEEL_X, 1.02, 0.82]}>
        <boxGeometry args={[0.9, 0.04, 0.14]} />
        <meshStandardMaterial color="#3a2412" roughness={0.5} />
      </mesh>
      {['#c92a2a', '#1864ab', '#212529', '#2b8a3e'].map((color, i) => (
        <mesh key={color} position={[WHEEL_X - 0.23 + i * 0.18, 1.06, 0.82]}>
          <cylinderGeometry args={[0.05, 0.05, 0.035, 12]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}

      {/* layout wood trim ring */}
      <mesh position={[0.72, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.04, 1.48]} />
        <meshStandardMaterial color="#4a2f14" roughness={0.6} />
      </mesh>

      {/* full betting layout */}
      <mesh position={[0.72, 1.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.95, 1.38]} />
        <meshStandardMaterial map={layoutMap} roughness={0.82} />
      </mesh>

      {/* player chip line */}
      {['#c92a2a', '#1864ab', '#2b8a3e'].map((color, i) => (
        <mesh key={color} position={[0.35 + i * 0.22, 1.04, 0.62]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}

      {/* hanging lamp */}
      <mesh position={[0.35, 3.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.35, 2.65, 0]}>
        <coneGeometry args={[0.5, 0.42, 20, 1, true]} />
        <meshStandardMaterial color="#3b0d25" roughness={0.5} side={2} />
      </mesh>
      <mesh position={[0.35, 2.55, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#fff3c9" emissive="#ffdf8a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0.35, 2.3, 0]} intensity={24} distance={9} color="#ffe9b0" />
    </group>
  )
}