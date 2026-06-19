import { Bar } from './Bar'
import { HotdogCart } from './HotdogCart'
import { Mirror } from './Mirror'
import { VendingMachine } from './VendingMachine'

/** Fixed decorative props — positions exported for collision in store. */
export const BAR_POSITION: [number, number, number] = [11, 0, -12.2]
export const BAR_ROTATION_Y = 0

export const HOTDOG_CART_POSITION: [number, number, number] = [-12, 0, 12.2]
/** Face the cart toward the casino center (away from the front wall). */
export const HOTDOG_CART_ROTATION_Y = Math.atan2(-HOTDOG_CART_POSITION[0], -HOTDOG_CART_POSITION[2])

export const VENDING_MACHINE_POSITION: [number, number, number] = [-17.4, 0, 12.6]
/** Nestled in the front-left corner, facing into the floor. */
export const VENDING_MACHINE_ROTATION_Y = Math.atan2(-VENDING_MACHINE_POSITION[0], -VENDING_MACHINE_POSITION[2])

/** Back wall, left side — empty stretch well away from tables, slots, and decor. */
export const MIRROR_POSITION: [number, number, number] = [-15, 0, -13.65]
export const MIRROR_ROTATION_Y = 0

export function SceneDecor() {
  return (
    <>
      <Bar position={BAR_POSITION} rotationY={BAR_ROTATION_Y} />
      <HotdogCart position={HOTDOG_CART_POSITION} rotationY={HOTDOG_CART_ROTATION_Y} />
      <VendingMachine position={VENDING_MACHINE_POSITION} rotationY={VENDING_MACHINE_ROTATION_Y} />
      <Mirror position={MIRROR_POSITION} rotationY={MIRROR_ROTATION_Y} />
    </>
  )
}