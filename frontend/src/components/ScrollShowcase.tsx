import { useState, useEffect, useRef } from 'react'
import {
  PackageCheck,
  ShieldAlert,
  Bot,
  ArrowRight,
  CheckCircle2,
  Lock,
  TrendingDown,
  Sparkles,
} from 'lucide-react'

export function ScrollShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1)
  const [scrollProgress, setScrollProgress] = useState(0)
  const userManuallySelected = useRef(false)
  const manualTimeout = useRef<number | null>(null)

  useEffect(() => {
    let animationFrameId: number | null = null

    const handleScroll = () => {
      if (animationFrameId !== null) return
      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Calculate progress as the section moves across the viewport:
        // 0 when section enters view, 1 when it leaves view
        const totalDistance = rect.height + windowHeight
        const scrolled = windowHeight - rect.top
        const rawProgress = Math.max(0, Math.min(1, scrolled / totalDistance))
        const roundedProgress = Math.round(rawProgress * 100)
        setScrollProgress(roundedProgress)

        // Only auto-update stage if user hasn't manually clicked recently
        if (!userManuallySelected.current) {
          if (rawProgress >= 0.65) {
            setActiveStage(3)
          } else if (rawProgress >= 0.35) {
            setActiveStage(2)
          } else {
            setActiveStage(1)
          }
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSelectStage = (stage: 1 | 2 | 3) => {
    setActiveStage(stage)
    userManuallySelected.current = true
    if (manualTimeout.current) clearTimeout(manualTimeout.current)
    manualTimeout.current = window.setTimeout(() => {
      userManuallySelected.current = false
    }, 4000)
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-white text-[#212832] py-16 sm:py-20 lg:py-24 overflow-x-clip"
      aria-label="Interactive Invora Workflow Showcase"
    >
      {/* Soft Organic Background Decors */}
      <div
        className="hero-blob-bg pointer-events-none absolute -top-24 right-1/4 w-[600px] h-[600px] rounded-full -z-10 opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-10 left-10 w-96 h-96 rounded-full bg-amber-50/50 filter blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col justify-between gap-10">
        
        {/* Top Interactive Stage Stepper Synchronized with Scroll */}
        <div className="w-full z-20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2.5 border border-gray-100 bg-white/80 backdrop-blur-md rounded-2xl px-5 sm:px-6 shadow-xs">
            
            {/* Interactive Stepper Tabs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-sans font-medium">
              <button
                type="button"
                onClick={() => handleSelectStage(1)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeStage === 1
                    ? 'bg-[#FFF1EE] text-[#DF6951] font-bold shadow-xs'
                    : 'text-[#5E6282] hover:text-[#181E4B] hover:bg-gray-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeStage === 1 ? 'bg-[#DF6951]' : 'bg-gray-300'}`} />
                <span className="hidden sm:inline">01.</span> Inbound Induction
              </button>

              <button
                type="button"
                onClick={() => handleSelectStage(2)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeStage === 2
                    ? 'bg-[#E6F8FB] text-[#14B8A6] font-bold shadow-xs'
                    : 'text-[#5E6282] hover:text-[#181E4B] hover:bg-gray-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeStage === 2 ? 'bg-[#14B8A6]' : 'bg-gray-300'}`} />
                <span className="hidden sm:inline">02.</span> Autonomous Transit
              </button>

              <button
                type="button"
                onClick={() => handleSelectStage(3)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeStage === 3
                    ? 'bg-[#FFF8E6] text-[#F1A501] font-bold shadow-xs'
                    : 'text-[#5E6282] hover:text-[#181E4B] hover:bg-gray-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeStage === 3 ? 'bg-[#F1A501]' : 'bg-gray-300'}`} />
                <span className="hidden sm:inline">03.</span> Threshold Sentinel
              </button>
            </div>

            {/* Scroll Progress Metric Synchronized with Viewport */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#5E6282] uppercase tracking-wider font-semibold">
                Scroll Progress
              </span>
              <div className="w-24 sm:w-28 bg-gray-100 h-2 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
                <div
                  className="bg-gradient-to-r from-[#DF6951] via-[#14B8A6] to-[#F1A501] h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${scrollProgress}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-[#181E4B] w-9 text-right">
                {scrollProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Central Stage: Animated Editorial Narrative + Visual Tiles */}
        <div className="w-full flex items-center relative z-10 py-2">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Stage-Dependent Editorial Typography */}
            <div className="lg:col-span-5 flex flex-col justify-center relative min-h-[280px]">
              
              {/* STAGE 1: Inbound Reception Content */}
              <div
                className={`transition-all duration-500 ${
                  activeStage === 1
                    ? 'opacity-100 translate-y-0 relative'
                    : 'opacity-0 -translate-y-4 absolute pointer-events-none'
                }`}
              >
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#DF6951] bg-[#FFF1EE] px-2.5 py-1 rounded-md border border-[#DF6951]/20">
                    STAGE 01 — AUTOMATED INTAKE
                  </span>
                  <Sparkles className="w-4 h-4 text-[#DF6951]" />
                </div>
                <h2 className="font-serif font-bold text-2xl sm:text-4xl lg:text-[42px] text-[#181E4B] leading-[1.18] mb-4">
                  From Receiving Dock to High-Bay in Under 60 Seconds.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#5E6282] leading-relaxed mb-6">
                  Incoming crates are authenticated against supplier POs, assigned batch tags, and routed
                  to designated rack slots with zero manual register delays or misplaced inventory.
                </p>

                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#181E4B] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                    Zero Negative Stock
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#181E4B] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
                    <PackageCheck className="w-3.5 h-3.5 text-[#DF6951]" />
                    Instant Batch Receipts
                  </span>
                </div>
              </div>

              {/* STAGE 2: Autonomous Transit Content */}
              <div
                className={`transition-all duration-500 ${
                  activeStage === 2
                    ? 'opacity-100 translate-y-0 relative'
                    : 'opacity-0 translate-y-4 absolute pointer-events-none'
                }`}
              >
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#14B8A6] bg-[#E6F8FB] px-2.5 py-1 rounded-md border border-[#14B8A6]/20">
                    STAGE 02 — FLEET MOBILITY
                  </span>
                  <Bot className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <h2 className="font-serif font-bold text-2xl sm:text-4xl lg:text-[42px] text-[#181E4B] leading-[1.18] mb-4">
                  Autonomous Fleet Routing with Zero Concurrency Conflicts.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#5E6282] leading-relaxed mb-6">
                  High-volume multi-operator facilities rely on pessimistic database locking. Multiple pickers
                  can operate concurrently without double-dispatching the same pallet.
                </p>

                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#181E4B] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
                    <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                    Pessimistic DB Locks
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#181E4B] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
                    <Bot className="w-3.5 h-3.5 text-[#F1A501]" />
                    Optimized Transit Paths
                  </span>
                </div>
              </div>

              {/* STAGE 3: Predictive Threshold Sentinel Content */}
              <div
                className={`transition-all duration-500 ${
                  activeStage === 3
                    ? 'opacity-100 translate-y-0 relative'
                    : 'opacity-0 translate-y-4 absolute pointer-events-none'
                }`}
              >
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#DF6951] bg-[#FFF1EE] px-2.5 py-1 rounded-md border border-[#DF6951]/20">
                    STAGE 03 — EARLY WARNING ENGINE
                  </span>
                  <ShieldAlert className="w-4 h-4 text-[#DF6951]" />
                </div>
                <h2 className="font-serif font-bold text-2xl sm:text-4xl lg:text-[42px] text-[#181E4B] leading-[1.18] mb-4">
                  Pre-emptive Depletion Intelligence That Prevents Stockouts.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#5E6282] leading-relaxed mb-6">
                  Invora continuously analyzes rolling outflow rates against minimum thresholds. When stock
                  nears critical limits, automated warnings alert procurement before stock drops to zero.
                </p>

                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#181E4B] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
                    <TrendingDown className="w-3.5 h-3.5 text-[#DF6951]" />
                    Stockout Depletion Math
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#181E4B] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#F1A501]" />
                    Real-Time SSE Broadcasts
                  </span>
                </div>
              </div>

            </div>

            {/* Right Column: Visual Tiles & Dynamic Telemetry Badges */}
            <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[420px] lg:min-h-[460px] w-full flex items-center justify-center">
              
              {/* COMPOSITION 1 TILES (Inbound & Smart Racking) */}
              <div
                className={`w-full transition-all duration-600 ease-out flex items-center justify-center ${
                  activeStage === 1 ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute pointer-events-none'
                }`}
              >
                <div className="relative w-full max-w-[530px] aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white p-2.5 sm:p-3">
                  <img
                    src="/assets/smart-racking.jpg"
                    alt="Smart High-Bay Storage Rack with automated lift"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  
                  {/* Floating Telemetry Pill */}
                  <div className="absolute top-5 right-5 bg-[#181E4B]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                    <span>Vertical Crane #04: Active</span>
                  </div>

                  {/* Contextual Floating Badge */}
                  <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF1EE] text-[#DF6951] flex items-center justify-center font-bold">
                      <PackageCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#181E4B]">+1,280 Units Handled</div>
                      <div className="text-[10px] text-[#5E6282]">Throughput Rate: 99.9%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPOSITION 2 TILES (Autonomous AGV Fleet & Concurrency) */}
              <div
                className={`w-full transition-all duration-600 ease-out flex items-center justify-center ${
                  activeStage === 2 ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute pointer-events-none'
                }`}
              >
                <div className="relative w-full max-w-[530px] aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white p-2.5 sm:p-3">
                  <img
                    src="/assets/agv-fleet.jpg"
                    alt="AGV autonomous robotics operating in warehouse"
                    className="w-full h-full object-cover rounded-2xl"
                  />

                  {/* Navigation Path Badge */}
                  <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-mono font-semibold text-[#181E4B] shadow-md border border-gray-100">
                    <div className="flex items-center gap-1.5 text-[#14B8A6]">
                      <Bot className="w-3.5 h-3.5" />
                      <span>AGV-02 · Routing Optimal</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Speed: 1.8 m/s · Payload: 350kg</div>
                  </div>

                  {/* Concurrency Lock Badge */}
                  <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 bg-[#181E4B]/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-700">
                    <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/20 text-[#14B8A6] flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono text-[#14B8A6] font-bold">PESSIMISTIC LOCK: ACTIVE</div>
                      <div className="text-[10px] text-gray-300">Transaction ID: #TX-99214</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPOSITION 3 TILES (Threshold Warning Sentinel) */}
              <div
                className={`w-full transition-all duration-600 ease-out flex items-center justify-center ${
                  activeStage === 3 ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute pointer-events-none'
                }`}
              >
                <div className="relative w-full max-w-[530px] aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-white p-2.5 sm:p-3">
                  <img
                    src="/assets/hero-warehouse.jpg"
                    alt="Warehouse digital twin control overview"
                    className="w-full h-full object-cover rounded-2xl brightness-95"
                  />

                  {/* Prominent Floating Warning Sentinel Card */}
                  <div className="absolute inset-x-4 sm:inset-x-6 bottom-4 sm:bottom-6 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-[#DF6951]/20">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold tracking-wider text-[#DF6951] bg-[#FFF1EE] px-2.5 py-0.5 rounded-md border border-[#DF6951]/20 uppercase">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#DF6951]" />
                        CRITICAL THRESHOLD TRIGGERED
                      </span>
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-[#181E4B]">
                        Rack B-04
                      </span>
                    </div>

                    <div className="space-y-1 my-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#181E4B]">
                        <span className="truncate pr-2">Precision Sensor Component (SKU-4912)</span>
                        <span className="text-[#DF6951] shrink-0">28 / 100 Units</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#DF6951] h-2 rounded-full w-[28%]" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[11px] sm:text-xs">
                      <span className="text-[#5E6282] flex items-center gap-1 font-medium">
                        <TrendingDown className="w-3 h-3 text-[#DF6951]" />
                        Depletion: <strong className="text-[#DF6951]">1.2 Days</strong>
                      </span>
                      <span className="text-xs font-semibold text-[#14B8A6] flex items-center gap-1">
                        <span>PO Draft Generated</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Bottom Phase Indicator Bar */}
        <div className="w-full z-20 pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#5E6282]">
          <span className="font-mono">
            {activeStage === 1
              ? 'Phase 1 of 3: Receiving Dock & High-Bay Intake'
              : activeStage === 2
              ? 'Phase 2 of 3: Autonomous Fleet Routing & Concurrency'
              : 'Phase 3 of 3: Predictive Stock Depletion Sentinel'}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
            <span className="font-medium text-[#181E4B]">Pipeline Active &amp; Continuous</span>
          </div>
        </div>

      </div>
    </section>
  )
}
