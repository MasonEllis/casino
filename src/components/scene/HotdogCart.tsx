import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function useHotdogSignTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 96
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff8ef'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#c92a2a'
    ctx.lineWidth = 5
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8)
    ctx.fillStyle = '#c92a2a'
    ctx.font = 'bold 38px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('HOT DOGS', canvas.width / 2, canvas.height / 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

function useCanopyTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    const stripe = 16
    for (let y = 0; y < canvas.height; y += stripe) {
      for (let x = 0; x < canvas.width; x += stripe) {
        const red = ((x / stripe + y / stripe) % 2 === 0)
        ctx.fillStyle = red ? '#c92a2a' : '#fff8ef'
        ctx.fillRect(x, y, stripe, stripe)
      }
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 4)
    return tex
  }, [])
}

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.12, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.05, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  )
}

export function HotdogCart({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const signMap = useHotdogSignTexture()
  const canopyMap = useCanopyTexture()
  const lampMat = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    if (lampMat.current) {
      lampMat.current.emissiveIntensity = 1.4 + Math.sin(clock.elapsedTime * 4.5) * 0.25
    }
  })

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* wheels at the back (-Z) */}
      <Wheel x={-0.55} z={-0.42} />
      <Wheel x={0.55} z={-0.42} />
      <Wheel x={-0.55} z={0.42} />
      <Wheel x={0.55} z={0.42} />

      {/* cart body */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.35, 0.75, 0.85]} />
        <meshStandardMaterial color="#c0c4cc" metalness={0.65} roughness={0.38} />
      </mesh>

      {/* customer-facing apron (+Z) */}
      <mesh position={[0, 0.72, 0.44]}>
        <boxGeometry args={[1.2, 0.55, 0.04]} />
        <meshStandardMaterial color="#e8ecf0" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* grill box */}
      <mesh position={[0, 1.02, 0.12]}>
        <boxGeometry args={[1.1, 0.18, 0.55]} />
        <meshStandardMaterial color="#2a1810" roughness={0.7} />
      </mesh>

      {/* roller dogs */}
      {[-0.28, 0, 0.28].map((dx) => (
        <mesh key={dx} position={[dx, 1.14, 0.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.05, 0.42, 10]} />
          <meshStandardMaterial color="#c47a3a" roughness={0.55} />
        </mesh>
      ))}

      {/* umbrella pole */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 1.35, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* striped canopy */}
      <mesh position={[0, 2.38, 0]} rotation={[0.06, 0, 0]}>
        <coneGeometry args={[1.1, 0.38, 32, 1, true]} />
        <meshStandardMaterial map={canopyMap} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* menu sign — faces customers on +Z */}
      <mesh position={[0, 1.38, 0.5]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[0.95, 0.3]} />
        <meshStandardMaterial map={signMap} roughness={0.8} />
      </mesh>

      {/* condiments */}
      {[-0.35, 0, 0.35].map((dx, i) => (
        <mesh key={dx} position={[dx, 1.08, 0.4]}>
          <cylinderGeometry args={[0.04, 0.045, 0.16, 8]} />
          <meshStandardMaterial color={['#c92a2a', '#f5f0e6', '#ffd27a'][i]} roughness={0.4} />
        </mesh>
      ))}

      {/* napkin dispenser */}
      <mesh position={[-0.5, 1.06, 0.22]}>
        <boxGeometry args={[0.14, 0.12, 0.1]} />
        <meshStandardMaterial color="#d0d4dc" roughness={0.45} />
      </mesh>

      {/* warm lamp */}
      <mesh position={[0.45, 1.55, 0.3]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial
          ref={lampMat}
          color="#fff3c9"
          emissive="#ffdf8a"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0.45, 1.55, 0.4]} intensity={10} distance={4} color="#ffe9b0" />
    </group>
  )
}