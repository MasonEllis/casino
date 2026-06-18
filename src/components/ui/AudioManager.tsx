import { useEffect } from 'react'
import { initAudio, resumeAudio, startBackgroundMusic } from '../../game/audio'

export function AudioManager() {
  useEffect(() => {
    initAudio()

    const unlock = () => {
      void resumeAudio().then(() => startBackgroundMusic())
    }

    document.addEventListener('pointerdown', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })

    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  return null
}