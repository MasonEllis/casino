import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import { COLLIDERS, INTERACTABLES, ROOM, useCasino } from '../../game/store'

const WALK_SPEED = 4.5
const SPRINT_SPEED = 7.5
const WALL_MARGIN = 1.0
const PLAYER_RADIUS = 0.45

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const move = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

export function Player() {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const controlsRef = useRef<PointerLockControlsImpl>(null)

  useEffect(() => {
    camera.position.set(0, ROOM.eyeHeight, 10)
    camera.lookAt(0, ROOM.eyeHeight, -1)
  }, [camera])

  // let overlays re-lock the pointer from their own click handlers
  useEffect(() => {
    useCasino.setState({ lockPointer: () => controlsRef.current?.lock() })
    return () => useCasino.setState({ lockPointer: () => {} })
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true
      if (e.code === 'KeyE') {
        const { nearby, activeGame, openGame } = useCasino.getState()
        if (nearby && !activeGame) {
          openGame(nearby)
          document.exitPointerLock()
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame((_, delta) => {
    const state = useCasino.getState()
    if (state.activeGame) return

    const k = keys.current
    const speed = k['ShiftLeft'] || k['ShiftRight'] ? SPRINT_SPEED : WALK_SPEED

    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, UP)

    move.set(0, 0, 0)
    if (k['KeyW'] || k['ArrowUp']) move.add(forward)
    if (k['KeyS'] || k['ArrowDown']) move.sub(forward)
    if (k['KeyD'] || k['ArrowRight']) move.add(right)
    if (k['KeyA'] || k['ArrowLeft']) move.sub(right)

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * Math.min(delta, 0.1))
      camera.position.add(move)
    }

    // wall clamp
    const maxX = ROOM.halfWidth - WALL_MARGIN
    const maxZ = ROOM.halfDepth - WALL_MARGIN
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -maxX, maxX)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -maxZ, maxZ)
    camera.position.y = ROOM.eyeHeight

    // push out of obstacle circles
    for (const c of COLLIDERS) {
      const dx = camera.position.x - c.x
      const dz = camera.position.z - c.z
      const minDist = c.r + PLAYER_RADIUS
      const distSq = dx * dx + dz * dz
      if (distSq < minDist * minDist && distSq > 1e-6) {
        const dist = Math.sqrt(distSq)
        camera.position.x = c.x + (dx / dist) * minDist
        camera.position.z = c.z + (dz / dist) * minDist
      }
    }

    // proximity detection for interactables
    let closest = null
    let closestDist = Infinity
    for (const i of INTERACTABLES) {
      const dx = camera.position.x - i.position[0]
      const dz = camera.position.z - i.position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < i.interactRadius && dist < closestDist) {
        closest = i
        closestDist = dist
      }
    }
    if (state.nearby?.id !== closest?.id) {
      state.setNearby(closest)
    }
  })

  // The selector restricts drei's lock-on-click handler to the 3D viewport
  // wrapper, so clicks inside game overlays never re-lock the pointer.
  return <PointerLockControls ref={controlsRef} selector="#world" />
}
