import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { normalizeEmoteId } from '../../game/emotes'
import { useLobby } from '../../game/lobby'
import { AVATAR_YAW_OFFSET, PlayerAvatar } from './PlayerAvatar'

function RemoteAvatar({
  name,
  x,
  y,
  z,
  yaw,
  emote,
  emoteStartedAt,
}: {
  name: string
  x: number
  y: number
  z: number
  yaw: number
  emote: string | null | undefined
  emoteStartedAt: number | undefined
}) {
  const groupRef = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3(x, y - 1.65, z))
  const targetYaw = useRef(yaw + AVATAR_YAW_OFFSET)

  useEffect(() => {
    targetPos.current.set(x, y - 1.65, z)
    targetYaw.current = yaw + AVATAR_YAW_OFFSET
  }, [x, y, z, yaw])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const blend = 1 - Math.exp(-14 * delta)
    group.position.lerp(targetPos.current, blend)

    let yawDiff = targetYaw.current - group.rotation.y
    yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff))
    group.rotation.y += yawDiff * blend
  })

  return (
    <group ref={groupRef} position={[x, y - 1.65, z]} rotation={[0, yaw + AVATAR_YAW_OFFSET, 0]}>
      <PlayerAvatar
        name={name}
        emote={normalizeEmoteId(emote)}
        emoteStartedAt={emoteStartedAt ?? 0}
      />
    </group>
  )
}

export function RemotePlayers() {
  const playerId = useLobby((s) => s.playerId)
  const players = useLobby((s) => s.players)
  const status = useLobby((s) => s.status)

  if (status !== 'connected') return null

  return (
    <>
      {players
        .filter((p) => p.id !== playerId)
        .map((p) => (
          <RemoteAvatar
            key={p.id}
            name={p.name}
            x={p.x}
            y={p.y}
            z={p.z}
            yaw={p.yaw}
            emote={p.emote}
            emoteStartedAt={p.emoteStartedAt}
          />
        ))}
    </>
  )
}