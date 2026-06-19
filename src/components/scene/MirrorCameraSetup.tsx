import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { MIRROR_REFLECTION_LAYER } from '../../game/mirror'

/** Keep the reflection-only avatar layer off the main first-person camera. */
export function MirrorCameraSetup() {
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    camera.layers.disable(MIRROR_REFLECTION_LAYER)
  }, [camera])

  return null
}