import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Interactable } from '../../game/store'

export function AtmMachine({ interactable }: { interactable: Interactable }) {
  const [x, , z] = interactable.position
  const screenMat = useRef<THREE.MeshStandardMaterial>(null)
  const phase = useRef(Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase.current
    if (screenMat.current) {
      screenMat.current.emissiveIntensity = 1.2 + Math.sin(t * 2.5) * 0.4
    }
  })

  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* wall mount plate */}
      <mesh position={[0, 1.35, -0.12]}>
        <boxGeometry args={[1.1, 1.7, 0.12]} />
        <meshStandardMaterial color="#1a2535" metalness={0.55} roughness={0.45} />
      </mesh>

      {/* main body */}
      <mesh position={[0, 1.35, 0.08]}>
        <boxGeometry args={[1.0, 1.55, 0.35]} />
        <meshStandardMaterial color="#2d8f4e" metalness={0.35} roughness={0.5} />
      </mesh>

      {/* screen bezel */}
      <mesh position={[0, 1.55, 0.27]}>
        <boxGeometry args={[0.78, 0.52, 0.04]} />
        <meshStandardMaterial color="#0a1020" roughness={0.4} />
      </mesh>

      {/* glowing screen */}
      <mesh position={[0, 1.55, 0.3]}>
        <planeGeometry args={[0.7, 0.44]} />
        <meshStandardMaterial
          ref={screenMat}
          color="#061018"
          emissive="#19e3ff"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      {/* CURB label */}
      <mesh position={[0, 1.05, 0.28]}>
        <planeGeometry args={[0.62, 0.12]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffd27a" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>

      {/* card slot */}
      <mesh position={[0, 0.88, 0.28]}>
        <boxGeometry args={[0.42, 0.05, 0.03]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* cash dispenser */}
      <mesh position={[0, 0.72, 0.3]}>
        <boxGeometry args={[0.5, 0.08, 0.06]} />
        <meshStandardMaterial color="#222222" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* keypad buttons */}
      {[-0.22, -0.11, 0, 0.11, 0.22].map((dx) => (
        <mesh key={dx} position={[dx, 1.18, 0.29]}>
          <boxGeometry args={[0.08, 0.05, 0.02]} />
          <meshStandardMaterial color="#d4af37" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      <pointLight position={[0, 1.55, 0.6]} intensity={12} distance={4} color="#69f0a2" />
    </group>
  )
}