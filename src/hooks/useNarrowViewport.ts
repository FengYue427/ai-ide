import { useEffect, useState } from 'react'

/** Unified narrow breakpoint (see responsive.css). */
export const NARROW_BREAKPOINT_PX = 720

export function useNarrowViewport(breakpoint = NARROW_BREAKPOINT_PX): boolean {
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setNarrow(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [breakpoint])

  return narrow
}
