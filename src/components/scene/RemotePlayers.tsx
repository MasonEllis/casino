import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useLobby } from '../../game/lobby'

const SUIT_COLORS = ['#1a1030', '#2a1438', '#102038', '#281018', '#0f2820'] as const
const ACCENT_COLORS = ['#d4af37', '#ff2d95', '#00e5ff', '#c9a84c', '#e8b4ff'] as const
const SKIN_TONES = ['#e8c4a8', '#d4a574', '#c68642', '#8d5524', '#f1d5b8'] as const

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

function playerPalette(name: string) {
  const h = hashName(name)
  return {
    suit: SUIT_COLORS[h % SUIT_COLORS.length],
    accent: ACCENT_COLORS[h % ACCENT_COLORS.length],
    skin: SKIN_TONES[h % SKIN_TONES.length],
  }
}

function RemoteAvatar({
  name,
  x,
  y,
  z,
  yaw,
}: {
  name: string
  x: number
  y: number
  z: number
  yaw: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3(x, y - 1.65, z))
  const targetYaw = useRef(yaw)
  const palette = useMemo(() => playerPalette(name), [name])

  useEffect(() => {
    targetPos.current.set(x, y - 1.65, z)
    targetYaw.current = yaw
  }, [x, y, z, yaw])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const blend = 1 - Math.exp(-14 * delta)
    group.position.lerp(targetPos.current, blend)

    let yawDiff = targetYaw.current - group.rotation.y
    yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff))
    group.rotation.y += yawDiff * blend
  })

  return (
    <group ref={groupRef} position={[x, y - 1.65, z]} rotation={[0, yaw, 0]}>
      {/* legs */}
      <mesh position={[-0.11, 0.42, 0]} castShadow>
        <boxGeometry args={[0.18, 0.84, 0.22]} />
        <meshStandardMaterial color="#141018" roughness={0.85} />
      </mesh>
      <mesh position={[0.11, 0.42, 0]} castShadow>
        <boxGeometry args={[0.18, 0.84, 0.22]} />
        <meshStandardMaterial color="#141018" roughness={0.85} />
      </mesh>

      {/* shoes */}
      <mesh position={[-0.11, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.3]} />
        <meshStandardMaterial color="#0a0808" roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[0.11, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.3]} />
        <meshStandardMaterial color="#0a0808" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* torso / jacket */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <boxGeometry args={[0.52, 0.62, 0.3]} />
        <meshStandardMaterial color={palette.suit} roughness={0.72} metalness={0.08} />
      </mesh>

      {/* shirt collar */}
      <mesh position={[0, 1.32, 0.02]}>
        <boxGeometry args={[0.22, 0.1, 0.18]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.9} />
      </mesh>

      {/* bow tie */}
      <mesh position={[0, 1.28, 0.16]}>
        <boxGeometry args={[0.2, 0.08, 0.06]} />
        <meshStandardMaterial color={palette.accent} roughness={0.35} metalness={0.45} emissive={palette.accent} emissiveIntensity={0.15} />
      </mesh>

      {/* arms */}
      <mesh position={[-0.34, 1.02, 0]} rotation={[0, 0, 0.18]} castShadow>
        <boxGeometry args={[0.14, 0.52, 0.14]} />
        <meshStandardMaterial color={palette.suit} roughness={0.75} />
      </mesh>
      <mesh position={[0.34, 1.02, 0]} rotation={[0, 0, -0.18]} castShadow>
        <boxGeometry args={[0.14, 0.52, 0.14]} />
        <meshStandardMaterial color={palette.suit} roughness={0.75} />
      </mesh>
      <mesh position={[-0.38, 0.72, 0.04]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color={palette.skin} roughness={0.82} />
      </mesh>
      <mesh position={[0.38, 0.72, 0.04]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color={palette.skin} roughness={0.82} />
      </mesh>

      {/* head */}
      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color={palette.skin} roughness={0.78} />
      </mesh>

      {/* hair */}
      <mesh position={[0, 1.64, -0.02]} castShadow>
        <boxGeometry args={[0.34, 0.12, 0.32]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} />
      </mesh>

      {/* chip lapel pin */}
      <mesh position={[0.14, 1.18, 0.16]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} />
        <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.3} emissive="#d4af37" emissiveIntensity={0.2} />
      </mesh>

      <Html
        position={[0, 1.88, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="remote-name">
          <span className="remote-name-dot" style={{ background: palette.accent }} />
          {name}
        </div>
      </Html>
    </group>
  )
}

export function RemotePlayers() {
  const playerId = useLobby((s) => s.playerId)
  const players = useLobby((s) => s.players)
  const status = useLobby((s) => s.status)

  if (status !== 'connected') return null

  return (
    <>
      {players
        .filter((p) => p.id !== playerId)
        .map((p) => (
          <RemoteAvatar key={p.id} name={p.name} x={p.x} y={p.y} z={p.z} yaw={p.yaw} />
        ))}
    </>
  )
}