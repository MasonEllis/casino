import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import { isCoarsePointer } from '../../game/device'
import { mobileInput } from '../../game/input'
import { COLLIDERS, INTERACTABLES, ROOM, useCasino } from '../../game/store'

const WALK_SPEED = 4.5
const SPRINT_SPEED = 7.5
const WALL_MARGIN = 1.0
const PLAYER_RADIUS = 0.45
const MOBILE_LOOK_SENSITIVITY = 0.009

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const move = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const euler = new THREE.Euler(0, 0, 0, 'YXZ')

export function Player() {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const controlsRef = useRef<PointerLockControlsImpl>(null)
  const isMobile = useRef(isCoarsePointer())
  const yaw = useRef(0)
  const pitch = useRef(0)

  useEffect(() => {
    camera.position.set(0, ROOM.eyeHeight, 10)
    camera.lookAt(0, ROOM.eyeHeight, -1)
    euler.setFromQuaternion(camera.quaternion, 'YXZ')
    yaw.current = euler.y
    pitch.current = euler.x
  }, [camera])

  useEffect(() => {
    useCasino.setState({
      lockPointer: () => {
        if (!isCoarsePointer()) controlsRef.current?.lock()
      },
    })
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
    if (isMobile.current && !state.floorEntered) return

    if (isMobile.current) {
      yaw.current -= mobileInput.lookX * MOBILE_LOOK_SENSITIVITY
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - mobileInput.lookY * MOBILE_LOOK_SENSITIVITY,
        -1.45,
        1.45,
      )
      euler.set(pitch.current, yaw.current, 0)
      camera.quaternion.setFromEuler(euler)
      mobileInput.lookX = 0
      mobileInput.lookY = 0
    }

    const k = keys.current
    const sprinting =
      k['ShiftLeft'] || k['ShiftRight'] || (isMobile.current && mobileInput.sprint)
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED

    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    right.crossVectors(forward, UP)

    move.set(0, 0, 0)
    if (k['KeyW'] || k['ArrowUp']) move.add(forward)
    if (k['KeyS'] || k['ArrowDown']) move.sub(forward)
    if (k['KeyD'] || k['ArrowRight']) move.add(right)
    if (k['KeyA'] || k['ArrowLeft']) move.sub(right)

    if (isMobile.current) {
      if (Math.abs(mobileInput.moveX) > 0.08 || Math.abs(mobileInput.moveY) > 0.08) {
        move.add(right.clone().multiplyScalar(mobileInput.moveX))
        move.add(forward.clone().multiplyScalar(mobileInput.moveY))
      }
    }

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * Math.min(delta, 0.1))
      camera.position.add(move)
    }

    const maxX = ROOM.halfWidth - WALL_MARGIN
    const maxZ = ROOM.halfDepth - WALL_MARGIN
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -maxX, maxX)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -maxZ, maxZ)
    camera.position.y = ROOM.eyeHeight

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

  if (isMobile.current) return null

  return <PointerLockControls ref={controlsRef} selector="#world" />
}