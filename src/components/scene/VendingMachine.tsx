import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function useSnackSignTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 80
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0a1020'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#19e3ff'
    ctx.lineWidth = 4
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6)
    ctx.fillStyle = '#19e3ff'
    ctx.font = 'bold 34px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('SNACKS', canvas.width / 2, canvas.height / 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

const PRODUCT_COLORS = ['#c92a2a', '#ffd27a', '#2d8f4e', '#6b4eff', '#ff7b2d', '#19e3ff'] as const

export function VendingMachine({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const signMap = useSnackSignTexture()
  const glowMat = useRef<THREE.MeshStandardMaterial>(null)
  const phase = useRef(Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    if (glowMat.current) {
      glowMat.current.emissiveIntensity = 0.85 + Math.sin(clock.elapsedTime * 2.8 + phase.current) * 0.25
    }
  })

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* base feet */}
      <mesh position={[-0.38, 0.06, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.55]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh position={[0.38, 0.06, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.55]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.45} />
      </mesh>

      {/* main cabinet */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.92, 2.1, 0.62]} />
        <meshStandardMaterial color="#1c2840" metalness={0.45} roughness={0.48} />
      </mesh>

      {/* chrome trim */}
      <mesh position={[0, 2.08, 0.32]}>
        <boxGeometry args={[0.86, 0.06, 0.04]} />
        <meshStandardMaterial color="#c0c8d8" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* glass door */}
      <mesh position={[0, 1.2, 0.32]}>
        <boxGeometry args={[0.78, 1.45, 0.03]} />
        <meshStandardMaterial color="#0a1428" metalness={0.9} roughness={0.08} transparent opacity={0.42} />
      </mesh>

      {/* product rows */}
      {PRODUCT_COLORS.map((color, row) =>
        [-0.22, 0, 0.22].map((col, slot) => (
          <mesh key={`${row}-${slot}`} position={[col, 1.72 - row * 0.38, 0.28]}>
            <boxGeometry args={[0.18, 0.24, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
        )),
      )}

      {/* neon header sign */}
      <mesh position={[0, 1.92, 0.34]}>
        <planeGeometry args={[0.62, 0.18]} />
        <meshStandardMaterial
          ref={glowMat}
          map={signMap}
          emissive="#19e3ff"
          emissiveMap={signMap}
          emissiveIntensity={0.85}
          toneMapped={false}
        />
      </mesh>

      {/* selection panel */}
      <mesh position={[0, 0.42, 0.33]}>
        <boxGeometry args={[0.7, 0.32, 0.04]} />
        <meshStandardMaterial color="#111820" roughness={0.5} />
      </mesh>

      {/* keypad buttons */}
      {[-0.18, -0.06, 0.06, 0.18].map((bx) => (
        <mesh key={bx} position={[bx, 0.48, 0.36]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#d4af37" metalness={0.55} roughness={0.38} />
        </mesh>
      ))}

      {/* coin slot */}
      <mesh position={[0.28, 0.36, 0.35]}>
        <boxGeometry args={[0.14, 0.04, 0.03]} />
        <meshStandardMaterial color="#222222" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* dispense tray */}
      <mesh position={[0, 0.18, 0.36]}>
        <boxGeometry args={[0.55, 0.1, 0.14]} />
        <meshStandardMaterial color="#2a3040" metalness={0.5} roughness={0.4} />
      </mesh>

      <pointLight position={[0, 1.4, 0.55]} intensity={8} distance={3.5} color="#8fd4ff" />
    </group>
  )
}