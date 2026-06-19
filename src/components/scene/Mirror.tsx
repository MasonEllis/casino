import { useIsMobile } from '../../hooks/useIsMobile'
import { MirrorSurface } from './MirrorSurface'

const MIRROR_WIDTH = 1.0
const MIRROR_HEIGHT = 2.5
const MIRROR_CENTER_Y = 2.1

export function Mirror({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const isMobile = useIsMobile()
  const [x, , z] = position

  const frameW = MIRROR_WIDTH + 0.24
  const frameH = MIRROR_HEIGHT + 0.2
  const lipW = MIRROR_WIDTH + 0.12
  const lipH = MIRROR_HEIGHT + 0.1

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, MIRROR_CENTER_Y, -0.03]}>
        <boxGeometry args={[frameW, frameH, 0.06]} />
        <meshStandardMaterial color="#6a5218" metalness={0.8} roughness={0.35} />
      </mesh>

      <mesh position={[0, MIRROR_CENTER_Y, -0.005]}>
        <boxGeometry args={[lipW, lipH, 0.04]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.25} />
      </mesh>

      <MirrorSurface
        width={MIRROR_WIDTH}
        height={MIRROR_HEIGHT}
        position={[0, MIRROR_CENTER_Y, 0.02]}
        resolution={isMobile ? 512 : 1024}
      />
    </group>
  )
}