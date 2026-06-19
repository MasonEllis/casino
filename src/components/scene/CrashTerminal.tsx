import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Interactable } from '../../game/store'

export function CrashTerminal({ interactable }: { interactable: Interactable }) {
  const [x, , z] = interactable.position
  const screenMat = useRef<THREE.MeshStandardMaterial>(null)
  const rocketMat = useRef<THREE.MeshStandardMaterial>(null)
  const flameMat = useRef<THREE.MeshStandardMaterial>(null)
  const phase = useRef(Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase.current
    if (screenMat.current) {
      screenMat.current.emissiveIntensity = 1.4 + Math.sin(t * 3) * 0.6
    }
    if (rocketMat.current) {
      rocketMat.current.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.3
    }
    if (flameMat.current) {
      flameMat.current.emissiveIntensity = 1.2 + Math.sin(t * 12) * 0.8
    }
  })

  return (
    <group position={[x, 0, z]} rotation={[0, interactable.rotationY, 0]}>
      {/* platform base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.4, 1.5, 0.3, 24]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* launch pad ring */}
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 1.1, 32]} />
        <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>

      {/* console cabinet */}
      <mesh position={[0, 0.85, 0.6]}>
        <boxGeometry args={[1.6, 1.1, 0.5]} />
        <meshStandardMaterial color="#12182a" metalness={0.5} roughness={0.45} />
      </mesh>
      {/* main screen */}
      <mesh position={[0, 1.05, 0.87]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[1.1, 0.55]} />
        <meshStandardMaterial
          ref={screenMat}
          color="#0a1020"
          emissive="#19e3ff"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* side accent lights */}
      {[-0.75, 0.75].map((dx) => (
        <mesh key={dx} position={[dx, 0.5, 0.5]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color="#ff2d95" emissive="#ff2d95" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}

      {/* rocket on top of the console, in front so it isn't hidden by the cabinet */}
      <group position={[0, 1.55, 0.95]} renderOrder={10}>
        <mesh position={[0, 0.42, 0]} renderOrder={10}>
          <cylinderGeometry args={[0.1, 0.12, 0.62, 12]} />
          <meshStandardMaterial
            ref={rocketMat}
            color="#e8e8f0"
            emissive="#a0b4ff"
            emissiveIntensity={0.8}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.82, 0]} renderOrder={10}>
          <coneGeometry args={[0.12, 0.26, 12]} />
          <meshStandardMaterial color="#ff4757" emissive="#ff4757" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.06, 0]} renderOrder={10}>
          <coneGeometry args={[0.08, 0.2, 12]} />
          <meshStandardMaterial
            ref={flameMat}
            color="#ff9500"
            emissive="#ff6b00"
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}