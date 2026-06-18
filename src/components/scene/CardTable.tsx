import type { Interactable } from '../../game/store'

const CHIP_COLORS = ['#c92a2a', '#1864ab', '#212529']

/** Round card table used for baccarat and casino war, recolored per game. */
export function CardTable({
  interactable,
  feltColor,
  lampShadeColor,
}: {
  interactable: Interactable
  feltColor: string
  lampShadeColor: string
}) {
  const [x, , z] = interactable.position
  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* felt top */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.08, 36]} />
        <meshStandardMaterial color={feltColor} roughness={0.85} />
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

      {/* dealt cards on the felt */}
      <mesh position={[-0.25, 1.0, -0.35]} rotation={[-Math.PI / 2, 0, 0.25]}>
        <planeGeometry args={[0.28, 0.4]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 1.0, -0.3]} rotation={[-Math.PI / 2, 0, -0.18]}>
        <planeGeometry args={[0.28, 0.4]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.6} />
      </mesh>

      {/* chip stacks */}
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
        <meshStandardMaterial color={lampShadeColor} roughness={0.5} side={2} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#fff3c9" emissive="#ffdf8a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.3, 0]} intensity={22} distance={8} color="#ffe9b0" />
    </group>
  )
}
