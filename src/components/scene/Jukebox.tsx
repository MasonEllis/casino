import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Interactable } from '../../game/store'

export function Jukebox({ interactable }: { interactable: Interactable }) {
  const [x, , z] = interactable.position
  const neonMat = useRef<THREE.MeshStandardMaterial>(null)
  const bulbMat = useRef<THREE.MeshStandardMaterial>(null)
  const phase = useRef(Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase.current
    if (neonMat.current) {
      neonMat.current.emissiveIntensity = 0.9 + Math.sin(t * 3.2) * 0.35
    }
    if (bulbMat.current) {
      bulbMat.current.emissiveIntensity = 1.1 + Math.sin(t * 5.5) * 0.5
    }
  })

  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* base */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[1.05, 0.24, 0.72]} />
        <meshStandardMaterial color="#1a1028" metalness={0.5} roughness={0.55} />
      </mesh>

      {/* cabinet */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.92, 1.46, 0.62]} />
        <meshStandardMaterial color="#6b1020" metalness={0.35} roughness={0.48} />
      </mesh>

      {/* chrome trim */}
      <mesh position={[0, 1.62, 0.32]}>
        <boxGeometry args={[0.86, 0.08, 0.04]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* glass front */}
      <mesh position={[0, 1.05, 0.32]}>
        <boxGeometry args={[0.78, 1.1, 0.03]} />
        <meshStandardMaterial color="#0a0814" metalness={0.9} roughness={0.1} transparent opacity={0.35} />
      </mesh>

      {/* vinyl */}
      <mesh position={[0, 0.72, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
        <meshStandardMaterial color="#111111" metalness={0.2} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.72, 0.29]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.025, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* neon arch */}
      <mesh position={[0, 1.38, 0.34]}>
        <torusGeometry args={[0.34, 0.03, 8, 24, Math.PI]} />
        <meshStandardMaterial
          ref={neonMat}
          color="#ff2d95"
          emissive="#ff2d95"
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>

      {/* selection bulbs */}
      {[-0.22, -0.08, 0.08, 0.22].map((bx) => (
        <mesh key={bx} position={[bx, 1.52, 0.34]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial
            ref={bx === 0 ? bulbMat : undefined}
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={1.1}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* title plate */}
      <mesh position={[0, 1.2, 0.34]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffd27a" emissiveIntensity={0.45} toneMapped={false} />
      </mesh>

      {/* coin slot */}
      <mesh position={[0, 0.42, 0.33]}>
        <boxGeometry args={[0.18, 0.04, 0.03]} />
        <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}