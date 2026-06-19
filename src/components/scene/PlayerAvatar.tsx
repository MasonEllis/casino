import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { type EmoteId, emoteProgress, normalizeEmoteId } from '../../game/emotes'
import { useCasino } from '../../game/store'

/** Camera yaw faces -Z; avatar mesh front is built toward +Z. */
export const AVATAR_YAW_OFFSET = Math.PI

const SUIT_COLORS = ['#1a1030', '#2a1438', '#102038', '#281018', '#0f2820'] as const
const ACCENT_COLORS = ['#d4af37', '#ff2d95', '#00e5ff', '#c9a84c', '#e8b4ff'] as const
const SKIN_TONES = ['#e8c4a8', '#d4a574', '#c68642', '#8d5524', '#f1d5b8'] as const

const IDLE_ARM = { px: 0.34, py: 1.02, pz: 0, rx: 0, ry: 0, rz: -0.18 }

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function playerPalette(name: string) {
  const h = hashName(name)
  return {
    suit: SUIT_COLORS[h % SUIT_COLORS.length],
    accent: ACCENT_COLORS[h % ACCENT_COLORS.length],
    skin: SKIN_TONES[h % SKIN_TONES.length],
  }
}

function suitMat(color: string) {
  return <meshStandardMaterial color={color} roughness={0.75} />
}

function skinMat(color: string) {
  return <meshStandardMaterial color={color} roughness={0.82} />
}

export function PlayerAvatar({
  name,
  emote,
  emoteStartedAt,
  showName = true,
  localEmote = false,
}: {
  name: string
  emote: EmoteId | null
  emoteStartedAt: number
  showName?: boolean
  localEmote?: boolean
}) {
  const rootRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const thumbRef = useRef<THREE.Mesh>(null)
  const emotePropRef = useRef(emote)
  const emoteStartedAtPropRef = useRef(emoteStartedAt)
  const palette = useMemo(() => playerPalette(name), [name])

  emotePropRef.current = emote
  emoteStartedAtPropRef.current = emoteStartedAt

  useFrame(() => {
    const root = rootRef.current
    const rightArm = rightArmRef.current
    const thumb = thumbRef.current
    if (!root || !rightArm) return

    let current: EmoteId | null
    let startedAt: number
    if (localEmote) {
      const active = useCasino.getState().activeEmote
      if (!active) {
        current = null
        startedAt = 0
      } else {
        current = normalizeEmoteId(active.type) ?? active.type
        startedAt = active.startedAt
      }
    } else {
      current = normalizeEmoteId(emotePropRef.current)
      startedAt = emoteStartedAtPropRef.current
    }
    const progress = current && startedAt > 0 ? emoteProgress(current, startedAt) : null
    const playing = progress !== null && current !== null

    root.scale.setScalar(1)
    root.position.y = 0
    if (thumb) thumb.visible = false

    rightArm.position.set(IDLE_ARM.px, IDLE_ARM.py, IDLE_ARM.pz)
    rightArm.rotation.set(IDLE_ARM.rx, IDLE_ARM.ry, IDLE_ARM.rz)
    rightArm.scale.setScalar(1)

    if (!playing || !current || progress === null) return

    const ease = THREE.MathUtils.smoothstep(progress, 0, 0.15)
    const t = progress

    if (current === 'wave') {
      rightArm.position.set(0.52, 1.14 + ease * 0.06, 0.04)
      rightArm.rotation.set(0, 0, -Math.PI / 2)
      if (t > 0.15) {
        rightArm.rotation.x = Math.sin(t * Math.PI * 5) * 0.55
      }
      return
    }

    if (current === 'thumbsup') {
      root.scale.setScalar(1 + ease * 0.12)
      root.position.y = Math.sin(t * Math.PI * 3) * 0.08 * ease

      rightArm.position.set(0.3, 1.28 + ease * 0.2, 0.22)
      rightArm.rotation.set(-1.35 * ease, 0.15 * ease, -0.55 * ease)
      rightArm.scale.setScalar(1 + ease * 0.25)

      if (thumb) {
        thumb.visible = true
        const pulse = 1 + Math.sin(t * Math.PI * 4) * 0.2
        thumb.scale.set(pulse, pulse * 1.15, pulse)
      }
    }
  })

  return (
    <group ref={rootRef}>
      <mesh position={[-0.11, 0.42, 0]} castShadow>
        <boxGeometry args={[0.18, 0.84, 0.22]} />
        <meshStandardMaterial color="#141018" roughness={0.85} />
      </mesh>
      <mesh position={[0.11, 0.42, 0]} castShadow>
        <boxGeometry args={[0.18, 0.84, 0.22]} />
        <meshStandardMaterial color="#141018" roughness={0.85} />
      </mesh>

      <mesh position={[-0.11, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.3]} />
        <meshStandardMaterial color="#0a0808" roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[0.11, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.3]} />
        <meshStandardMaterial color="#0a0808" roughness={0.7} metalness={0.15} />
      </mesh>

      <mesh position={[0, 1.08, 0]} castShadow>
        <boxGeometry args={[0.52, 0.62, 0.3]} />
        <meshStandardMaterial color={palette.suit} roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh position={[0, 1.32, 0.02]}>
        <boxGeometry args={[0.22, 0.1, 0.18]} />
        <meshStandardMaterial color="#f0ebe0" roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.28, 0.16]}>
        <boxGeometry args={[0.2, 0.08, 0.06]} />
        <meshStandardMaterial
          color={palette.accent}
          roughness={0.35}
          metalness={0.45}
          emissive={palette.accent}
          emissiveIntensity={0.15}
        />
      </mesh>

      <group position={[-0.34, 1.02, 0]} rotation={[0, 0, 0.18]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.52, 0.14]} />
          {suitMat(palette.suit)}
        </mesh>
        <mesh position={[0, -0.3, 0.04]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          {skinMat(palette.skin)}
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.34, 1.02, 0]} rotation={[0, 0, -0.18]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.52, 0.14]} />
          {suitMat(palette.suit)}
        </mesh>
        <mesh position={[0, -0.3, 0.04]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          {skinMat(palette.skin)}
        </mesh>
        <mesh ref={thumbRef} position={[0, 0.08, 0.06]} castShadow>
          <boxGeometry args={[0.1, 0.22, 0.1]} />
          <meshStandardMaterial
            color={palette.skin}
            roughness={0.7}
            emissive="#ffd54f"
            emissiveIntensity={0.85}
          />
        </mesh>
      </group>

      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshStandardMaterial color={palette.skin} roughness={0.78} />
      </mesh>

      <mesh position={[0, 1.64, -0.02]} castShadow>
        <boxGeometry args={[0.34, 0.12, 0.32]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} />
      </mesh>

      <mesh position={[0.14, 1.18, 0.16]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 12]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.6}
          roughness={0.3}
          emissive="#d4af37"
          emissiveIntensity={0.2}
        />
      </mesh>

      {showName && (
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
      )}
    </group>
  )
}