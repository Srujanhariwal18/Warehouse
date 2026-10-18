import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  PackagePlus,
  PackageMinus,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react'

export function OperationsPage() {
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'transfer'>('out')
  const [currentStock] = useState(140)
  const [outQuantity, setOutQuantity] = useState(60)
  const threshold = 100

  const remaining = Math.max(0, currentStock - outQuantity)
  const isOverWithdrawal = outQuantity > currentStock
  const isBelowThreshold = remaining <= threshold
  const isCritical = remaining <= threshold * 0.5

  const getResultStatus = () => {
    if (isOverWithdrawal) return { label: 'INVALID', color: 'text-red-600 bg-red-50 border-red-200' }
    if (remaining === 0) return { label: 'OUT OF STOCK', color: 'text-red-700 bg-red-100 border-red-300' }
    if (isCritical) return { label: 'CRITICAL', color: 'text-red-600 bg-red-50 border-red-200' }
    if (isBelowThreshold) return { label: 'WARNING', color: 'text-orange-600 bg-orange-50 border-orange-200' }
    return { label: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  }

  const resultStatus = getResultStatus()

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
          TRANSACTIONAL WORKFLOW ARCHITECTURE
        </span>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-[#181E4B]">
          Stock Operations &amp; Dispatch Engine
        </h1>
        <p className="text-sm sm:text-base text-[#5E6282] mt-3 max-w-2xl">
          Deterministic Stock IN, Stock OUT, and inter-rack transfers backed by pessimistic database locks.
          Guaranteed prevention of negative inventory counts under concurrent load.
        </p>
      </div>

      {/* Workflow Tabs */}
      <div className="flex border-b border-gray-200 mb-8 space-x-8">
        <button
          type="button"
          onClick={() => setActiveTab('in')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
            activeTab === 'in'
              ? 'border-[#DF6951] text-[#DF6951]'
              : 'border-transparent text-[#5E6282] hover:text-[#181E4B]'
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          <span>Stock IN (Receiving Dock)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('out')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
            activeTab === 'out'
              ? 'border-[#DF6951] text-[#DF6951]'
              : 'border-transparent text-[#5E6282] hover:text-[#181E4B]'
          }`}
        >
          <PackageMinus className="w-4 h-4" />
          <span>Stock OUT (Dispatch Preview)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transfer')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
            activeTab === 'transfer'
              ? 'border-[#DF6951] text-[#DF6951]'
              : 'border-transparent text-[#5E6282] hover:text-[#181E4B]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Inter-Rack Transfers</span>
        </button>
      </div>

      {/* Stock OUT Interactive Preview Simulation */}
      {activeTab === 'out' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left Form Simulator */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-sans font-bold text-lg text-[#181E4B] mb-1">
              Dispatch Verification Simulator
            </h3>
            <p className="text-xs text-[#5E6282] mb-6">
              Adjust requested units to observe real-time threshold calculations and negative stock prevention.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase font-mono text-gray-700 mb-2">
                  Selected Item
                </label>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-[#181E4B] flex justify-between items-center">
                  <span>Logitech Ergonomic Keyboard (SKU-KB901)</span>
                  <span className="text-xs font-mono text-[#5E6282]">Rack A-04</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold uppercase font-mono text-gray-700">
                    Dispatch Quantity
                  </label>
                  <span className="text-xs font-mono text-[#181E4B] font-bold">
                    {outQuantity} units
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={outQuantity}
                  onChange={(e) => setOutQuantity(Number(e.target.value))}
                  className="w-full accent-[#DF6951] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-1">
                  <span>10 units</span>
                  <span>Current Available: 140</span>
                  <span>200 units</span>
                </div>
              </div>

              {isOverWithdrawal && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    <strong>Transaction Blocked:</strong> Only 140 units available in Rack A-04.
                    Negative inventory commits are prohibited by database constraints.
                  </span>
                </div>
              )}

              {isBelowThreshold && !isOverWithdrawal && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>
                    <strong>Pre-commit Warning:</strong> Dispatching {outQuantity} units will reduce stock
                    to {remaining}, falling below configured threshold ({threshold}). Confirmation required.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Calculation Summary Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#FAFAFC] to-[#F1F3F8] p-6 sm:p-8 rounded-3xl border border-gray-200/70 shadow-sm">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#DF6951]">
              REAL-TIME TRANSACTION TELEMETRY
            </span>
            <h3 className="font-serif font-bold text-xl text-[#181E4B] mt-1 mb-6">
              Preview Summary
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-500">CURRENT STOCK</span>
                <span className="font-bold text-[#181E4B] text-sm">{currentStock} units</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-500">REQUESTED DISPATCH</span>
                <span className="font-bold text-[#DF6951] text-sm">-{outQuantity} units</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-500">PROJECTED REMAINING</span>
                <span className="font-bold text-[#181E4B] text-base">{remaining} units</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-500">MINIMUM THRESHOLD</span>
                <span className="font-bold text-gray-700">{threshold} units</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-500 font-sans font-semibold">RESULTING HEALTH</span>
                <span
                  className={`px-3 py-1 rounded-md font-bold text-xs border ${resultStatus.color}`}
                >
                  {resultStatus.label}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-[#5E6282]">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                Pessimistic DB Lock Active
              </span>
              <span className="font-mono text-emerald-700 font-bold">Latency: 1.2ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Stock IN & Transfer Placeholder Descriptions */}
      {activeTab !== 'out' && (
        <div className="p-12 text-center bg-gray-50 rounded-3xl border border-gray-200/80 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs mx-auto flex items-center justify-center text-[#DF6951] mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-sans font-bold text-xl text-[#181E4B] mb-2">
            {activeTab === 'in' ? 'Inbound Receiving Dock' : 'Inter-Rack Transfers'}
          </h3>
          <p className="text-sm text-[#5E6282] max-w-md mx-auto mb-6">
            Equipped with instant batch verification, barcode scanner integration, and automatic bay slotting algorithms.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('out')}
            className="text-xs font-semibold text-[#DF6951] hover:underline"
          >
            ← Return to Dispatch Preview Simulator
          </button>
        </div>
      )}
    </div>
  )
}
