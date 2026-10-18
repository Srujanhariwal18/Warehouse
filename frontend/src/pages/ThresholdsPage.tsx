import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Database,
  RefreshCw,
  Bell,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { CharacterReveal, ParagraphReveal, AnimatedNumber } from '../components/AnimatedText'
import { invoraApi, BackendAlert } from '../services/api'

export function ThresholdsPage() {
  const [currentStock, setCurrentStock] = useState(82)
  const [threshold, setThreshold] = useState(100)
  const [dailyOutflow, setDailyOutflow] = useState(18)

  // Live Database Alerts State
  const [alerts, setAlerts] = useState<BackendAlert[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [scanning, setScanning] = useState<boolean>(false)

  const loadAlerts = async () => {
    setLoadingAlerts(true)
    try {
      const res = await invoraApi.getAlerts()
      const list = Array.isArray(res) ? res : res?.content || []
      setAlerts(list)
    } catch (err) {
      console.warn('Failed to load live alerts:', err)
    } finally {
      setLoadingAlerts(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleAcknowledge = async (id: string) => {
    setActionLoadingId(id)
    try {
      await invoraApi.acknowledgeAlert(id)
      setActionMessage('Alert acknowledged in Supabase database.')
      await loadAlerts()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setActionLoadingId(null)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  const handleResolve = async (id: string) => {
    setActionLoadingId(id)
    try {
      await invoraApi.resolveAlert(id)
      setActionMessage('Alert marked RESOLVED in Supabase database.')
      await loadAlerts()
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`)
    } finally {
      setActionLoadingId(null)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

  const handleTriggerScan = async () => {
    setScanning(true)
    try {
      await invoraApi.detectAlerts()
      setActionMessage('Full database inventory evaluation completed.')
      await loadAlerts()
    } catch (err: any) {
      setActionMessage(`Scan error: ${err.message}`)
    } finally {
      setScanning(false)
      setTimeout(() => setActionMessage(null), 4000)
    }
  }

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
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5E6282] hover:text-[#DF6951] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Overview</span>
        </Link>

        {/* Database Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] font-mono text-emerald-800">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">Supabase Alert Engine Live</span>
          <button
            type="button"
            onClick={loadAlerts}
            title="Refresh alerts"
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingAlerts ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
          Deterministic 5-tier alert lifecycle. Mathematical stockout depletion estimations and live Supabase
          PostgreSQL incident records for active warehouse inventory thresholds.
        </ParagraphReveal>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-panel-expand font-mono">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-bold underline text-emerald-800">
            Dismiss
          </button>
        </div>
      )}

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

          {/* Current Stock Slider */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500">
                CURRENT STOCK LEVEL
              </label>
              <span className="text-sm font-mono text-[#181E4B] font-bold">
                {currentStock} units
              </span>
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
                aria-label="Current Stock Slider"
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-1">
              <span>0 units</span>
              <span>125 units</span>
              <span>250 units</span>
            </div>
          </div>

          {/* Threshold Slider */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500">
                CONFIGURED THRESHOLD (MINIMUM CEILING)
              </label>
              <span className="text-sm font-mono text-[#181E4B] font-bold">
                {threshold} units
              </span>
            </div>
            <div className="py-2">
              <input
                type="range"
                min="20"
                max="200"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full invora-slider"
                style={{
                  background: `linear-gradient(to right, #14B8A6 0%, #14B8A6 ${thresholdSliderPercent}%, #E2E8F0 ${thresholdSliderPercent}%, #E2E8F0 100%)`,
                }}
                aria-label="Threshold Slider"
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-1">
              <span>20 units</span>
              <span>110 units</span>
              <span>200 units</span>
            </div>
          </div>

          {/* Daily Outflow Slider */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] font-semibold uppercase font-mono tracking-wider text-gray-500">
                DAILY OUTFLOW VELOCITY
              </label>
              <span className="text-sm font-mono text-[#181E4B] font-bold">
                {dailyOutflow} units / day
              </span>
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
                  background: `linear-gradient(to right, #F1A501 0%, #F1A501 ${outflowSliderPercent}%, #E2E8F0 ${outflowSliderPercent}%, #E2E8F0 100%)`,
                }}
                aria-label="Daily Outflow Velocity Slider"
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-1">
              <span>1 unit/day</span>
              <span>25 units/day</span>
              <span>50 units/day</span>
            </div>
          </div>
        </div>

        {/* Right Status Card */}
        <div className="lg:col-span-5 bg-[#F8FAFC] p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-[#DF6951] block mb-1">
              AUTOMATED TIER ASSESSMENT
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#181E4B] mb-4">
              Real-Time Status
            </h3>

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

      {/* Supabase Live Depletion Alerts & Incidents Table */}
      <div className="bg-white p-6 sm:p-8 rounded-[28px] border border-gray-200/80 shadow-xs mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-xl text-[#181E4B]">
                Supabase Live Depletion Incidents
              </h3>
            </div>
            <p className="text-xs text-[#5E6282] mt-1 font-mono">
              Live alerts table from PostgreSQL backend. Real-time acknowledge and resolve mutations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTriggerScan}
              disabled={scanning}
              className="px-4 py-2 rounded-xl bg-[#181E4B] hover:bg-[#283272] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>Trigger Immediate Supabase Scan</span>
            </button>
          </div>
        </div>

        {loadingAlerts ? (
          <div className="py-12 text-center text-xs font-mono text-[#5E6282] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#DF6951]" />
            <span>Loading active database alerts...</span>
          </div>
        ) : alerts.length > 0 ? (
          <div className="divide-y divide-gray-100 mt-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 px-2 rounded-xl transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : alert.severity === 'HIGH' || alert.severity === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                        alert.status === 'ACTIVE'
                          ? 'bg-red-100 text-red-800 font-bold'
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      STATUS: {alert.status}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#181E4B]">
                      {alert.productSku}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#181E4B]">
                    {alert.productName}
                  </div>
                  <p className="text-xs text-[#5E6282]">
                    {alert.message}
                  </p>
                  <div className="text-[11px] font-mono text-gray-400">
                    Current Stock: <strong className="text-red-600">{alert.currentStock}</strong> · Safety Threshold: <strong>{alert.threshold}</strong> · Logged: {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alert.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={actionLoadingId === alert.id}
                      className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === alert.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Acknowledge</span>
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => handleResolve(alert.id)}
                      disabled={actionLoadingId === alert.id}
                      className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === alert.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Resolve</span>
                    </button>
                  )}

                  {alert.status === 'RESOLVED' && (
                    <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1 px-3 py-1 bg-emerald-50 rounded-xl">
                      <ShieldCheck className="w-4 h-4" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-[#181E4B]">No Active Depletion Incidents</h4>
            <p className="text-xs text-[#5E6282] max-w-md mx-auto">
              All warehouse product quantities in the Supabase PostgreSQL database are currently above safety thresholds.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
