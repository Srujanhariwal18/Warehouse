import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'

export function ThresholdsPage() {
  const [currentStock, setCurrentStock] = useState(82)
  const [threshold, setThreshold] = useState(100)
  const [dailyOutflow, setDailyOutflow] = useState(18)

  const estimatedDays = dailyOutflow > 0 ? (currentStock / dailyOutflow).toFixed(1) : 'N/A'

  const calculateStatus = (stock: number, thresh: number) => {
    if (stock === 0) return { label: 'OUT OF STOCK', color: 'bg-red-900 text-white border-red-900', desc: 'Zero inventory available' }
    if (stock <= thresh * 0.5) return { label: 'CRITICAL', color: 'bg-red-50 text-red-700 border-red-300', desc: 'Stock is at or below 50% threshold' }
    if (stock <= thresh) return { label: 'WARNING', color: 'bg-orange-50 text-orange-700 border-orange-300', desc: 'Stock is at or below threshold' }
    if (stock <= thresh * 1.5) return { label: 'LOW', color: 'bg-amber-50 text-amber-700 border-amber-300', desc: 'Approaching threshold ceiling (1.5x)' }
    return { label: 'NORMAL', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', desc: 'Stock is in optimal healthy range (>1.5x)' }
  }

  const status = calculateStatus(currentStock, threshold)

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
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
        <span className="text-xs font-mono font-bold tracking-widest text-[#DF6951] uppercase mb-2 block">
          PRE-EMPTIVE DEPLETION INTELLIGENCE
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-[#181E4B]">
          Threshold Alerts &amp; Depletion Math
        </h1>
        <p className="text-sm sm:text-base text-[#5E6282] mt-3 max-w-2xl">
          Deterministic 5-tier alert lifecycle. Mathematical stockout depletion estimations trigger
          push events via Server-Sent Events (SSE) before critical supply disruptions occur.
        </p>
      </div>

      {/* Interactive Threshold & Depletion Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Simulator */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-lg text-[#181E4B]">
              Depletion Forecaster Simulator
            </h3>
            <button
              type="button"
              onClick={() => {
                setCurrentStock(82)
                setThreshold(100)
                setDailyOutflow(18)
              }}
              className="text-xs text-[#5E6282] hover:text-[#DF6951] flex items-center gap-1 font-mono"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs font-mono">
                <span className="text-gray-600 font-semibold uppercase">Current Stock Units</span>
                <span className="font-bold text-[#181E4B] text-sm">{currentStock}</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full accent-[#DF6951] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs font-mono">
                <span className="text-gray-600 font-semibold uppercase">Configured Threshold</span>
                <span className="font-bold text-[#181E4B] text-sm">{threshold}</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="10"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-[#F1A501] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs font-mono">
                <span className="text-gray-600 font-semibold uppercase">Rolling Daily Outflow</span>
                <span className="font-bold text-[#181E4B] text-sm">{dailyOutflow} units/day</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={dailyOutflow}
                onChange={(e) => setDailyOutflow(Number(e.target.value))}
                className="w-full accent-[#14B8A6] cursor-pointer"
              />
            </div>
          </div>

          {/* Mathematical Formula Preview */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono space-y-1">
            <div className="text-gray-500 uppercase tracking-wider font-semibold">Mathematical Calculation</div>
            <div className="text-[#181E4B] font-bold">
              estimatedDays = currentStock / averageDailyOutflow
            </div>
            <div className="text-[#5E6282] text-[11px]">
              {currentStock} units / {dailyOutflow} units/day = <strong>{estimatedDays} days</strong>
            </div>
          </div>
        </div>

        {/* Right Computed Health Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#FAFAFC] to-[#F1F3F8] p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#DF6951]">
              THRESHOLD EVALUATION RESULT
            </span>
            <div className="mt-3 mb-6 flex items-center justify-between">
              <span className={`px-4 py-1.5 rounded-lg font-mono font-bold text-sm border shadow-2xs ${status.color}`}>
                {status.label}
              </span>
              <span className="text-xs font-mono text-[#5E6282] font-semibold">
                Status Evaluated Live
              </span>
            </div>

            <p className="text-xs text-[#5E6282] mb-6 leading-relaxed">
              {status.desc}
            </p>

            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-500">ESTIMATED STOCKOUT</span>
                <span className="font-bold text-[#DF6951] text-base">{estimatedDays} Days</span>
              </div>
              <div className="text-[11px] text-[#5E6282]">
                {Number(estimatedDays) <= 3
                  ? 'High risk: Immediate reorder dispatch strongly recommended.'
                  : 'Sufficient runway based on current outflow velocity.'}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-500 flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Rule Verified
            </span>
            <span className="font-mono">Formula: Section 9 PRD</span>
          </div>
        </div>
      </div>
    </div>
  )
}
