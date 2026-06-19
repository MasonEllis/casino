import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function useBarSignTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 112
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0a0510'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#ff2d95'
    ctx.lineWidth = 5
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12)
    ctx.fillStyle = '#ffd27a'
    ctx.font = 'bold 64px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('BAR', canvas.width / 2, canvas.height / 2 + 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

function Bottle({ x, y, z, color, height = 0.24 }: { x: number; y: number; z: number; color: string; height?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <cylinderGeometry args={[0.032, 0.038, height, 8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, height / 2 + 0.025, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.05, 6]} />
        <meshStandardMaterial color="#1a1008" roughness={0.65} />
      </mesh>
    </group>
  )
}

function Tap({ x }: { x: number }) {
  return (
    <group position={[x, 1.14, 0.28]}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.04, 0.22, 10]} />
        <meshStandardMaterial color="#9a7a30" metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.14, 0.04]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.04]} />
        <meshStandardMaterial color="#c0c4cc" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

function HangingGlass({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 2.05, z]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.05, 0.12, 10, 1, true]} />
      <meshStandardMaterial color="#a8d8ff" transparent opacity={0.45} roughness={0.1} metalness={0.2} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Stool({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.78, 0.06]}>
        <boxGeometry args={[0.38, 0.5, 0.06]} />
        <meshStandardMaterial color="#4a2818" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.19, 0.2, 0.07, 16]} />
        <meshStandardMaterial color="#6b3b22" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.022, 0.028, 0.46, 8]} />
        <meshStandardMaterial color="#8b7355" metalness={0.75} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 0.05, 12]} />
        <meshStandardMaterial color="#8b7355" metalness={0.75} roughness={0.32} />
      </mesh>
    </group>
  )
}

