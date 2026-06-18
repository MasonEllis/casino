import { useMemo } from 'react'
import * as THREE from 'three'
import type { Interactable } from '../../game/store'

const CHIP_COLORS = ['#c92a2a', '#1864ab', '#212529']

function useTableLabelTexture(label: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(8, 4, 13, 0.92)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 52px Georgia, serif'
    ctx.fillStyle = '#ffd27a'
    ctx.fillText(label, 256, 68)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [label])
}

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
  const labelTexture = useTableLabelTexture(interactable.label)
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

      {/* table name plaque */}
      <mesh position={[0, 1.08, 0.95]} rotation={[-0.55, 0, 0]}>
        <planeGeometry args={[1.1, 0.28]} />
        <meshStandardMaterial
          map={labelTexture}
          emissive="#ffffff"
          emissiveMap={labelTexture}
          emissiveIntensity={0.9}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  )
}
