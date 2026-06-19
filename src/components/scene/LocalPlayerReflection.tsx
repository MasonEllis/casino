import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { isWalkingInWorld } from '../../game/inWorld'
import { useLobby } from '../../game/lobby'
import { MIRROR_REFLECTION_LAYER } from '../../game/mirror'
import { useCasino } from '../../game/store'
import { AVATAR_YAW_OFFSET, PlayerAvatar } from './PlayerAvatar'

const euler = new THREE.Euler(0, 0, 0, 'YXZ')

function applyReflectionLayer(root: THREE.Object3D) {
  root.traverse((obj) => {
    obj.layers.disableAll()
    obj.layers.enable(MIRROR_REFLECTION_LAYER)
  })
}

export function LocalPlayerReflection() {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const displayName = useLobby((s) => s.displayName)
  const name = displayName.trim() || 'You'

  useLayoutEffect(() => {
    const group = groupRef.current
    if (group) applyReflectionLayer(group)
  })

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const { activeEmote } = useCasino.getState()

    if (!isWalkingInWorld() || activeEmote) {
      group.visible = false
      return
    }

    applyReflectionLayer(group)
    group.visible = true

    group.position.set(camera.position.x, camera.position.y - 1.65, camera.position.z)
    euler.setFromQuaternion(camera.quaternion, 'YXZ')
    group.rotation.y = euler.y + AVATAR_YAW_OFFSET
  })

  return (
    <group ref={groupRef} visible={false}>
      <PlayerAvatar name={name} emote={null} emoteStartedAt={0} showName={false} localEmote />
    </group>
  )
}