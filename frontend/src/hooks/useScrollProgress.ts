import { useState, useEffect, type RefObject } from 'react'

export interface ScrollProgressState {
  progress: number // 0 to 1
  stage: number // 0, 1, 2, 3
  isPinned: boolean
}

export function useScrollProgress(containerRef: RefObject<HTMLElement | null>): ScrollProgressState {
  const [state, setState] = useState<ScrollProgressState>({
    progress: 0,
    stage: 0,
    isPinned: false,
  })

  useEffect(() => {
    let animationFrameId: number | null = null

    const handleScroll = () => {
      if (animationFrameId !== null) return

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const totalScrollableDistance = container.offsetHeight - window.innerHeight

        if (totalScrollableDistance <= 0) {
          setState({ progress: 0, stage: 0, isPinned: false })
          return
        }

        // How far the top of the container has scrolled past the top of the viewport
        const scrolledDistance = -rect.top
        const rawProgress = scrolledDistance / totalScrollableDistance
        const clampedProgress = Math.max(0, Math.min(1, rawProgress))
        const roundedProgress = Math.round(clampedProgress * 100) / 100

        // Determine current thematic stage
        let currentStage = 0
        if (roundedProgress >= 0.7) {
          currentStage = 3
        } else if (roundedProgress >= 0.38) {
          currentStage = 2
        } else if (roundedProgress >= 0.1) {
          currentStage = 1
        }

        const isPinned = rect.top <= 0 && rect.bottom >= window.innerHeight

        setState((prev) => {
          if (
            prev.progress === roundedProgress &&
            prev.stage === currentStage &&
            prev.isPinned === isPinned
          ) {
            return prev
          }
          return {
            progress: roundedProgress,
            stage: currentStage,
            isPinned,
          }
        })
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [containerRef])

  return state
}
