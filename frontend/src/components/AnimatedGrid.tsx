import { useRef, useEffect } from 'react'

interface AnimatedGridProps {
  className?: string
  intensity?: 'subtle' | 'moderate'
}

export function AnimatedGrid({ className = '', intensity = 'subtle' }: AnimatedGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Check for fine-pointer device and reduced-motion preferences
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!isFinePointer || isReducedMotion) return

    let rafId: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        container.style.setProperty('--mouse-grid-x', `${x}px`)
        container.style.setProperty('--mouse-grid-y', `${y}px`)
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const opacityClass = intensity === 'subtle' ? 'opacity-35' : 'opacity-60'

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* Base Technical Dot-and-Line Grid */}
      <svg
        className={`w-full h-full ${opacityClass} transition-opacity duration-500`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Grid Pattern with Cross-Intersection Markers */}
          <pattern
            id="invora-tech-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            {/* Fine Grid Lines */}
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(24, 30, 75, 0.06)"
              strokeWidth="0.75"
            />
            {/* Intersection Dot */}
            <circle cx="40" cy="40" r="1.2" fill="rgba(20, 184, 166, 0.25)" />
            <circle cx="0" cy="0" r="1.2" fill="rgba(223, 105, 81, 0.2)" />
          </pattern>

          {/* Ambient Wave Sweep Gradient */}
          <linearGradient id="grid-wave" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="45%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(241, 165, 1, 0.12)" />
            <stop offset="55%" stopColor="rgba(20, 184, 166, 0.18)" />
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#invora-tech-grid)" />
        <rect
          width="100%"
          height="100%"
          fill="url(#grid-wave)"
          className="animate-grid-wave"
          style={{ mixBlendMode: 'multiply' }}
        />
      </svg>

      {/* Interactive Cursor Proximity Highlight (Hardware Accelerated via CSS custom props) */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(circle 280px at var(--mouse-grid-x, -500px) var(--mouse-grid-y, -500px), rgba(20, 184, 166, 0.12) 0%, rgba(241, 165, 1, 0.05) 45%, transparent 70%)',
        }}
      />
    </div>
  )
}
