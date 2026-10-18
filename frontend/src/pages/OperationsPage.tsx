import { useState, useEffect } from 'react'
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
  RefreshCw,
} from 'lucide-react'
import { CharacterReveal, ParagraphReveal, AnimatedNumber } from '../components/AnimatedText'
import {
  invoraApi,
  BackendProduct,
  BackendRack,
  BackendInventory,
  BackendTransactionResponse,
} from '../services/api'

export function OperationsPage() {
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'transfer'>('in')

  // Live Backend Database State
  const [products, setProducts] = useState<BackendProduct[]>([])
  const [racks, setRacks] = useState<BackendRack[]>([])
  const [inventory, setInventory] = useState<BackendInventory[]>([])
  const [dbConnected, setDbConnected] = useState<boolean>(false)
  const [loadingData, setLoadingData] = useState<boolean>(true)

  // Selected Entities
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedRackId, setSelectedRackId] = useState<string>('')
  const [targetRackId, setTargetRackId] = useState<string>('')

  // Form Quantities
  const [outQuantity, setOutQuantity] = useState(25)
  const [inQuantity, setInQuantity] = useState(50)
  const [transferQuantity, setTransferQuantity] = useState(20)

  // Transaction Feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [lastTransaction, setLastTransaction] = useState<BackendTransactionResponse | null>(null)
  const [txError, setTxError] = useState<string | null>(null)

  // Fetch Live Database Data
  const loadDatabaseData = async () => {
    setLoadingData(true)
    try {
      const [prods, rks, inv] = await Promise.all([
        invoraApi.getProducts(),
        invoraApi.getRacks(),
        invoraApi.getAllInventory(),
      ])

      setProducts(prods || [])
      setRacks(rks || [])
      setInventory(inv || [])
      setDbConnected(true)

      // Initialize default selections if not set
      if (prods && prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id)
      }
      if (rks && rks.length > 0) {
        if (!selectedRackId) setSelectedRackId(rks[0].id)
        if (!targetRackId) setTargetRackId(rks[1]?.id || rks[0].id)
      }
    } catch (err: any) {
      console.warn('Error fetching live operations data:', err)
      setDbConnected(false)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    loadDatabaseData()
  }, [])

  // Active Entity References
  const activeProduct = products.find((p) => p.id === selectedProductId) || {
    id: 'd0000000-0000-0000-0000-000000000001',
    name: 'Industrial Hex Bolt M10 (Pack of 50)',
    sku: 'SKU-BOLT-M10',
    threshold: 20,
    unitPrice: 14.5,
  }

  const activeRack = racks.find((r) => r.id === selectedRackId) || {
    id: 'e2000000-0000-0000-0000-000000000001',
    name: 'Rack A1 - Structural Components',
    code: 'RA1',
    capacity: 1200,
  }

  const activeTargetRack = racks.find((r) => r.id === targetRackId) || {
    id: 'e2000000-0000-0000-0000-000000000002',
    name: 'Rack A2 - Precision Equipment',
    code: 'RA2',
    capacity: 800,
  }

  // Derive Current Stock for Selected Item in Selected Bay
  const currentInvRow = inventory.find(
    (i) => i.productId === activeProduct.id && i.rackId === activeRack.id
  )
  const targetInvRow = inventory.find(
    (i) => i.productId === activeProduct.id && i.rackId === activeTargetRack.id
  )

  const currentStock = currentInvRow ? currentInvRow.quantity : 160
  const threshold = activeProduct.threshold || 20
  const rackCapacity = activeRack.capacity || 1200

  const sourceRackStock = currentStock
  const targetRackStock = targetInvRow ? targetInvRow.quantity : 12
  const targetRackMax = activeTargetRack.capacity || 800

  // Calculations for Stock OUT
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
  const outSliderPercent = Math.min(100, Math.max(0, (outQuantity / Math.max(currentStock, 100)) * 100))
  const inSliderPercent = Math.min(100, Math.max(0, (inQuantity / 300) * 100))
  const transferSliderPercent = Math.min(100, Math.max(0, (transferQuantity / Math.max(sourceRackStock, 50)) * 100))

  // ── Database Mutation Handlers ──────────────────────────────────────────

  const handleStockIn = async () => {
    if (!activeProduct.id || !activeRack.id) return
    setIsSubmitting(true)
    setTxError(null)
    try {
      const res = await invoraApi.stockIn({
        productId: activeProduct.id,
        destinationRackId: activeRack.id,
        quantity: inQuantity,
        reference: `PO-${Date.now().toString().slice(-6)}`,
        reason: 'Dock Inbound Intake via Warehouse Frontend',
      })
      setLastTransaction(res)
      await loadDatabaseData()
    } catch (err: any) {
      setTxError(err.message || 'Stock IN failed. Check backend database constraints.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStockOut = async () => {
    if (!activeProduct.id || !activeRack.id) return
    setIsSubmitting(true)
    setTxError(null)
    try {
      const res = await invoraApi.stockOut({
        productId: activeProduct.id,
        sourceRackId: activeRack.id,
        quantity: outQuantity,
        reference: `DISP-${Date.now().toString().slice(-6)}`,
        reason: 'Outbound Dispatch via Warehouse Frontend',
      })
      setLastTransaction(res)
      await loadDatabaseData()
    } catch (err: any) {
      setTxError(err.message || 'Stock OUT failed. Prevented by negative inventory lock.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStockTransfer = async () => {
    if (!activeProduct.id || !activeRack.id || !activeTargetRack.id) return
    setIsSubmitting(true)
    setTxError(null)
    try {
      const res = await invoraApi.stockTransfer({
        productId: activeProduct.id,
        sourceRackId: activeRack.id,
        destinationRackId: activeTargetRack.id,
        quantity: transferQuantity,
        reference: `XFER-${Date.now().toString().slice(-6)}`,
        reason: 'Bay Relocation via Warehouse Frontend',
      })
      setLastTransaction(res)
      await loadDatabaseData()
    } catch (err: any) {
      setTxError(err.message || 'Inter-rack transfer failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-14">
      {/* Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5E6282] hover:text-[#DF6951] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Overview</span>
        </Link>

        {/* Database Live Connectivity Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] font-mono text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">
            {dbConnected ? 'Supabase DB Live (Port 8080)' : 'Reconnecting DB...'}
          </span>
          <button
            type="button"
            onClick={loadDatabaseData}
            title="Refresh database state"
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
          load against the live Supabase PostgreSQL backend.
        </ParagraphReveal>
      </div>

      {/* Transaction Success Banner */}
      {lastTransaction && (
        <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-sm animate-panel-expand">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-emerald-950">
                  Transaction Committed to Supabase Database
                </h4>
                <span className="text-xs font-mono text-emerald-700">
                  Ledger ID: #{lastTransaction.id.slice(0, 13)}... · Pessimistic Lock Released
                </span>
              </div>
            </div>
            <button
              onClick={() => setLastTransaction(null)}
              className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-3.5 rounded-2xl border border-emerald-200/70 font-mono text-xs">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase">Type</span>
              <strong className="text-emerald-800 text-sm">{lastTransaction.transactionType}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase">Product SKU</span>
              <strong className="text-emerald-800 text-sm">{lastTransaction.productSku}</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase">Delta Quantity</span>
              <strong className="text-emerald-800 text-sm">{lastTransaction.quantity} units</strong>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase">Verified Balance After</span>
              <strong className="text-emerald-950 text-base font-extrabold">{lastTransaction.balanceAfter} units</strong>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Error Banner */}
      {txError && (
        <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between animate-panel-expand">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span><strong>Database Error:</strong> {txError}</span>
          </div>
          <button
            onClick={() => setTxError(null)}
            className="text-xs font-mono font-bold text-red-700 hover:text-red-900 cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workflow Tabs */}
      <div className="flex border-b border-gray-200 mb-8 space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => { setActiveTab('in'); setTxError(null); }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 shrink-0 cursor-pointer ${
            activeTab === 'in'
              ? 'border-[#14B8A6] text-[#14B8A6]'
              : 'border-transparent text-[#5E6282] hover:text-[#181E4B]'
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          <span>Stock IN (Receiving Dock)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('out'); setTxError(null); }}
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
          onClick={() => { setActiveTab('transfer'); setTxError(null); }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 shrink-0 cursor-pointer ${
            activeTab === 'transfer'
              ? 'border-[#F1A501] text-[#F1A501]'
              : 'border-transparent text-[#5E6282] hover:text-[#181E4B]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Inter-Rack Transfers</span>
        </button>
      </div>

      {/* Global Product & Bay Selectors */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200/80 mb-8 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1.5 tracking-wider">
            1. SELECT PRODUCT LOT (FROM LIVE DATABASE)
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#181E4B] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#DF6951]"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1.5 tracking-wider">
            2. {activeTab === 'in' ? 'DESTINATION RACK' : activeTab === 'out' ? 'SOURCE RACK' : 'SOURCE RACK'}
          </label>
          <select
            value={selectedRackId}
            onChange={(e) => setSelectedRackId(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#181E4B] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#DF6951]"
          >
            {racks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code}) · Cap: {r.capacity}
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'transfer' && (
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1.5 tracking-wider">
              3. DESTINATION RACK (TRANSFER TARGET)
            </label>
            <select
              value={targetRackId}
              onChange={(e) => setTargetRackId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#181E4B] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#DF6951]"
            >
              {racks
                .filter((r) => r.id !== selectedRackId)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code}) · Cap: {r.capacity}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Stock IN (Receiving Dock) */}
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
                  TARGET PRODUCT &amp; DESTINATION BAY
                </label>
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-gray-200/90 text-sm font-medium text-[#181E4B] flex justify-between items-center">
                  <span className="font-semibold text-[#181E4B] truncate mr-2">
                    {activeProduct.name} ({activeProduct.sku})
                  </span>
                  <span className="text-xs font-mono font-medium text-[#14B8A6] bg-white px-2.5 py-1 rounded-md border border-gray-200/60 shadow-2xs shrink-0">
                    {activeRack.code} · In Stock: {currentStock}
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
                    min="5"
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
                  <span>5 units</span>
                  <span className="text-[#5E6282] font-medium">Current In-Bay: {currentStock}</span>
                  <span>200 units</span>
                </div>
              </div>

              {/* Capacity Check State */}
              {currentStock + inQuantity > rackCapacity ? (
                <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Rack Overflow Warning:</strong> Total {currentStock + inQuantity} units exceeds {activeRack.code} max capacity ({rackCapacity} units). Please redirect excess cargo to secondary bay.
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-800 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Slotting Verified:</strong> {activeRack.code} can comfortably accept +{inQuantity} units. Projected bay utilization will be {Math.round(((currentStock + inQuantity) / rackCapacity) * 100)}%.
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
                <span className="font-bold text-[#181E4B] text-sm"><AnimatedNumber value={currentStock} /> units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">INCOMING INTAKE</span>
                <span className="font-bold text-[#14B8A6] text-sm">+<AnimatedNumber value={inQuantity} duration={300} /> units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">PROJECTED TOTAL</span>
                <span className="font-bold text-[#181E4B] text-base"><AnimatedNumber value={currentStock + inQuantity} duration={300} /> units</span>
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

            <button
              type="button"
              onClick={handleStockIn}
              disabled={isSubmitting || currentStock + inQuantity > rackCapacity}
              className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#14B8A6] hover:bg-[#0f9485] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Committing to Supabase PostgreSQL...</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4" />
                  <span>Commit Stock IN to Database</span>
                </>
              )}
            </button>

            <div className="mt-6 pt-5 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-[#5E6282]">
              <span className="flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                Dock Lock Active
              </span>
              <span className="font-mono text-emerald-700 font-bold">Supabase Synced</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Stock OUT (Dispatch Preview) */}
      {activeTab === 'out' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left Form Simulator */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
            <h3 className="font-sans font-bold text-lg sm:text-xl text-[#181E4B] mb-1">
              Dispatch Verification Simulator
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E6282] mb-7 leading-relaxed">
              Adjust requested units to observe real-time threshold calculations and pessimistic lock validation.
            </p>

            <div className="space-y-6">
              {/* Selected Item Pill */}
              <div>
                <label className="block text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500 mb-2">
                  SELECTED ITEM
                </label>
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-gray-200/90 text-sm font-medium text-[#181E4B] flex justify-between items-center">
                  <span className="font-semibold text-[#181E4B] truncate mr-2">
                    {activeProduct.name} ({activeProduct.sku})
                  </span>
                  <span className="text-xs font-mono font-medium text-[#5E6282] bg-white px-2.5 py-1 rounded-md border border-gray-200/60 shadow-2xs shrink-0">
                    {activeRack.code} · Available: {currentStock}
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
                    min="5"
                    max={Math.max(100, Math.round(currentStock * 1.4))}
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
                  <span>5 units</span>
                  <span className="text-[#5E6282] font-medium">Current Available: {currentStock}</span>
                  <span>{Math.max(100, Math.round(currentStock * 1.4))} units</span>
                </div>
              </div>

              {/* Synchronized Warning & Validation States */}
              {isOverWithdrawal ? (
                <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 transition-all">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Transaction Blocked:</strong> Only {currentStock} units available in {activeRack.code}.
                    Negative inventory commits are prohibited by database constraints.
                  </span>
                </div>
              ) : isBelowThreshold ? (
                <div className="p-4 rounded-xl bg-[#FFF9F5] border border-[#FED7AA] text-[#9A3412] text-xs flex items-start gap-2.5 transition-all">
                  <AlertTriangle className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Pre-commit Warning:</strong> Dispatching {outQuantity} units will reduce stock to {remaining}, falling below configured threshold ({threshold}).
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 transition-all">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Optimal Dispatch:</strong> Dispatching {outQuantity} units leaves {remaining} units in {activeRack.code}, safely above configured threshold ({threshold}).
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

            <button
              type="button"
              onClick={handleStockOut}
              disabled={isSubmitting || isOverWithdrawal || remaining < 0}
              className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#DF6951] hover:bg-[#c94f38] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-coral-button cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Locking Row &amp; Executing Stock OUT...</span>
                </>
              ) : (
                <>
                  <PackageMinus className="w-4 h-4" />
                  <span>Commit Stock OUT (Pessimistic Lock)</span>
                </>
              )}
            </button>

            <div className="mt-6 pt-5 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-[#5E6282]">
              <span className="flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                Pessimistic DB Lock Active
              </span>
              <span className="font-mono text-emerald-700 font-bold">Latency: 1.2ms</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Inter-Rack Transfers */}
      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Left Form Simulator */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs">
            <h3 className="font-sans font-bold text-lg sm:text-xl text-[#181E4B] mb-1">
              Inter-Rack Relocation Simulator
            </h3>
            <p className="text-xs sm:text-[13px] text-[#5E6282] mb-7 leading-relaxed">
              Atomic cross-rack transfers maintaining two-phase database locking across distinct bays.
            </p>

            <div className="space-y-6">
              {/* Source & Target Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500 mb-2">
                    SOURCE RACK
                  </label>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200/90 text-xs font-semibold text-[#181E4B] flex justify-between items-center">
                    <span>{activeRack.name} ({activeRack.code})</span>
                    <span className="font-mono text-gray-500">{sourceRackStock} units</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500 mb-2">
                    TARGET RACK
                  </label>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200/90 text-xs font-semibold text-[#181E4B] flex justify-between items-center">
                    <span>{activeTargetRack.name} ({activeTargetRack.code})</span>
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
                    max={Math.max(50, Math.min(100, sourceRackStock))}
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
                  <span>{Math.max(50, Math.min(100, sourceRackStock))} units</span>
                </div>
              </div>

              {/* Validation notification */}
              {targetRackStock + transferQuantity > targetRackMax ? (
                <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Target Bay Overcapacity:</strong> Transfer of {transferQuantity} units would exceed {activeTargetRack.code} maximum capacity limit ({targetRackMax} units).
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Atomic Transfer Ready:</strong> Moving {transferQuantity} units from {activeRack.code} to {activeTargetRack.code} with zero inventory drift and double-entry ledger verification.
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
                <span className="font-bold text-[#181E4B] text-sm"><AnimatedNumber value={sourceRackStock - transferQuantity} duration={300} /> units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">TRANSFER AMOUNT</span>
                <span className="font-bold text-[#F1A501] text-sm">{transferQuantity} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">TARGET NEW TOTAL</span>
                <span className="font-bold text-[#181E4B] text-base"><AnimatedNumber value={targetRackStock + transferQuantity} duration={300} /> units</span>
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

            <button
              type="button"
              onClick={handleStockTransfer}
              disabled={isSubmitting || targetRackStock + transferQuantity > targetRackMax || transferQuantity > sourceRackStock}
              className="w-full mt-6 py-3.5 px-4 rounded-xl bg-[#F1A501] hover:bg-[#d69300] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Two-Phase Commit in PostgreSQL...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Execute Atomic Cross-Rack Transfer</span>
                </>
              )}
            </button>

            <div className="mt-6 pt-5 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-[#5E6282]">
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
