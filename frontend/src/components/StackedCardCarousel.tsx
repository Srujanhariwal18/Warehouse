import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Box,
  Bot,
  AlertTriangle,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnimatedGrid } from './AnimatedGrid'
import { TiltCard } from './TiltCard'
import { ScrollHeadingReveal, ParagraphReveal } from './AnimatedText'

export interface CarouselSlide {
  id: string
  title: string
  subtitle: string
  category: string
  description: string
  image: string
  badge: {
    label: string
    color: string
    icon: typeof PackageCheck
  }
  metric: {
    label: string
    value: string
  }
  routeLink: string
  actionLabel: string
}

export function StackedCardCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const mouseStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Interaction & Autoplay State Refs
  const isInteractingRef = useRef(false)
  const isHoveredRef = useRef(false)
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idleDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const slides: CarouselSlide[] = [
    {
      id: 'slide-dock',
      title: 'Inbound Dock & Intake Telemetry',
      subtitle: 'Zero Discrepancy Receiving Dock',
      category: 'LOGISTICS & INTAKE',
      description:
        'Instant multi-point barcode scanning and purchase order verification. Incoming cargo is slotted directly to designated high-bay rack coordinates.',
      image: '/assets/dispatch-dock.jpg',
      badge: {
        label: 'INTAKE VERIFIED',
        color: 'text-[#DF6951] bg-[#FFF1EE] border-[#DF6951]/20',
        icon: PackageCheck,
      },
      metric: { label: 'Dock Verification Rate', value: '1.4s / Pallet' },
      routeLink: '/operations',
      actionLabel: 'Explore Dock Operations',
    },
    {
      id: 'slide-racks',
      title: 'Smart High-Bay Storage Topology',
      subtitle: 'Zone-Level Spatial Telemetry',
      category: 'FACILITY TOPOLOGY',
      description:
        'Vertical lift integration with multi-tier capacity sensors. Live occupancy tracking ensures no bay exceeds safety limits or misplaces batch lots.',
      image: '/assets/smart-racking.jpg',
      badge: {
        label: 'RACK TELEMETRY ACTIVE',
        color: 'text-[#14B8A6] bg-[#E6F8FB] border-[#14B8A6]/20',
        icon: Box,
      },
      metric: { label: 'Space Utilization', value: '88.4% Optimal' },
      routeLink: '/warehouses',
      actionLabel: 'View Warehouse Topology',
    },
    {
      id: 'slide-agv',
      title: 'Autonomous AGV Fleet Routing',
      subtitle: 'Pessimistic Concurrency Protection',
      category: 'ROBOTICS & TRANSIT',
      description:
        'Sub-millisecond database locking coordinates autonomous floor robots. Eliminates multi-picker collisions and duplicate dispatch events.',
      image: '/assets/agv-fleet.jpg',
      badge: {
        label: 'FLEET SYNCHRONIZED',
        color: 'text-[#F1A501] bg-[#FFF8E6] border-[#F1A501]/30',
        icon: Bot,
      },
      metric: { label: 'Lock Contention', value: '0.00% Zero Drift' },
      routeLink: '/operations',
      actionLabel: 'Review AGV Concurrency',
    },
    {
      id: 'slide-thresholds',
      title: 'Predictive Threshold Sentinel',
      subtitle: 'Rolling Outflow Depletion Modeling',
      category: 'EARLY WARNING ENGINE',
      description:
        'Continuous analysis of daily consumption velocity against safety thresholds. Automatic warnings notify procurement before stock dips to zero.',
      image: '/assets/hero-warehouse.jpg',
      badge: {
        label: 'PREDICTIVE MONITORING',
        color: 'text-[#DF6951] bg-[#FFF1EE] border-[#DF6951]/20',
        icon: AlertTriangle,
      },
      metric: { label: 'Warning Lead Time', value: '3.4 Days Avg' },
      routeLink: '/thresholds',
      actionLabel: 'Inspect Depletion Math',
    },
    {
      id: 'slide-audit',
      title: 'Cryptographic Audit Governance',
      subtitle: 'Immutable Regulatory Compliance',
      category: 'COMPLIANCE & AUDIT',
      description:
        'Tamper-evident operational logging of every movement, user credential, and timestamp. Built-in compliance reporting for high-governance industries.',
      image: '/assets/audit-ledger.jpg',
      badge: {
        label: 'AUDIT READY',
        color: 'text-[#181E4B] bg-gray-100 border-gray-200',
        icon: FileText,
      },
      metric: { label: 'Ledger Immutability', value: '100% Certified' },
      routeLink: '/operations',
      actionLabel: 'Inspect Ledger Records',
    },
  ]

  const total = slides.length

  // Clear timers safely
  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
  }, [])

  const clearIdleTimer = useCallback(() => {
    if (idleDelayTimerRef.current) {
      clearTimeout(idleDelayTimerRef.current)
      idleDelayTimerRef.current = null
    }
  }, [])

  // Start continuous slow autoplay (5.5s interval)
  const startAutoplay = useCallback(() => {
    clearAutoplayTimer()
    if (isHoveredRef.current || isInteractingRef.current || (typeof document !== 'undefined' && document.hidden)) {
      return
    }
    autoplayTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total)
    }, 5500)
  }, [clearAutoplayTimer, total])

  // Trigger user interaction: pause immediately, stay stable, resume after 5s idle
  const handleUserInteraction = useCallback(
    (action?: () => void) => {
      clearAutoplayTimer()
      clearIdleTimer()
      isInteractingRef.current = true

      if (action) {
        action()
      }
      setDragOffset(0)

      // 4-6s idle delay (configured to 5.0 seconds)
      idleDelayTimerRef.current = setTimeout(() => {
        isInteractingRef.current = false
        if (!isHoveredRef.current) {
          startAutoplay()
        }
      }, 5000)
    },
    [clearAutoplayTimer, clearIdleTimer, startAutoplay]
  )

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e?.currentTarget) (e.currentTarget as HTMLElement).blur()
    handleUserInteraction(() => {
      setActiveIndex((prev) => (prev + 1) % total)
    })
  }, [handleUserInteraction, total])

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e?.currentTarget) (e.currentTarget as HTMLElement).blur()
    handleUserInteraction(() => {
      setActiveIndex((prev) => (prev - 1 + total) % total)
    })
  }, [handleUserInteraction, total])

  const handleDotClick = useCallback(
    (idx: number, e?: React.MouseEvent) => {
      if (e?.currentTarget) (e.currentTarget as HTMLElement).blur()
      handleUserInteraction(() => {
        setActiveIndex(idx)
      })
    },
    [handleUserInteraction]
  )

  // Window resize detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Visibility change listener & Autoplay Lifecycle
  useEffect(() => {
    startAutoplay()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearAutoplayTimer()
      } else if (!isInteractingRef.current && !isHoveredRef.current) {
        startAutoplay()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearAutoplayTimer()
      clearIdleTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startAutoplay, clearAutoplayTimer, clearIdleTimer])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }
    const container = containerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev])

  // Touch Drag Interaction
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsDragging(true)
    handleUserInteraction()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const currentX = e.touches[0].clientX
    const delta = currentX - touchStartX.current
    setDragOffset(Math.max(-80, Math.min(80, delta)))
  }

  const handleTouchEnd = () => {
    if (dragOffset < -40) {
      handleNext()
    } else if (dragOffset > 40) {
      handlePrev()
    } else {
      setDragOffset(0)
    }
    touchStartX.current = null
    setIsDragging(false)
  }

  // Mouse Drag Interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX
    setIsDragging(true)
    handleUserInteraction()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStartX.current === null || !isDragging) return
    const delta = e.clientX - mouseStartX.current
    setDragOffset(Math.max(-100, Math.min(100, delta)))
  }

  const handleMouseUp = () => {
    if (dragOffset < -45) {
      handleNext()
    } else if (dragOffset > 45) {
      handlePrev()
    } else {
      setDragOffset(0)
    }
    mouseStartX.current = null
    setIsDragging(false)
  }

  const handleCardMouseEnter = () => {
    isHoveredRef.current = true
    clearAutoplayTimer()
  }

  const handleCardMouseLeave = () => {
    if (isDragging) {
      handleMouseUp()
    }
    isHoveredRef.current = false
    if (!isInteractingRef.current) {
      startAutoplay()
    }
  }

  return (
    <section
      id="carousel"
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Invora Five Operational Pillars Showcase"
      className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-[#FCFDFE] to-white focus:outline-none overflow-x-clip"
    >
      {/* Animated Technical Grid in Background */}
      <AnimatedGrid intensity="subtle" />

      {/* Decorative Soft Warm Amber Glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#FFF8E6]/60 filter blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header: Visible, Balanced Spacing matching reference */}
        <ScrollHeadingReveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 lg:mb-14">
          <div>
            <div className="inline-flex items-center gap-2 mb-2.5">
              <span className="text-xs font-mono font-bold tracking-widest text-[#DF6951] uppercase">
                FEATURE SHOWCASE &amp; TOPOLOGY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#DF6951]" />
            </div>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-[44px] text-[#181E4B] leading-tight">
              Intelligent Warehousing in Motion
            </h2>
            <ParagraphReveal delay={150} className="text-sm sm:text-base text-[#5E6282] mt-2.5 max-w-xl leading-relaxed">
              Explore the five operational pillars powering Invora's real-time inventory precision.
            </ParagraphReveal>
          </div>

          {/* Carousel Arrows & Counter */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs font-mono text-[#5E6282] font-semibold mr-1">
              <strong className="text-[#181E4B] text-sm">0{activeIndex + 1}</strong> / 0{total}
            </span>

            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-[#181E4B] flex items-center justify-center shadow-xs transition hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#DF6951] cursor-pointer"
              aria-label="Previous showcase slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-gray-200 bg-[#181E4B] hover:bg-[#283272] text-white flex items-center justify-center shadow-xs transition hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#DF6951] cursor-pointer"
              aria-label="Next showcase slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </ScrollHeadingReveal>

        {/* The Stacked-Card Stage Container with Live Drag Tracking */}
        <div
          className={`relative min-h-[520px] sm:min-h-[550px] lg:min-h-[570px] w-full flex items-center justify-center select-none py-4 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {slides.map((slide, index) => {
            // Compute circular offset relative to activeIndex
            let offset = index - activeIndex
            if (offset > total / 2) offset -= total
            if (offset < -total / 2) offset += total

            const isActive = offset === 0
            const isPrev = offset === -1
            const isNext = offset === 1
            const isFar = Math.abs(offset) >= 2

            // Desktop vs Mobile Transform Geometry:
            let translateX = '0%'
            let rotate = '0deg'
            let scale = 1
            let zIndex = 30
            let opacity = 1
            let transitionStyle = isDragging
              ? 'transform 75ms linear'
              : isFar
              ? 'none' // Do NOT animate far cards across the screen to prevent jumps!
              : 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms cubic-bezier(0.22, 1, 0.36, 1)'

            if (isMobile) {
              if (isActive) {
                translateX = `${dragOffset}px`
                rotate = `${(dragOffset * 0.04).toFixed(1)}deg`
                scale = 1
                zIndex = 30
                opacity = 1
              } else {
                translateX = offset > 0 ? '100%' : '-100%'
                rotate = '0deg'
                scale = 0.95
                zIndex = 10
                opacity = 0
              }
            } else {
              if (isActive) {
                translateX = `${dragOffset}px`
                rotate = `${(dragOffset * 0.02).toFixed(1)}deg`
                scale = 1
                zIndex = 30
                opacity = 1
              } else if (isPrev) {
                translateX = `calc(-58% + ${(dragOffset * 0.4).toFixed(1)}px)`
                rotate = '-2deg'
                scale = 0.88
                zIndex = 20
                opacity = 0.55
              } else if (isNext) {
                translateX = `calc(58% + ${(dragOffset * 0.4).toFixed(1)}px)`
                rotate = '2deg'
                scale = 0.88
                zIndex = 20
                opacity = 0.55
              } else {
                translateX = offset > 0 ? '110%' : '-110%'
                rotate = '0deg'
                scale = 0.78
                zIndex = 10
                opacity = 0
              }
            }

            const BadgeIcon = slide.badge.icon

            return (
              <div
                key={slide.id}
                onClick={(e) => {
                  if (!isActive && Math.abs(dragOffset) < 10) {
                    handleDotClick(index, e)
                  }
                }}
                className={`absolute w-full max-w-[340px] sm:max-w-[460px] lg:max-w-[500px] ${
                  isActive ? 'cursor-default' : 'cursor-pointer hover:opacity-85'
                }`}
                style={{
                  transform: `translateX(${translateX}) scale(${scale}) rotate(${rotate})`,
                  zIndex,
                  opacity,
                  transition: transitionStyle,
                  pointerEvents: isFar || (isMobile && !isActive) ? 'none' : 'auto',
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${slide.title} (${index + 1} of ${total})`}
                aria-hidden={!isActive}
              >
                <TiltCard maxTilt={isActive && !isMobile && !isDragging ? 3 : 0}>
                  <div
                    className={`relative rounded-3xl overflow-hidden bg-white border border-gray-100 p-5 sm:p-6 flex flex-col justify-between min-h-[480px] sm:min-h-[510px] transition-shadow duration-300 ${
                      isActive ? 'shadow-2xl ring-1 ring-black/5' : 'shadow-lg'
                    }`}
                  >
                    {/* Top Image Frame with consistent aspect ratio */}
                    <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden bg-[#F8FAFC] border border-gray-100 group shrink-0">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        draggable={false}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out select-none"
                        loading={isActive ? 'eager' : 'lazy'}
                      />

                      {/* Top Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md border shadow-xs ${slide.badge.color}`}
                        >
                          <BadgeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>{slide.badge.label}</span>
                        </span>
                      </div>

                      {/* Right Telemetry Pill */}
                      <div className="absolute bottom-3 right-3 bg-[#181E4B]/90 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-mono px-2.5 sm:px-3 py-1 rounded-full shadow-sm">
                        {slide.metric.label}: <strong className="text-[#14B8A6]">{slide.metric.value}</strong>
                      </div>
                    </div>

                    {/* Bottom Content Body */}
                    <div className="pt-4 flex flex-col justify-between flex-1">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#DF6951] uppercase tracking-widest block mb-1">
                          {slide.category}
                        </span>
                        <h3 className="font-serif font-bold text-lg sm:text-[22px] text-[#181E4B] leading-snug">
                          {slide.title}
                        </h3>
                        <p className="font-sans text-xs sm:text-sm text-[#5E6282] line-clamp-2 mt-2 leading-relaxed">
                          {slide.description}
                        </p>
                      </div>

                      {/* Action Link: Clear, Prominent & Accessible */}
                      <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs mt-4">
                        <span className="text-gray-400 font-mono text-[11px]">Invora Core Module</span>
                        <Link
                          to={slide.routeLink}
                          tabIndex={isActive ? 0 : -1}
                          className="font-semibold text-[#DF6951] hover:text-[#c44f38] flex items-center gap-1.5 group/btn cursor-pointer py-1"
                        >
                          <span>{slide.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </div>
            )
          })}
        </div>

        {/* Bottom Pagination Dots: Fully Visible with Sizable Touch Targets */}
        <div className="flex items-center justify-center gap-2.5 mt-8 lg:mt-12">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#DF6951] cursor-pointer ${
                idx === activeIndex
                  ? 'w-9 bg-[#DF6951]'
                  : 'w-2.5 bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label={`Jump to slide ${idx + 1}: ${slide.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
