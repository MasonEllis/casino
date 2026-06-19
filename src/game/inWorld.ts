import { isCoarsePointer } from './device'
import { useCasino } from './store'

export function isWalkingInWorld() {
  const { activeGame, floorEntered } = useCasino.getState()
  if (activeGame) return false
  return isCoarsePointer() ? floorEntered : document.pointerLockElement !== null
}