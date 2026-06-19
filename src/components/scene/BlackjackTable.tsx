import type { Interactable } from '../../game/store'
import { GameSigns } from './GameTableSign'

const CHIP_COLORS = ['#c92a2a', '#1864ab', '#212529']

export function BlackjackTable({ interactable }: { interactable: Interactable }) {
  const [x, , z] = interactable.position
  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* felt top */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.08, 36]} />
        <meshStandardMaterial color="#0c6b3c" roughness={0.85} />
      </mesh>
      {/* padded rim */}
      <mesh position={[0, 0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.09, 12, 36]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* pedestal */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 0.92, 20]} />
        <meshStandardMaterial color="#2b1a0d" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.75, 0.85, 0.1, 24]} />
        <meshStandardMaterial color="#1d1208" roughness={0.7} />
      </mesh>

      <GameSigns feltDecal={{ text: 'BLACKJACK', accent: '#d4c890', position: [0, 1.002, 0], scale: 0.72 }} />

      {/* dealer shoe */}
      <mesh position={[0, 1.02, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.22, 0.32, 0.08]} />
        <meshStandardMaterial color="#1a1020" roughness={0.7} />
      </mesh>

      {/* chip tray */}
      {CHIP_COLORS.map((color, i) => (
        <mesh key={color} position={[-0.55 + i * 0.28, 1.03, 0.55]}>
          <cylinderGeometry args={[0.09, 0.09, 0.07, 16]} />
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
        <meshStandardMaterial color="#0d3b25" roughness={0.5} side={2} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#fff3c9" emissive="#ffdf8a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.3, 0]} intensity={22} distance={8} color="#ffe9b0" />
    </group>
  )
}