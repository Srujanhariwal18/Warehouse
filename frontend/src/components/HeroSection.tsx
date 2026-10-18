import { useState, useEffect } from 'react'
import {
  Play,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  Database,
} from 'lucide-react'
import { VideoModal } from './VideoModal'
import { AnimatedGrid } from './AnimatedGrid'
import { TiltCard } from './TiltCard'
import { MagneticButton } from './MagneticButton'
import { CharacterReveal, ParagraphReveal, AnimatedNumber } from './AnimatedText'
import { invoraApi, BackendInventory, BackendAlert } from '../services/api'

export function HeroSection() {
  const [modalOpen, setModalOpen] = useState(false)
  
  // Real live inventory & threshold telemetry state
  const [liveStock, setLiveStock] = useState<{
    sku: string
    name: string
    quantity: number
    rack: string
  }>({
    sku: 'SKU-BOLT-M10',
    name: 'Industrial Hex Bolt M10',
    quantity: 170,
    rack: 'RA1',
  })

  const [liveAlert, setLiveAlert] = useState<{
    sku: string
    name: string
    currentStock: number
    threshold: number
    severity: string
    percent: number
  }>({
    sku: 'SKU-FLANGE-04',
    name: 'Pipe Flange 4-inch',
    currentStock: 8,
    threshold: 15,
    severity: 'WARNING',
    percent: Math.round((8 / 15) * 100),
  })

  useEffect(() => {
    let isMounted = true

    async function loadTelemetry() {
      try {
        const inv = await invoraApi.getAllInventory()
        if (isMounted && inv && inv.length > 0) {
          // Find an active inventory lot
          const activeItem = inv.find((item: BackendInventory) => item.quantity > 0) || inv[0]
          setLiveStock({
            sku: activeItem.productSku,
            name: activeItem.productName,
            quantity: activeItem.quantity,
            rack: activeItem.rackCode || 'RA1',
          })
        }

        const alertsRes = await invoraApi.getAlerts('ACTIVE')
        const alertList: BackendAlert[] = Array.isArray(alertsRes) ? alertsRes : alertsRes?.content || []
        if (isMounted && alertList.length > 0) {
          const topAlert = alertList[0]
          const pct = topAlert.threshold > 0 ? Math.round((topAlert.currentStock / topAlert.threshold) * 100) : 0
          setLiveAlert({
            sku: topAlert.productSku,
            name: topAlert.productName,
            currentStock: topAlert.currentStock,
            threshold: topAlert.threshold,
            severity: topAlert.severity,
            percent: Math.min(100, pct),
          })
        }
      } catch {
        // Fallback to initial seed values if offline
      }
    }

    loadTelemetry()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Animated Technical Grid Background */}
      <AnimatedGrid intensity="subtle" />

      {/* Background Soft Organic Decors (Jadoo-style warm apricot top-right wash) */}
      <div
        className="hero-blob-bg pointer-events-none absolute -top-20 -right-24 sm:-right-12 w-[550px] sm:w-[700px] lg:w-[850px] h-[550px] sm:h-[700px] lg:h-[850px] rounded-full -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Headline, Copy, Dual CTAs */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start z-10">
            {/* Small Eyebrow Label with Character Reveal */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-[#DF6951] font-bold text-xs sm:text-sm tracking-wider uppercase font-sans">
                <CharacterReveal text="INTELLIGENT WAREHOUSE & STOCK CONTROL" startDelay={60} charStagger={16} />
              </span>
              <span className="w-2 h-2 rounded-full bg-[#DF6951] animate-ping" />
            </div>

            {/* Large Editorial Headline with Staggered Word Reveal */}
            <h1
              className="font-serif font-bold text-3xl sm:text-5xl lg:text-[54px] xl:text-[62px] leading-[1.14] tracking-tight text-[#181E4B] mb-6"
              aria-label="Track, optimize & control warehouse stock with real-time precision."
            >
              <span aria-hidden="true">
                <span className="block">
                  <span className="text-reveal-mask mr-[0.26em]">
                    <span className="text-reveal-word" style={{ animationDelay: '100ms' }}>Track,</span>
                  </span>
                  <span className="text-reveal-mask mr-[0.26em]">
                    <span className="text-reveal-word" style={{ animationDelay: '150ms' }}>optimize</span>
                  </span>
                  <span className="text-reveal-mask mr-[0.26em]">
                    <span className="text-reveal-word" style={{ animationDelay: '200ms' }}>&amp;</span>
                  </span>
                  <span className="text-reveal-mask">
                    <span className="text-reveal-word" style={{ animationDelay: '250ms' }}>control</span>
                  </span>
                </span>
                <span className="block">
                  <span className="text-reveal-mask mr-[0.26em]">
                    <span className="text-reveal-word" style={{ animationDelay: '300ms' }}>warehouse</span>
                  </span>
                  <span className="text-reveal-mask mr-[0.26em]">
                    <span className="text-reveal-word" style={{ animationDelay: '350ms' }}>stock</span>
                  </span>
                  <span className="text-reveal-mask mr-[0.26em]">
                    <span className="text-reveal-word" style={{ animationDelay: '400ms' }}>with</span>
                  </span>
                  <span className="text-reveal-mask">
                    <span className="text-reveal-word" style={{ animationDelay: '460ms' }}>
                      <span className="curved-underline text-[#181E4B]">
                        real-time precision.
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </h1>

            {/* Short Supporting Description with Gentle Fade-Up Reveal */}
            <ParagraphReveal delay={520} className="font-sans text-[15px] sm:text-[17px] leading-[1.7] text-[#5E6282] max-w-lg mb-8">
              Invora unifies stock IN/OUT transactions, rack-level telemetry, and automated threshold alerts
              into one centralized control center. Eliminate manual registers and prevent costly stockouts.
            </ParagraphReveal>

            {/* Dual CTAs: Fade-up with Slight Delay */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-8 text-fade-up" style={{ animationDelay: '620ms' }}>
              {/* Primary Action Magnetic Button */}
              <MagneticButton href="#capabilities" strength={8}>
                <span className="bg-[#F1A501] hover:bg-[#df9900] active:scale-95 text-white font-sans font-semibold text-[15px] sm:text-[16px] px-8 py-4 rounded-xl shadow-amber-button hover:shadow-lg transition-all duration-200 flex items-center gap-2 group cursor-pointer">
                  <span>Explore Features</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </MagneticButton>

              {/* Secondary Play Demo Action */}
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="group flex items-center gap-3.5 focus:outline-none focus:ring-2 focus:ring-[#DF6951] rounded-2xl p-1 cursor-pointer"
                aria-label="Watch Invora workflow preview video"
              >
                <div className="w-[50px] h-[50px] rounded-full bg-[#DF6951] group-hover:bg-[#c94f38] text-white flex items-center justify-center shadow-coral-button group-hover:scale-105 transition-all duration-200">
                  <Play className="w-5 h-5 fill-white translate-x-0.5" />
                </div>
                <span className="font-sans font-medium text-[15px] sm:text-[16px] text-[#686D77] group-hover:text-[#181E4B] transition-colors">
                  Play Demo
                </span>
              </button>
            </div>

            {/* Subtle Trust Indicators */}
            <div className="mt-9 pt-7 border-t border-gray-100 flex items-center gap-6 text-xs text-[#5E6282] text-fade-up" style={{ animationDelay: '700ms' }}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
                <span className="font-medium text-[#181E4B]">Zero Negative Inventory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
                <span className="font-medium text-[#181E4B]">Sub-second Telemetry</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Composition with Overlapping Floating Cards */}
          <div className="lg:col-span-6 xl:col-span-6 relative mt-10 lg:mt-0 flex justify-center">
            
            {/* Playful Decorative Sparkles / Stars (Matching reference positions) */}
            <div className="absolute -top-8 left-2 sm:-top-10 sm:left-4 text-[#DF6951] animate-pulse pointer-events-none z-30" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>
            <div className="absolute top-1/2 -right-4 sm:-right-6 text-[#F1A501] opacity-80 pointer-events-none z-30" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>
            <div className="absolute -bottom-9 left-1/3 text-[#14B8A6] opacity-70 pointer-events-none z-30" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>

            {/* Tilt Wrapper with Overlapping Cards */}
            <div className="relative w-full max-w-[530px] pt-6 pb-6 px-3 sm:px-4">
              <TiltCard maxTilt={3} className="w-full relative">
                <div className="relative w-full">
                  
                  {/* Centerpiece Warehouse Visual Frame */}
                  <div className="relative w-full aspect-4/3 rounded-3xl overflow-hidden bg-white shadow-soft-card border border-gray-100 p-2 sm:p-2.5 group">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#F8FAFC]">
                      <img
                        src="/assets/hero-warehouse.jpg"
                        alt="3D isometric render of an automated intelligent warehouse with AGV robotics, organized racks, and dispatch docks"
                        className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                        loading="eager"
                      />
                      {/* Subtle glass reflection gradient at top corner */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/15 pointer-events-none" />
                    </div>
                  </div>

                  {/* Operational Status Card 1: Top-Left (Live Stock In - Controlled Entrance, Non-Obscuring) */}
                  <div 
                    className="absolute -top-4 -left-2 sm:-top-6 sm:-left-5 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100/90 max-w-[220px] sm:max-w-[255px] z-20 pointer-events-auto transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 animate-page-enter"
                    style={{ animationDuration: '600ms' }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 relative">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
                      </span>
                      <span className="text-[10px] font-mono font-bold tracking-wider text-[#14B8A6] uppercase flex items-center gap-1">
                        LIVE TELEMETRY
                      </span>
                      <span className="ml-auto text-[9px] text-gray-400 font-mono flex items-center gap-0.5">
                        <Database className="w-2.5 h-2.5 text-teal-600 inline" /> DB
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between relative">
                      <span className="text-sm sm:text-base font-bold font-sans text-[#181E4B]">
                        <AnimatedNumber value={liveStock.quantity} prefix="+" suffix=" Units Logged" duration={800} />
                      </span>
                    </div>

                    <p className="text-[10px] sm:text-[11px] text-[#5E6282] font-medium truncate mt-0.5 relative" title={`${liveStock.sku} · Rack ${liveStock.rack}`}>
                      {liveStock.sku} · Rack {liveStock.rack}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-emerald-600 font-semibold relative">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                        <span>Verified in Supabase</span>
                      </span>
                      <span className="text-gray-400 font-mono text-[9px] font-normal">{liveStock.rack}</span>
                    </div>
                  </div>

                  {/* Operational Status Card 2: Bottom-Right (Threshold Critical - Controlled Entrance, Non-Obscuring) */}
                  <div 
                    className="absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-5 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl border border-[#DF6951]/25 max-w-[225px] sm:max-w-[270px] z-20 pointer-events-auto transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 animate-page-enter"
                    style={{ animationDuration: '700ms' }}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-[#DF6951] bg-[#FFF1EE] px-2 py-0.5 rounded-md border border-[#DF6951]/20 uppercase">
                        <ShieldAlert className="w-3 h-3 text-[#DF6951]" />
                        THRESHOLD ALERT
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono text-[#5E6282] font-semibold truncate max-w-[90px]">
                        {liveAlert.sku}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#181E4B] font-semibold">Stock: {liveAlert.currentStock} / Min: {liveAlert.threshold}</span>
                        <span className="text-[#DF6951] font-bold">
                          <AnimatedNumber value={liveAlert.percent} suffix="%" duration={750} />
                        </span>
                      </div>
                      {/* Controlled Progress Bar without distracting flashing */}
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-[#DF6951] h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(5, liveAlert.percent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] sm:text-[11px] text-[#5E6282]">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5 text-[#DF6951]" />
                        <span>{liveAlert.severity}</span>
                      </span>
                      <span className="text-[#14B8A6] font-semibold">Live DB Synced</span>
                    </div>
                  </div>

                </div>
              </TiltCard>
            </div>

          </div>

        </div>
      </div>

      {/* Video Workflow Modal */}
      <VideoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  )
}