function Pendant({ x }: { x: number }) {
  return (
    <group position={[x, 3.35, 0.55]}>
      <mesh>
        <cylinderGeometry args={[0.008, 0.008, 0.55, 6]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <coneGeometry args={[0.14, 0.22, 12, 1, true]} />
        <meshStandardMaterial color="#3b0d25" roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.48, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#fff3c9" emissive="#ffdf8a" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.5, 0]} intensity={12} distance={5} color="#ffe9b0" />
    </group>
  )
}

export function Bar({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const [x, , z] = position
  const signMap = useBarSignTexture()
  const neonMat = useRef<THREE.MeshStandardMaterial>(null)
  const underGlow = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (neonMat.current) {
      neonMat.current.emissiveIntensity = 1.2 + Math.sin(t * 2.8) * 0.35
    }
    if (underGlow.current) {
      underGlow.current.emissiveIntensity = 1.4 + Math.sin(t * 3.5) * 0.4
    }
  })

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      {/* floor mat */}
      <mesh position={[0, 0.008, 1.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 1.8]} />
        <meshStandardMaterial color="#1a1020" roughness={0.92} />
      </mesh>

      {/* back bar structure against wall */}
      <mesh position={[0, 1.2, -0.62]}>
        <boxGeometry args={[5.4, 2.35, 0.22]} />
        <meshStandardMaterial color="#1a1008" roughness={0.7} />
      </mesh>

      {/* mirror backsplash */}
      <mesh position={[0, 1.65, -0.5]}>
        <planeGeometry args={[4.8, 1.35]} />
        <meshStandardMaterial color="#2a3040" metalness={0.92} roughness={0.08} />
      </mesh>

      {/* upper shelf */}
      <mesh position={[0, 2.45, -0.42]}>
        <boxGeometry args={[5.0, 0.08, 0.32]} />
        <meshStandardMaterial color="#3d2814" roughness={0.5} />
      </mesh>
      {/* lower shelf */}
      <mesh position={[0, 1.35, -0.42]}>
        <boxGeometry args={[5.0, 0.08, 0.32]} />
        <meshStandardMaterial color="#3d2814" roughness={0.5} />
      </mesh>

      {[-2.0, -1.35, -0.7, -0.05, 0.6, 1.25, 1.9].map((bx, i) => (
        <Bottle
          key={`top-${bx}`}
          x={bx}
          y={2.05}
          z={-0.38}
          height={0.22}
          color={['#c92a2a', '#ffd27a', '#2b8a3e', '#1864ab', '#b91c1c', '#e8a020', '#69f0a2'][i % 7]}
        />
      ))}
      {[-1.7, -0.85, -0.2, 0.45, 1.1, 1.65].map((bx, i) => (
        <Bottle
          key={`low-${bx}`}
          x={bx}
          y={1.55}
          z={-0.38}
          height={0.26}
          color={['#8b4513', '#c92a2a', '#2f4f6f', '#ffd27a', '#1b5e20', '#4a148c'][i % 6]}
        />
      ))}

      {[-1.5, -0.5, 0.5, 1.5].map((gx) => (
        <HangingGlass key={gx} x={gx} z={-0.35} />
      ))}

      {/* counter top — marble */}
      <mesh position={[0, 1.1, 0.12]}>
        <boxGeometry args={[5.4, 0.1, 0.95]} />
        <meshStandardMaterial color="#d4c8b8" roughness={0.28} metalness={0.05} />
      </mesh>
      {/* counter front */}
      <mesh position={[0, 0.58, 0.38]}>
        <boxGeometry args={[5.2, 0.98, 0.42]} />
        <meshStandardMaterial color="#4a2f14" roughness={0.52} />
      </mesh>
      {/* counter side panels */}
      <mesh position={[-2.55, 0.58, 0.12]}>
        <boxGeometry args={[0.12, 0.98, 0.7]} />
        <meshStandardMaterial color="#3a2410" roughness={0.55} />
      </mesh>
      <mesh position={[2.55, 0.58, 0.12]}>
        <boxGeometry args={[0.12, 0.98, 0.7]} />
        <meshStandardMaterial color="#3a2410" roughness={0.55} />
      </mesh>
      {/* gold trim */}
      <mesh position={[0, 1.05, 0.42]}>
        <boxGeometry args={[5.25, 0.04, 0.04]} />
        <meshStandardMaterial color="#c9a13f" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* under-counter neon */}
      <mesh position={[0, 0.92, 0.44]}>
        <boxGeometry args={[4.8, 0.03, 0.03]} />
        <meshStandardMaterial
          ref={underGlow}
          color="#19e3ff"
          emissive="#19e3ff"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* foot rail — runs along the bar width, not straight up */}
      <mesh position={[0, 0.2, 0.5]} rotation={[0.2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.032, 0.032, 4.8, 8]} />
        <meshStandardMaterial color="#c9a13f" metalness={0.88} roughness={0.22} />
      </mesh>

      <Tap x={-1.1} />
      <Tap x={-0.35} />
      <Tap x={0.4} />

      {/* neon sign */}
      <mesh position={[0, 2.85, -0.28]}>
        <planeGeometry args={[1.6, 0.55]} />
        <meshStandardMaterial
          ref={neonMat}
          map={signMap}
          emissive="#ffffff"
          emissiveMap={signMap}
          emissiveIntensity={1.2}
          toneMapped={false}
          transparent
        />
      </mesh>

      {/* register & tip jar */}
      <mesh position={[2.1, 1.16, 0.1]}>
        <boxGeometry args={[0.38, 0.2, 0.32]} />
        <meshStandardMaterial color="#1a1020" roughness={0.5} />
      </mesh>
      <mesh position={[1.65, 1.18, 0.15]}>
        <cylinderGeometry args={[0.05, 0.055, 0.14, 10]} />
        <meshStandardMaterial color="#a8d8ff" transparent opacity={0.6} roughness={0.15} />
      </mesh>

      <Pendant x={-1.5} />
      <Pendant x={0} />
      <Pendant x={1.5} />

      {[-1.8, -0.9, 0, 0.9, 1.8].map((sx) => (
        <Stool key={sx} x={sx} z={1.05} />
      ))}
    </group>
  )
}