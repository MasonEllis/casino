import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Interactable } from '../../game/store'
import { GameSigns } from './GameTableSign'

function Die({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[0.13, 0.13, 0.13]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.35} />
      </mesh>
      {/* a few pips on the top face */}
      {[
        [-0.03, -0.03],
        [0.03, 0.03],
        [0, 0],
      ].map(([px, pz]) => (
        <mesh key={`${px}-${pz}`} position={[px, 0.066, pz]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.012, 8]} />
          <meshStandardMaterial color="#1c1c1c" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Crate({ position, rotationY, size = 0.6 }: { position: [number, number, number]; rotationY: number; size?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, size / 2, 0]}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#6b4a26" roughness={0.85} />
      </mesh>
      {/* edge slats */}
      {[-size / 2 + 0.03, size / 2 - 0.03].map((dy) => (
        <mesh key={dy} position={[0, size / 2 + dy, 0]}>
          <boxGeometry args={[size + 0.03, 0.06, size + 0.03]} />
          <meshStandardMaterial color="#553a1e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

export function CrapsCorner({ interactable }: { interactable: Interactable }) {
  const [x, , z] = interactable.position
  const bulbMat = useRef<THREE.MeshStandardMaterial>(null)

  // bare bulb flickers slightly for a back-alley feel
  useFrame(({ clock }) => {
    if (bulbMat.current) {
      const t = clock.elapsedTime
      bulbMat.current.emissiveIntensity = 2.6 + Math.sin(t * 13) * 0.18 + Math.sin(t * 31) * 0.12
    }
  })

  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* worn concrete patch */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.7, 28]} />
        <meshStandardMaterial color="#3b3b40" roughness={0.95} />
      </mesh>
      {/* chalk circle */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.91, 36]} />
        <meshStandardMaterial color="#e8e0c8" roughness={0.8} />
      </mesh>

      {/* dice mid-game */}
      <Die position={[-0.18, 0.065, 0.1]} rotationY={0.6} />
      <Die position={[0.2, 0.065, -0.12]} rotationY={2.1} />

      {/* cash on the ground */}
      {[
        [-0.45, 0.35, 0.4],
        [0.5, 0.3, -0.7],
        [0.1, 0.55, 2.6],
      ].map(([bx, bz, rot]) => (
        <mesh key={`${bx}-${bz}`} position={[bx, 0.014, bz]} rotation={[-Math.PI / 2, 0, rot]}>
          <planeGeometry args={[0.3, 0.13]} />
          <meshStandardMaterial color="#4f8a4f" roughness={0.7} />
        </mesh>
      ))}

      {/* crates to lean on */}
      <Crate position={[-1.5, 0, -0.6]} rotationY={0.3} />
      <Crate position={[1.45, 0, -0.5]} rotationY={-0.4} />
      <Crate position={[1.6, 0, 0.35]} rotationY={0.15} size={0.45} />

      <GameSigns feltDecal={{ text: 'CRAPS', accent: '#e8e0c8', position: [0, 0.018, 0], scale: 0.7 }} />

      {/* hanging bare bulb */}
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 2.0, 6]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0, 2.95, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial ref={bulbMat} color="#fff3c9" emissive="#ffd87a" emissiveIntensity={2.6} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.7, 0]} intensity={16} distance={7} color="#ffdf9a" />
    </group>
  )
}
