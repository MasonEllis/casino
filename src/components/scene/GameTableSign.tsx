import { useFeltDecalTexture } from './gameSign'

export function FeltDecal({
  text,
  accent = '#d4c890',
  position,
  scale = 0.55,
}: {
  text: string
  accent?: string
  position: [number, number, number]
  scale?: number
}) {
  const map = useFeltDecalTexture(text, accent)
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[scale, scale * 0.36]} />
      <meshStandardMaterial map={map} transparent opacity={0.92} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

export function GameSigns({
  feltDecal,
}: {
  feltDecal?: { text: string; accent?: string; position: [number, number, number]; scale?: number }
}) {
  return feltDecal ? <FeltDecal {...feltDecal} /> : null
}