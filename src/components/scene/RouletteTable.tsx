import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Interactable } from '../../game/store'

export function RouletteTable({ interactable }: { interactable: Interactable }) {
  const [x, , z] = interactable.position
  const wheel = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (wheel.current) wheel.current.rotation.y += delta * 0.9
  })

  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* table top */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[3.0, 0.1, 1.5]} />
        <meshStandardMaterial color="#0c6b3c" roughness={0.85} />
      </mesh>
      {/* wooden frame */}
      <mesh position={[0, 0.89, 0]}>
        <boxGeometry args={[3.15, 0.08, 1.65]} />
        <meshStandardMaterial color="#4a2f14" roughness={0.55} />
      </mesh>
      {/* legs */}
      {[
        [-1.35, -0.6],
        [1.35, -0.6],
        [-1.35, 0.6],
        [1.35, 0.6],
      ].map(([lx, lz]) => (
        <mesh key={`${lx}-${lz}`} position={[lx, 0.45, lz]}>
          <boxGeometry args={[0.12, 0.9, 0.12]} />
          <meshStandardMaterial color="#2b1a0d" roughness={0.6} />
        </mesh>
      ))}

      {/* betting layout markings */}
      <mesh position={[0.6, 1.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 1.1]} />
        <meshStandardMaterial color="#0f7d46" roughness={0.85} />
      </mesh>
      {[-0.45, 0, 0.45].map((dz) => (
        <mesh key={dz} position={[0.6, 1.01, dz * 0.55 + 0.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.5, 0.015]} />
          <meshStandardMaterial color="#e8e0c8" roughness={0.7} />
        </mesh>
      ))}
      {[-0.1, 0.35, 0.85, 1.3].map((dx) => (
        <mesh key={dx} position={[dx, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.015, 1.1]} />
          <meshStandardMaterial color="#e8e0c8" roughness={0.7} />
        </mesh>
      ))}

      {/* wheel basin */}
      <mesh position={[-0.95, 1.02, 0]}>
        <cylinderGeometry args={[0.58, 0.62, 0.08, 32]} />
        <meshStandardMaterial color="#3a2412" roughness={0.5} />
      </mesh>
      {/* spinning wheel */}
      <group ref={wheel} position={[-0.95, 1.08, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
          <meshStandardMaterial color="#5e0e15" roughness={0.45} />
        </mesh>
        {/* alternating pocket wedges suggested by gold spokes */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.035, 0]} rotation={[0, (i * Math.PI) / 4, 0]}>
            <boxGeometry args={[0.96, 0.012, 0.03]} />
            <meshStandardMaterial color="#c9a13f" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.1, 16]} />
          <meshStandardMaterial color="#c9a13f" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* ball */}
        <mesh position={[0.38, 0.05, 0]}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshStandardMaterial color="#f5f0e6" roughness={0.3} />
        </mesh>
      </group>
      {/* rim */}
      <mesh position={[-0.95, 1.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.035, 10, 32]} />
        <meshStandardMaterial color="#c9a13f" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* chip stacks on the layout */}
      {['#c92a2a', '#1864ab', '#2b8a3e'].map((color, i) => (
        <mesh key={color} position={[0.25 + i * 0.3, 1.04, 0.42]}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 14]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}

      {/* hanging lamp */}
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 6]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0, 2.65, 0]}>
        <coneGeometry args={[0.45, 0.4, 20, 1, true]} />
        <meshStandardMaterial color="#3b0d25" roughness={0.5} side={2} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#fff3c9" emissive="#ffdf8a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.3, 0]} intensity={22} distance={8} color="#ffe9b0" />
    </group>
  )
}
