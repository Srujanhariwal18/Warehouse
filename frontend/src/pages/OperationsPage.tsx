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
  ShieldCheck,
  Info,
} from 'lucide-react'
import { CharacterReveal, ParagraphReveal, AnimatedNumber } from '../components/AnimatedText'

export function OperationsPage() {
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'transfer'>('out')

  // Stock OUT state
  const [currentStock] = useState(140)
  const [outQuantity, setOutQuantity] = useState(60)
  const threshold = 100

  // Stock IN state
  const [inQuantity, setInQuantity] = useState(80)
  const rackCapacity = 300

  // Transfer state
  const [transferQuantity, setTransferQuantity] = useState(35)
  const sourceRackStock = 140
  const targetRackStock = 20
  const targetRackMax = 100

  // Out calculations
  const remaining = Math.max(0, currentStock - outQuantity)
  const isOverWithdrawal = outQuantity > currentStock
  const isBelowThreshold = remaining <= threshold
  const isCritical = remaining <= threshold * 0.5

  const getResultStatus = () => {
    if (isOverWithdrawal) return { label: 'INVALID', color: 'text-red-700 bg-red-50 border-red-200' }
    if (remaining === 0) return { label: 'OUT OF STOCK', color: 'text-red-700 bg-red-100 border-red-300' }
    if (isCritical) return { label: 'CRITICAL', color: 'text-red-600 bg-red-50 border-red-200' }
    if (isBelowThreshold) return { label: 'WARNING', color: 'text-amber-700 bg-amber-50/80 border-amber-300' }
    return { label: 'NORMAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  }

  const resultStatus = getResultStatus()
  const outSliderPercent = ((outQuantity - 10) / (200 - 10)) * 100
  const inSliderPercent = ((inQuantity - 10) / (200 - 10)) * 100
  const transferSliderPercent = ((transferQuantity - 5) / (100 - 5)) * 100

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
          <CharacterReveal text="TRANSACTIONAL WORKFLOW ARCHITECTURE" startDelay={50} charStagger={14} />
        </span>
        <h1
          className="font-serif font-bold text-3xl sm:text-4xl lg:text-[46px] text-[#181E4B] leading-tight tracking-tight"
          aria-label="Stock Operations & Dispatch Engine"
        >
          <span aria-hidden="true" className="block">
            <span className="text-reveal-mask mr-[0.26em]">
              <span className="text-reveal-word" style={{ animationDelay: '100ms' }}>Stock</span>
            </span>
            <span className="text-reveal-mask mr-[0.26em]">
              <span className="text-reveal-word" style={{ animationDelay: '150ms' }}>Operations</span>
            </span>
            <span className="text-reveal-mask mr-[0.26em]">
              <span className="text-reveal-word" style={{ animationDelay: '200ms' }}>&amp;</span>
            </span>
            <span className="text-reveal-mask mr-[0.26em]">
              <span className="text-reveal-word" style={{ animationDelay: '250ms' }}>Dispatch</span>
            </span>
            <span className="text-reveal-mask">
              <span className="text-reveal-word" style={{ animationDelay: '300ms' }}>Engine</span>
            </span>
          </span>
        </h1>
        <ParagraphReveal delay={380} className="text-sm sm:text-base text-[#5E6282] mt-3 max-w-2xl leading-relaxed">
          Deterministic Stock IN, Stock OUT, and inter-rack transfers backed by pessimistic
          database locks. Guaranteed prevention of negative inventory counts under concurrent
          load.
        </ParagraphReveal>
      </div>

      {/* Workflow Tabs */}
      <div className="flex border-b border-gray-200 mb-8 space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('in')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 shrink-0 cursor-pointer ${
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
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 shrink-0 cursor-pointer ${
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
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 shrink-0 cursor-pointer ${
            activeTab === 'transfer'
              ? 'border-[#DF6951] text-[#DF6951]'
              : 'border-transparent text-[#5E6282] hover:text-[#181E4B]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Inter-Rack Transfers</span>
        </button>
      </div>

      {/* TAB 1: Stock OUT (Dispatch Preview) — Reference matched to input_file_0.png */}
      {activeTab === 'out' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left Form Simulator */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
            <h3 className="font-sans font-bold text-lg sm:text-xl text-[#181E4B] mb-1">
              Dispatch Verification Simulator
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E6282] mb-7 leading-relaxed">
              Adjust requested units to observe real-time threshold calculations and negative stock prevention.
            </p>

            <div className="space-y-6">
              {/* Selected Item Pill */}
              <div>
                <label className="block text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500 mb-2">
                  SELECTED ITEM
                </label>
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-gray-200/90 text-sm font-medium text-[#181E4B] flex justify-between items-center">
                  <span className="font-semibold text-[#181E4B] truncate mr-2">
                    Logitech Ergonomic Keyboard (SKU-KB901)
                  </span>
                  <span className="text-xs font-mono font-medium text-[#5E6282] bg-white px-2.5 py-1 rounded-md border border-gray-200/60 shadow-2xs shrink-0">
                    Rack A-04
                  </span>
                </div>
              </div>

              {/* Slider Section */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500">
                    DISPATCH QUANTITY
                  </label>
                  <span className="text-sm font-mono text-[#181E4B] font-bold">
                    {outQuantity} units
                  </span>
                </div>

                <div className="py-2">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={outQuantity}
                    onChange={(e) => setOutQuantity(Number(e.target.value))}
                    className="w-full invora-slider"
                    style={{
                      background: `linear-gradient(to right, #DF6951 0%, #DF6951 ${outSliderPercent}%, #E2E8F0 ${outSliderPercent}%, #E2E8F0 100%)`,
                    }}
                    aria-label="Dispatch Quantity Slider"
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-1.5">
                  <span>10 units</span>
                  <span className="text-[#5E6282] font-medium">Current Available: 140</span>
                  <span>200 units</span>
                </div>
              </div>

              {/* Synchronized Warning & Validation States */}
              {isOverWithdrawal ? (
                <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 transition-all">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Transaction Blocked:</strong> Only 140 units available in Rack A-04.
                    Negative inventory commits are prohibited by database constraints.
                  </span>
                </div>
              ) : isBelowThreshold ? (
                <div className="p-4 rounded-xl bg-[#FFF9F5] border border-[#FED7AA] text-[#9A3412] text-xs flex items-start gap-2.5 transition-all">
                  <AlertTriangle className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Pre-commit Warning:</strong> Dispatching {outQuantity} units will reduce stock to {remaining}, falling below configured threshold ({threshold}). Confirmation required.
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 transition-all">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Optimal Dispatch:</strong> Dispatching {outQuantity} units leaves {remaining} units in Rack A-04, safely above configured threshold ({threshold}).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Calculation Summary Panel */}
          <div className="lg:col-span-5 bg-[#F8FAFC] p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
            <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-[#DF6951] block mb-1">
              REAL-TIME TRANSACTION TELEMETRY
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#181E4B] mb-6">
              Preview Summary
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">CURRENT STOCK</span>
                <span className="font-bold text-[#181E4B] text-sm"><AnimatedNumber value={currentStock} /> units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">REQUESTED DISPATCH</span>
                <span className="font-bold text-[#DF6951] text-sm">-<AnimatedNumber value={outQuantity} duration={300} /> units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">PROJECTED REMAINING</span>
                <span className="font-bold text-[#181E4B] text-base"><AnimatedNumber value={remaining} duration={300} /> units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">MINIMUM THRESHOLD</span>
                <span className="font-bold text-gray-700 text-sm"><AnimatedNumber value={threshold} /> units</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-500 font-sans font-semibold text-xs">RESULTING HEALTH</span>
                <span className={`px-3 py-1 rounded-md font-bold text-xs border ${resultStatus.color}`}>
                  {resultStatus.label}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-[#5E6282]">
              <span className="flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                Pessimistic DB Lock Active
              </span>
              <span className="font-mono text-emerald-700 font-bold">Latency: 1.2ms</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Stock IN (Receiving Dock) — Fully functional simulator */}
      {activeTab === 'in' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left Form Simulator */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
            <h3 className="font-sans font-bold text-lg sm:text-xl text-[#181E4B] mb-1">
              Receiving Dock Intake Simulator
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E6282] mb-7 leading-relaxed">
              Verify incoming purchase order cargo and calculate bay capacity allocations in real time.
            </p>

            <div className="space-y-6">
              {/* Selected PO & Target Rack */}
              <div>
                <label className="block text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500 mb-2">
                  INCOMING PURCHASE ORDER &amp; DESTINATION
                </label>
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-gray-200/90 text-sm font-medium text-[#181E4B] flex justify-between items-center">
                  <span className="font-semibold text-[#181E4B] truncate mr-2">
                    PO-88204 · Logitech Ergonomic Keyboard
                  </span>
                  <span className="text-xs font-mono font-medium text-[#14B8A6] bg-white px-2.5 py-1 rounded-md border border-gray-200/60 shadow-2xs shrink-0">
                    Dock Bay 01 → Rack A-04
                  </span>
                </div>
              </div>

              {/* Slider Section */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500">
                    INTAKE QUANTITY
                  </label>
                  <span className="text-sm font-mono text-[#181E4B] font-bold">
                    +{inQuantity} units
                  </span>
                </div>

                <div className="py-2">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={inQuantity}
                    onChange={(e) => setInQuantity(Number(e.target.value))}
                    className="w-full invora-slider"
                    style={{
                      background: `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${inSliderPercent}%, #E2E8F0 ${inSliderPercent}%, #E2E8F0 100%)`,
                    }}
                    aria-label="Intake Quantity Slider"
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-1.5">
                  <span>10 units</span>
                  <span className="text-[#5E6282] font-medium">Current Stock: {currentStock}</span>
                  <span>200 units</span>
                </div>
              </div>

              {/* Capacity Check State */}
              {currentStock + inQuantity > rackCapacity ? (
                <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Rack Overflow Warning:</strong> Total {currentStock + inQuantity} units exceeds Rack A-04 max capacity ({rackCapacity} units). Please redirect excess cargo to secondary bay.
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-800 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Slotting Verified:</strong> Rack A-04 can comfortably accept +{inQuantity} units. Projected bay utilization will be {Math.round(((currentStock + inQuantity) / rackCapacity) * 100)}%.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Calculation Summary Panel */}
          <div className="lg:col-span-5 bg-[#F8FAFC] p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
            <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-[#14B8A6] block mb-1">
              RECEIVING DOCK TELEMETRY
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#181E4B] mb-6">
              Intake Summary
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">CURRENT STOCK</span>
                <span className="font-bold text-[#181E4B] text-sm">{currentStock} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">INCOMING INTAKE</span>
                <span className="font-bold text-[#14B8A6] text-sm">+{inQuantity} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">PROJECTED TOTAL</span>
                <span className="font-bold text-[#181E4B] text-base">{currentStock + inQuantity} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">BAY MAX CAPACITY</span>
                <span className="font-bold text-gray-700 text-sm">{rackCapacity} units</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-500 font-sans font-semibold text-xs">RESULTING HEALTH</span>
                <span className="px-3 py-1 rounded-md font-bold text-xs border text-teal-700 bg-teal-50 border-teal-200">
                  OPTIMAL
                </span>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-[#5E6282]">
              <span className="flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                Dock Lock Active
              </span>
              <span className="font-mono text-emerald-700 font-bold">Intake Rate: 1.4s/Pallet</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Inter-Rack Transfers — Fully functional simulator */}
      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left Form Simulator */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
            <h3 className="font-sans font-bold text-lg sm:text-xl text-[#181E4B] mb-1">
              Inter-Rack Relocation Simulator
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E6282] mb-7 leading-relaxed">
              Atomic cross-rack transfers maintaining two-phase database locking across distinct aisles.
            </p>

            <div className="space-y-6">
              {/* Source & Target Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500 mb-2">
                    SOURCE RACK
                  </label>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200/90 text-xs font-semibold text-[#181E4B] flex justify-between items-center">
                    <span>Rack A-04</span>
                    <span className="font-mono text-gray-500">{sourceRackStock} units</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500 mb-2">
                    TARGET RACK
                  </label>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200/90 text-xs font-semibold text-[#181E4B] flex justify-between items-center">
                    <span>Rack B-12</span>
                    <span className="font-mono text-gray-500">{targetRackStock} units</span>
                  </div>
                </div>
              </div>

              {/* Slider Section */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500">
                    TRANSFER QUANTITY
                  </label>
                  <span className="text-sm font-mono text-[#181E4B] font-bold">
                    {transferQuantity} units
                  </span>
                </div>

                <div className="py-2">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(Number(e.target.value))}
                    className="w-full invora-slider"
                    style={{
                      background: `linear-gradient(to right, #F1A501 0%, #F1A501 ${transferSliderPercent}%, #E2E8F0 ${transferSliderPercent}%, #E2E8F0 100%)`,
                    }}
                    aria-label="Transfer Quantity Slider"
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-1.5">
                  <span>5 units</span>
                  <span className="text-[#5E6282] font-medium">Source Available: {sourceRackStock}</span>
                  <span>100 units</span>
                </div>
              </div>

              {/* Validation notification */}
              {targetRackStock + transferQuantity > targetRackMax ? (
                <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Target Bay Overcapacity:</strong> Transfer of {transferQuantity} units would exceed Rack B-12 maximum capacity limit ({targetRackMax} units).
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Atomic Transfer Ready:</strong> Moving {transferQuantity} units from Rack A-04 to Rack B-12 with zero inventory drift and double-entry ledger verification.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Live Calculation Summary Panel */}
          <div className="lg:col-span-5 bg-[#F8FAFC] p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
            <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-[#F1A501] block mb-1">
              MULTI-RACK ATOMIC TELEMETRY
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#181E4B] mb-6">
              Transfer Summary
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">SOURCE REMAINING</span>
                <span className="font-bold text-[#181E4B] text-sm">{sourceRackStock - transferQuantity} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">TRANSFER AMOUNT</span>
                <span className="font-bold text-[#F1A501] text-sm">{transferQuantity} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">TARGET NEW TOTAL</span>
                <span className="font-bold text-[#181E4B] text-base">{targetRackStock + transferQuantity} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">TARGET REMAINING HEADROOM</span>
                <span className="font-bold text-gray-700 text-sm">{targetRackMax - (targetRackStock + transferQuantity)} units</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-500 font-sans font-semibold text-xs">RESULTING HEALTH</span>
                <span className="px-3 py-1 rounded-md font-bold text-xs border text-emerald-700 bg-emerald-50 border-emerald-200">
                  BALANCED
                </span>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-[#5E6282]">
              <span className="flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                Two-Phase Commit Active
              </span>
              <span className="font-mono text-emerald-700 font-bold">Latency: 1.1ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
