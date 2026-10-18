import { useState } from 'react'
import {
  Play,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react'
import { VideoModal } from './VideoModal'
import { AnimatedGrid } from './AnimatedGrid'
import { TiltCard } from './TiltCard'
import { MagneticButton } from './MagneticButton'

export function HeroSection() {
  const [modalOpen, setModalOpen] = useState(false)

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
            {/* Small Eyebrow Label */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-[#DF6951] font-bold text-xs sm:text-sm tracking-wider uppercase font-sans">
                INTELLIGENT WAREHOUSE &amp; STOCK CONTROL
              </span>
              <span className="w-2 h-2 rounded-full bg-[#DF6951] animate-ping" />
            </div>

            {/* Large Editorial Headline with Deliberate Line Breaks */}
            <h1 className="font-serif font-bold text-3xl sm:text-5xl lg:text-[54px] xl:text-[62px] leading-[1.14] tracking-tight text-[#181E4B] mb-6">
              Track, optimize &amp; control<br className="hidden sm:inline" /> warehouse stock with{' '}
              <span className="curved-underline text-[#181E4B]">
                real-time precision.
              </span>
            </h1>

            {/* Short Supporting Description with readable line length */}
            <p className="font-sans text-[15px] sm:text-[17px] leading-[1.7] text-[#5E6282] max-w-lg mb-8">
              Invora unifies stock IN/OUT transactions, rack-level telemetry, and automated threshold alerts
              into one centralized control center. Eliminate manual registers and prevent costly stockouts.
            </p>

            {/* Dual CTAs: Magnetic Amber Pill Button + Circular Coral Play Demo */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-8">
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
            <div className="mt-9 pt-7 border-t border-gray-100 flex items-center gap-6 text-xs text-[#5E6282]">
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

          {/* Right Column: Hero Visual Composition with 3D Tilt */}
          <div className="lg:col-span-6 xl:col-span-6 relative mt-6 lg:mt-0 flex justify-center">
            
            {/* Playful Decorative Sparkles / Stars (Jadoo aesthetic) */}
            <div className="absolute -top-6 left-6 text-[#DF6951] animate-pulse pointer-events-none" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>
            <div className="absolute top-1/2 -right-4 text-[#F1A501] opacity-75 pointer-events-none" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>
            <div className="absolute -bottom-8 left-1/4 text-[#14B8A6] opacity-60 pointer-events-none" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </div>

            {/* Centerpiece Image Frame with 3D TiltCard */}
            <TiltCard maxTilt={4} className="w-full max-w-[540px]">
              <div className="relative w-full rounded-3xl overflow-hidden bg-white shadow-soft-card border border-gray-100 p-2 sm:p-3 group">
                <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-[#F8FAFC]">
                  <img
                    src="/assets/hero-warehouse.jpg"
                    alt="3D isometric render of an automated intelligent warehouse with AGV robotics, organized racks, and dispatch docks"
                    className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    loading="eager"
                  />
                  
                  {/* Subtle glass reflection gradient at top corner */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/20 pointer-events-none" />
                </div>

                {/* Floating Contextual Card 1: Top-Left (Inbound Stock Receipt) - Aligned to not overlap headline */}
                <div className="absolute top-4 left-4 sm:-top-3 sm:left-3 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-xl border border-gray-100 max-w-[210px] sm:max-w-[240px] animate-float-slow z-20 pointer-events-none sm:pointer-events-auto">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-[#14B8A6] uppercase">
                      LIVE STOCK IN
                    </span>
                    <span className="ml-auto text-[9px] text-gray-400">Just now</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm sm:text-base font-bold font-sans text-[#181E4B]">
                      +350 Units Logged
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#5E6282] font-medium truncate mt-0.5">
                    Pallet SKU-9042 · Rack A-02
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>Verified &amp; Racked</span>
                  </div>
                </div>

                {/* Floating Contextual Card 2: Bottom-Right (Threshold & Utilization) - Safely anchored */}
                <div className="absolute bottom-4 right-4 sm:-bottom-4 sm:right-3 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-gray-100 max-w-[220px] sm:max-w-[260px] animate-float-reverse z-20 pointer-events-none sm:pointer-events-auto">
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-[#DF6951] bg-[#FFF1EE] px-2 py-0.5 rounded-md border border-[#DF6951]/20 uppercase">
                      <ShieldAlert className="w-3 h-3 text-[#DF6951]" />
                      THRESHOLD CRITICAL
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-[#5E6282] font-semibold">
                      Rack B-04
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#181E4B] font-semibold">Stock: 42 / Min: 100</span>
                      <span className="text-[#DF6951] font-bold">42%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#DF6951] h-1.5 rounded-full w-[42%]" />
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] sm:text-[11px] text-[#5E6282]">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5 text-[#DF6951]" />
                      1.4 Days to Stockout
                    </span>
                    <span className="text-[#14B8A6] font-semibold">Reorder Sent</span>
                  </div>
                </div>

              </div>
            </TiltCard>

          </div>

        </div>
      </div>

      {/* Video Workflow Modal */}
      <VideoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  )
}
