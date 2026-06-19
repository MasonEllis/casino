import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { emoteProgress } from '../../game/emotes'
import { isWalkingInWorld } from '../../game/inWorld'
import { useLobby } from '../../game/lobby'
import { useCasino } from '../../game/store'
import { AVATAR_YAW_OFFSET, PlayerAvatar } from './PlayerAvatar'

const euler = new THREE.Euler(0, 0, 0, 'YXZ')

export function LocalPlayerEmote() {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const displayName = useLobby((s) => s.displayName)
  const name = displayName.trim() || 'You'

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const { activeEmote } = useCasino.getState()

    if (!isWalkingInWorld() || !activeEmote) {
      group.visible = false
      return
    }

    const progress = emoteProgress(activeEmote.type, activeEmote.startedAt)
    if (progress === null) {
      group.visible = false
      return
    }

    group.visible = true
    const bounce =
      activeEmote.type === 'thumbsup' ? Math.sin(progress * Math.PI * 3) * 0.25 : 0
    group.position.set(camera.position.x, camera.position.y - 1.65 + bounce, camera.position.z)
    euler.setFromQuaternion(camera.quaternion, 'YXZ')
    group.rotation.y = euler.y + AVATAR_YAW_OFFSET
  })

  return (
    <group ref={groupRef}>
      <PlayerAvatar name={name} emote={null} emoteStartedAt={0} showName={false} localEmote />
    </group>
  )
}