/** Shared mobile touch input read each frame by the player controller. */
export const mobileInput = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  sprint: false,
}

export function resetMobileInput(): void {
  mobileInput.moveX = 0
  mobileInput.moveY = 0
  mobileInput.lookX = 0
  mobileInput.lookY = 0
  mobileInput.sprint = false
}