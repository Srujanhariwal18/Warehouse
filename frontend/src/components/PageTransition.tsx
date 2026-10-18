import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    // Scroll to top instantly on route change
    window.scrollTo({ top: 0, behavior: 'instant' })

    // Trigger brief route transition indicator
    setTransitioning(true)
    const timer = setTimeout(() => {
      setTransitioning(false)
    }, 450)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between">
      {/* Top Route Transition Bar */}
      {transitioning && (
        <div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DF6951] via-[#14B8A6] to-[#F1A501] z-[100] animate-route-bar pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Page Content with Entrance Transition */}
      <div key={location.pathname} className="w-full flex-1 animate-page-enter">
        {children}
      </div>
    </div>
  )
}
