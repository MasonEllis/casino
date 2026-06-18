import { useEffect, useState } from 'react'
import { isCoarsePointer } from '../game/device'

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(isCoarsePointer)

  useEffect(() => {
    const update = () => setMobile(isCoarsePointer())
    const mq = window.matchMedia('(pointer: coarse)')
    mq.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return mobile
}