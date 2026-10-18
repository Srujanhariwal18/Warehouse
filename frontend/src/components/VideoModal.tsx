import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, ArrowRight, ShieldAlert, PackageCheck } from 'lucide-react'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#181E4B]/45 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform animate-panel-expand"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FBFBFC]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DF6951]" />
            <h3 id="demo-modal-title" className="font-sans font-bold text-lg text-[#181E4B]">
              Invora Control Workflow Preview
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="relative aspect-video rounded-2xl bg-[#0D1219] overflow-hidden flex flex-col justify-between p-6 text-white border border-gray-800 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-[#14B8A6] bg-[#14B8A6]/10 px-2.5 py-1 rounded-full border border-[#14B8A6]/20">
                ● Live Telemetry
              </span>
              <span className="text-xs font-mono text-gray-400">Warehouse A · Zone 01</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#DF6951]/20 flex items-center justify-center text-[#DF6951]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-100">
                    Threshold Event Triggered: Item SKU-4190
                  </h4>
                  <p className="text-xs text-gray-400">
                    Stock dropped below 50 units (Threshold: 100) → Status: CRITICAL
                  </p>
                </div>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="bg-[#DF6951] h-2 rounded-full w-[42%] transition-all duration-500" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
              <span>Depletion Rate: ~18 units/day</span>
              <span className="text-[#F1A501] font-semibold">Estimated Stockout: 2.3 Days</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#181E4B] mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
                Inbound Scan
              </div>
              <p className="text-[11px] text-[#5E6282] leading-relaxed">
                Direct batch receipt verification with zero latency rack allocation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#181E4B] mb-1">
                <PackageCheck className="w-4 h-4 text-[#F1A501]" />
                Dispatch Lock
              </div>
              <p className="text-[11px] text-[#5E6282] leading-relaxed">
                Pessimistic locking prevents negative inventory during high concurrency.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#181E4B] mb-1">
                <ArrowRight className="w-4 h-4 text-[#DF6951]" />
                Automated Alerts
              </div>
              <p className="text-[11px] text-[#5E6282] leading-relaxed">
                Instant SSE push notifications to warehouse managers and staff.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-[#181E4B] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#232b6b] transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
