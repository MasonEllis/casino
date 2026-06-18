import { useMemo } from 'react'
import * as THREE from 'three'
import { ROOM, COLUMN_POSITIONS } from '../../game/store'

const W = ROOM.halfWidth * 2
const D = ROOM.halfDepth * 2
const H = ROOM.height

function useSignTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 320
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0d0518'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const text = '♠ GRAND ROYALE ♦'
    const maxWidth = canvas.width * 0.88
    let fontSize = 130
    ctx.font = `bold ${fontSize}px Georgia, serif`
    while (ctx.measureText(text).width > maxWidth && fontSize > 72) {
      fontSize -= 4
      ctx.font = `bold ${fontSize}px Georgia, serif`
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#ff2d95'
    ctx.shadowBlur = 28
    ctx.fillStyle = '#ffd27a'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [])
}

function NeonStrip({
  position,
  length,
  rotationY = 0,
  color,
}: {
  position: [number, number, number]
  length: number
  rotationY?: number
  color: string
}) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[length, 0.08, 0.08]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.4} toneMapped={false} />
    </mesh>
  )
}

function Column({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, H / 2, 0]}>
        <cylinderGeometry args={[0.45, 0.5, H, 20]} />
        <meshStandardMaterial color="#4a3520" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.3, 20]} />
        <meshStandardMaterial color="#2c1d10" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, H - 0.15, 0]}>
        <cylinderGeometry args={[0.7, 0.6, 0.3, 20]} />
        <meshStandardMaterial color="#2c1d10" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  )
}

export function CasinoFloor() {
  const signTexture = useSignTexture()
  const neonY = H - 0.35

  return (
    <group>
      {/* lighting */}
      <ambientLight intensity={0.65} color="#cdb8ff" />
      <hemisphereLight intensity={0.45} color="#ffe2b0" groundColor="#2a0a14" />
      <pointLight position={[0, H - 0.6, 0]} intensity={110} distance={30} color="#ffd9a0" />
      <pointLight position={[-11, H - 0.6, -6]} intensity={60} distance={20} color="#ffcf8f" />
      <pointLight position={[11, H - 0.6, -6]} intensity={60} distance={20} color="#ffcf8f" />
      <pointLight position={[0, H - 0.6, 9]} intensity={60} distance={20} color="#ffcf8f" />
      <pointLight position={[16.5, 3.4, 0]} intensity={40} distance={16} color="#ff5ab8" />

      {/* carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#2e0a14" roughness={0.95} />
      </mesh>
      {/* center medallion */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[4.5, 48]} />
        <meshStandardMaterial color="#43101e" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[4.3, 4.5, 48]} />
        <meshStandardMaterial color="#b8923f" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#120712" roughness={1} />
      </mesh>

      {/* walls */}
      <mesh position={[0, H / 2, -ROOM.halfDepth]}>
        <boxGeometry args={[W, H, 0.4]} />
        <meshStandardMaterial color="#221026" roughness={0.85} />
      </mesh>
      <mesh position={[0, H / 2, ROOM.halfDepth]}>
        <boxGeometry args={[W, H, 0.4]} />
        <meshStandardMaterial color="#221026" roughness={0.85} />
      </mesh>
      <mesh position={[-ROOM.halfWidth, H / 2, 0]}>
        <boxGeometry args={[0.4, H, D]} />
        <meshStandardMaterial color="#1c0d22" roughness={0.85} />
      </mesh>
      <mesh position={[ROOM.halfWidth, H / 2, 0]}>
        <boxGeometry args={[0.4, H, D]} />
        <meshStandardMaterial color="#1c0d22" roughness={0.85} />
      </mesh>

      {/* gold baseboards */}
      <mesh position={[0, 0.12, -ROOM.halfDepth + 0.25]}>
        <boxGeometry args={[W, 0.24, 0.1]} />
        <meshStandardMaterial color="#9a7a30" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.12, ROOM.halfDepth - 0.25]}>
        <boxGeometry args={[W, 0.24, 0.1]} />
        <meshStandardMaterial color="#9a7a30" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-ROOM.halfWidth + 0.25, 0.12, 0]}>
        <boxGeometry args={[0.1, 0.24, D]} />
        <meshStandardMaterial color="#9a7a30" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[ROOM.halfWidth - 0.25, 0.12, 0]}>
        <boxGeometry args={[0.1, 0.24, D]} />
        <meshStandardMaterial color="#9a7a30" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* neon trim along wall tops */}
      <NeonStrip position={[0, neonY, -ROOM.halfDepth + 0.3]} length={W - 1} color="#ff2d95" />
      <NeonStrip position={[0, neonY, ROOM.halfDepth - 0.3]} length={W - 1} color="#ff2d95" />
      <NeonStrip position={[-ROOM.halfWidth + 0.3, neonY, 0]} length={D - 1} rotationY={Math.PI / 2} color="#19e3ff" />
      <NeonStrip position={[ROOM.halfWidth - 0.3, neonY, 0]} length={D - 1} rotationY={Math.PI / 2} color="#19e3ff" />

      {/* marquee sign on the back wall */}
      <mesh position={[0, 3.15, -ROOM.halfDepth + 0.48]}>
        <planeGeometry args={[14, 2.4]} />
        <meshStandardMaterial map={signTexture} emissive="#ffffff" emissiveMap={signTexture} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* columns */}
      {COLUMN_POSITIONS.map(([x, z]) => (
        <Column key={`${x}-${z}`} x={x} z={z} />
      ))}
    </group>
  )
}
