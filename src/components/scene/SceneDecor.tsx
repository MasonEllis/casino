import { Bar } from './Bar'
import { HotdogCart } from './HotdogCart'

/** Fixed decorative props — positions exported for collision in store. */
export const BAR_POSITION: [number, number, number] = [11, 0, -12.2]
export const BAR_ROTATION_Y = 0

export const HOTDOG_CART_POSITION: [number, number, number] = [-12, 0, 12.2]
/** Face the cart toward the casino center (away from the front wall). */
export const HOTDOG_CART_ROTATION_Y = Math.atan2(-HOTDOG_CART_POSITION[0], -HOTDOG_CART_POSITION[2])

export function SceneDecor() {
  return (
    <>
      <Bar position={BAR_POSITION} rotationY={BAR_ROTATION_Y} />
      <HotdogCart position={HOTDOG_CART_POSITION} rotationY={HOTDOG_CART_ROTATION_Y} />
    </>
  )
}