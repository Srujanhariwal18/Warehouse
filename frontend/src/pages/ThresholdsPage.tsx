import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import { CharacterReveal, ParagraphReveal, AnimatedNumber } from '../components/AnimatedText'

export function ThresholdsPage() {
  const [currentStock, setCurrentStock] = useState(82)
  const [threshold, setThreshold] = useState(100)
  const [dailyOutflow, setDailyOutflow] = useState(18)

  const estimatedDays = dailyOutflow > 0 ? (currentStock / dailyOutflow).toFixed(1) : 'N/A'

  const calculateStatus = (stock: number, thresh: number) => {
    if (stock === 0)
      return {
        label: 'OUT OF STOCK',
        color: 'bg-red-900 text-white border-red-900',
        badge: 'text-red-700 bg-red-100 border-red-300',
        desc: 'Zero inventory available. Critical supply line failure.',
        icon: ShieldAlert,
      }
    if (stock <= thresh * 0.5)
      return {
        label: 'CRITICAL',
        color: 'bg-red-50 text-red-700 border-red-300',
        badge: 'text-red-700 bg-red-50 border-red-200',
        desc: 'Stock is at or below 50% threshold ceiling. Expedited PO required.',
        icon: ShieldAlert,
      }
    if (stock <= thresh)
      return {
        label: 'WARNING',
        color: 'bg-amber-50 text-amber-700 border-amber-300',
        badge: 'text-amber-700 bg-amber-50 border-amber-300',
        desc: 'Stock is at or below threshold. Automated procurement notified.',
        icon: AlertTriangle,
      }
    if (stock <= thresh * 1.5)
      return {
        label: 'LOW',
        color: 'bg-amber-50/60 text-amber-800 border-amber-200',
        badge: 'text-amber-800 bg-amber-50/60 border-amber-200',
        desc: 'Approaching threshold safety margin (1.5x threshold).',
        icon: Clock,
      }
    return {
      label: 'NORMAL',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      desc: 'Stock is in optimal healthy operational range (>1.5x threshold).',
      icon: CheckCircle2,
    }
  }

  const status = calculateStatus(currentStock, threshold)

  const stockSliderPercent = (currentStock / 250) * 100
  const thresholdSliderPercent = ((threshold - 20) / (200 - 20)) * 100
  const outflowSliderPercent = ((dailyOutflow - 1) / (50 - 1)) * 100

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-14">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5E6282] hover:text-[#DF6951] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Overview</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10 pb-8 border-b border-gray-100">
        <span className="text-xs font-mono font-bold tracking-[0.18em] text-[#DF6951] uppercase mb-2 block">
          <CharacterReveal text="PRE-EMPTIVE DEPLETION INTELLIGENCE" startDelay={50} charStagger={14} />
        </span>
        <h1
          className="font-serif font-bold text-3xl sm:text-4xl lg:text-[46px] text-[#181E4B] leading-tight tracking-tight"
          aria-label="Threshold Alerts & Depletion Math"
        >
          <span aria-hidden="true" className="block">
            <span className="text-reveal-mask mr-[0.26em]">
              <span className="text-reveal-word" style={{ animationDelay: '100ms' }}>Threshold</span>
            </span>
            <span className="text-reveal-mask mr-[0.26em]">
              <span className="text-reveal-word" style={{ animationDelay: '150ms' }}>Alerts</span>
            </span>
            <span className="text-reveal-mask mr-[0.26em]">
              <span className="text-reveal-word" style={{ animationDelay: '200ms' }}>&amp;</span>
            </span>
            <span className="text-reveal-mask mr-[0.26em]">
              <span className="text-reveal-word" style={{ animationDelay: '250ms' }}>Depletion</span>
            </span>
            <span className="text-reveal-mask">
              <span className="text-reveal-word" style={{ animationDelay: '300ms' }}>Math</span>
            </span>
          </span>
        </h1>
        <ParagraphReveal delay={380} className="text-sm sm:text-base text-[#5E6282] mt-3 max-w-2xl leading-relaxed">
          Deterministic 5-tier alert lifecycle. Mathematical stockout depletion estimations trigger
          push events via Server-Sent Events (SSE) before critical supply disruptions occur.
        </ParagraphReveal>
      </div>

      {/* Interactive Threshold & Depletion Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
        {/* Left Simulator */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-sans font-bold text-lg sm:text-xl text-[#181E4B]">
                Depletion Forecaster Simulator
              </h3>
              <p className="text-xs text-[#5E6282] mt-0.5">
                Adjust stock parameters to observe real-time mathematical velocity calculations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCurrentStock(82)
                setThreshold(100)
                setDailyOutflow(18)
              }}
              className="text-xs text-[#5E6282] hover:text-[#DF6951] flex items-center gap-1 font-mono transition shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          <div className="space-y-6">
            {/* Slider 1: Current Stock */}
            <div>
              <div className="flex justify-between items-center mb-2 text-xs font-mono">
                <span className="text-gray-500 font-semibold uppercase tracking-wider">CURRENT STOCK UNITS</span>
                <span className="font-bold text-[#181E4B] text-sm">{currentStock} units</span>
              </div>
              <div className="py-2">
                <input
                  type="range"
                  min="0"
                  max="250"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(Number(e.target.value))}
                  className="w-full invora-slider"
                  style={{
                    background: `linear-gradient(to right, #DF6951 0%, #DF6951 ${stockSliderPercent}%, #E2E8F0 ${stockSliderPercent}%, #E2E8F0 100%)`,
                  }}
                  aria-label="Current Stock Units"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>0 units</span>
                <span>Max Tracked: 250 units</span>
              </div>
            </div>

            {/* Slider 2: Configured Threshold */}
            <div>
              <div className="flex justify-between items-center mb-2 text-xs font-mono">
                <span className="text-gray-500 font-semibold uppercase tracking-wider">CONFIGURED THRESHOLD</span>
                <span className="font-bold text-[#181E4B] text-sm">{threshold} units</span>
              </div>
              <div className="py-2">
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full invora-slider"
                  style={{
                    background: `linear-gradient(to right, #F1A501 0%, #F1A501 ${thresholdSliderPercent}%, #E2E8F0 ${thresholdSliderPercent}%, #E2E8F0 100%)`,
                  }}
                  aria-label="Configured Threshold"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>20 units</span>
                <span>200 units</span>
              </div>
            </div>

            {/* Slider 3: Daily Outflow */}
            <div>
              <div className="flex justify-between items-center mb-2 text-xs font-mono">
                <span className="text-gray-500 font-semibold uppercase tracking-wider">ROLLING DAILY OUTFLOW</span>
                <span className="font-bold text-[#181E4B] text-sm">{dailyOutflow} units / day</span>
              </div>
              <div className="py-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={dailyOutflow}
                  onChange={(e) => setDailyOutflow(Number(e.target.value))}
                  className="w-full invora-slider"
                  style={{
                    background: `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${outflowSliderPercent}%, #E2E8F0 ${outflowSliderPercent}%, #E2E8F0 100%)`,
                  }}
                  aria-label="Rolling Daily Outflow"
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>1 unit/day</span>
                <span>50 units/day</span>
              </div>
            </div>
          </div>

          {/* Mathematical Formula Preview */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-gray-200/80 text-xs font-mono space-y-1.5">
            <div className="text-gray-500 uppercase tracking-wider font-semibold text-[11px]">Mathematical Calculation</div>
            <div className="text-[#181E4B] font-bold text-sm">
              estimatedDays = currentStock / averageDailyOutflow
            </div>
            <div className="text-[#5E6282] text-xs">
              {currentStock} units / {dailyOutflow} units/day = <strong className="text-[#DF6951]"><AnimatedNumber value={Number(estimatedDays) || 0} decimals={1} duration={350} /> days</strong>
            </div>
          </div>
        </div>

        {/* Right Computed Health Card */}
        <div className="lg:col-span-5 bg-[#F8FAFC] p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-[#DF6951] block mb-1">
              THRESHOLD EVALUATION RESULT
            </span>
            <div className="mt-2 mb-6 flex items-center justify-between">
              <span className={`px-4 py-1.5 rounded-lg font-mono font-bold text-sm border shadow-2xs ${status.badge}`}>
                {status.label}
              </span>
              <span className="text-xs font-mono text-[#5E6282] font-semibold">
                Status Evaluated Live
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-[#5E6282] mb-6 leading-relaxed">
              {status.desc}
            </p>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-500 font-medium">ESTIMATED STOCKOUT</span>
                <span className="font-bold text-[#DF6951] text-base">
                  <AnimatedNumber value={Number(estimatedDays) || 0} decimals={1} duration={350} /> Days
                </span>
              </div>
              <div className="text-[11px] text-[#5E6282] leading-relaxed">
                {Number(estimatedDays) <= 3
                  ? 'High risk: Immediate reorder dispatch strongly recommended.'
                  : 'Sufficient runway based on current outflow velocity.'}
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200/80 text-[11px] text-gray-500 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Rule Verified
            </span>
            <span className="font-mono text-[#5E6282]">Formula: Section 9 PRD</span>
          </div>
        </div>
      </div>
    </div>
  )
}
