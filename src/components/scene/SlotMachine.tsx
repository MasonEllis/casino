import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Interactable } from '../../game/store'
import type { SlotVariantId } from '../../game/slots'

const VARIANT_COLORS: Record<SlotVariantId, { sign: string; screen: string; cabinet: string }> = {
  classic: { sign: '#19e3ff', screen: '#ff2d95', cabinet: '#2a2140' },
  nine: { sign: '#69f0a2', screen: '#2bd96f', cabinet: '#1c3a2a' },
  twenty: { sign: '#ffd27a', screen: '#ffb52d', cabinet: '#3a2a14' },
}

export function SlotMachine({ interactable }: { interactable: Interactable }) {
  const [x, , z] = interactable.position
  const colors = VARIANT_COLORS[interactable.variant ?? 'classic']
  const screenMat = useRef<THREE.MeshStandardMaterial>(null)
  const domeMat = useRef<THREE.MeshStandardMaterial>(null)
  // offset so machines blink out of phase with each other
  const phase = useRef(Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase.current
    if (screenMat.current) {
      screenMat.current.emissiveIntensity = 1.6 + Math.sin(t * 2.2) * 0.5
    }
    if (domeMat.current) {
      domeMat.current.emissiveIntensity = Math.sin(t * 5) > 0.2 ? 2.8 : 0.4
    }
  })

  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* base pedestal */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.8, 0.6, 0.7]} />
        <meshStandardMaterial color="#15101f" roughness={0.6} />
      </mesh>
      {/* cabinet */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.85, 1.2, 0.75]} />
        <meshStandardMaterial color={colors.cabinet} metalness={0.4} roughness={0.45} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 1.35, 0.39]} rotation={[-0.12, 0, 0]}>
        <planeGeometry args={[0.62, 0.5]} />
        <meshStandardMaterial ref={screenMat} color="#170b20" emissive={colors.screen} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {/* reel windows */}
      {[-0.19, 0, 0.19].map((dx) => (
        <mesh key={dx} position={[dx, 1.36, 0.41]} rotation={[-0.12, 0, 0]}>
          <planeGeometry args={[0.15, 0.2]} />
          <meshStandardMaterial color="#fdf6e3" emissive="#fdf6e3" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* button deck */}
      <mesh position={[0, 0.78, 0.42]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.8, 0.06, 0.4]} />
        <meshStandardMaterial color="#1c1530" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.83, 0.46]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
        <meshStandardMaterial color="#e03131" emissive="#e03131" emissiveIntensity={0.8} />
      </mesh>
      {/* blinking dome light */}
      <mesh position={[0, 2.2, 0.05]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial ref={domeMat} color="#400a0a" emissive="#ff3b3b" emissiveIntensity={2.8} toneMapped={false} />
      </mesh>
      {/* lever */}
      <mesh position={[0.5, 1.35, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.025, 0.025, 0.55, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.54, 1.63, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#e03131" roughness={0.35} />
      </mesh>
    </group>
  )
}
