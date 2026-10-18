import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowDownRight,
  PackageCheck,
  AlertTriangle,
  Box,
  FileText,
  X,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface CapabilityDetail {
  id: string
  title: string
  tagline: string
  description: string
  technicalDetails: string[]
  formula?: string
  metric: { label: string; value: string }
  image: string
  icon: typeof PackageCheck
  iconBg: string
  highlighted: boolean
  routeLink: string
}

export function BelowFoldPreview() {
  const [activeModal, setActiveModal] = useState<CapabilityDetail | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null)
    }
    if (activeModal) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeModal])

  const capabilities: CapabilityDetail[] = [
    {
      id: 'in-out',
      title: 'Stock IN / OUT',
      tagline: 'Deterministic Transaction Processing',
      description:
        'Deterministic receiving dock and dispatch validation. Automated checks prevent over-withdrawal and negative counts with sub-millisecond database locks.',
      technicalDetails: [
        'Atomic batch intake with supplier PO matching',
        'Automatic rack capacity verification prior to commit',
        'Negative stock check: quantityRequested <= currentStock',
      ],
      formula: 'newStock = currentStock ± quantity',
      metric: { label: 'Negative Stock Prevented', value: '100.0%' },
      image: '/assets/dispatch-dock.jpg',
      icon: PackageCheck,
      iconBg: 'bg-[#FFF1EE] text-[#DF6951]',
      highlighted: false,
      routeLink: '/operations',
    },
    {
      id: 'thresholds',
      title: 'Smart Thresholds',
      tagline: 'Early Warning Depletion Intelligence',
      description:
        'Configurable multi-tier warning alerts (Low, Warning, Critical) with automatic days-to-stockout depletion forecasting based on rolling outflow averages.',
      technicalDetails: [
        'Multi-stage evaluation: Normal, Low (1.5x), Warning (1.0x), Critical (0.5x)',
        'Server-Sent Events (SSE) live push notifications to staff and managers',
        'Automated purchase order draft generation before stockout',
      ],
      formula: 'estimatedDays = currentStock / averageDailyOutflow',
      metric: { label: 'Average Warning Lead Time', value: '3.4 Days' },
      image: '/assets/hero-warehouse.jpg',
      icon: AlertTriangle,
      iconBg: 'bg-[#FFF8E6] text-[#F1A501]',
      highlighted: true, // Signature Jadoo active accent card
      routeLink: '/thresholds',
    },
    {
      id: 'digital-twin',
      title: 'Rack Telemetry',
      tagline: 'Spatial Multi-Facility Digital Twin',
      description:
        'Spatial warehouse, zone, and rack mapping. Monitor capacity limits, active bays, and health statuses in real time with 3D and 2D accessible heatmaps.',
      technicalDetails: [
        'Hierarchical topology: Warehouse → Zone → Rack → Bin',
        'Accessible 2D fallback map for low-bandwidth and mobile devices',
        'Color-coded rack status strips matching worst-product status',
      ],
      metric: { label: 'Telemetry Refresh Rate', value: '< 200ms' },
      image: '/assets/smart-racking.jpg',
      icon: Box,
      iconBg: 'bg-[#E6F8FB] text-[#14B8A6]',
      highlighted: false,
      routeLink: '/warehouses',
    },
    {
      id: 'audit',
      title: 'Audit Ledger',
      tagline: 'Immutable Operational Governance',
      description:
        'Immutable history of every movement, batch, and location adjustment with user identity, timestamp logging, and role-based access verification.',
      technicalDetails: [
        'Cryptographic audit trail on all stock movements and threshold changes',
        'Role-based security enforcement: Admin, Manager, Staff, Viewer',
        'Exportable CSV and PDF compliance reports',
      ],
      metric: { label: 'Audit Trail Retention', value: '100% Immutable' },
      image: '/assets/agv-fleet.jpg',
      icon: FileText,
      iconBg: 'bg-[#EEF2F6] text-[#181E4B]',
      highlighted: false,
      routeLink: '/operations',
    },
  ]

  return (
    <section id="capabilities" className="relative pt-12 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[#5E6282] font-mono font-bold text-xs sm:text-sm tracking-widest uppercase mb-2">
            CORE CAPABILITIES
          </p>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-[46px] text-[#181E4B] leading-tight">
            We Deliver Operational Certainty
          </h2>
          <p className="text-sm sm:text-base text-[#5E6282] mt-3 max-w-lg mx-auto">
            Click any capability tile below to expand deep architectural specifications and operational flows.
          </p>
        </div>

        {/* 4 Category / Capability Cards with Click-to-Expand Animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-stretch">
          {capabilities.map((cap) => {
            const Icon = cap.icon
            return (
              <div key={cap.id} className="relative group">
                {/* Jadoo-style Coral Accent Block behind highlighted card */}
                {cap.highlighted && (
                  <div
                    className="absolute -bottom-6 -left-6 w-24 h-24 rounded-tl-[30px] rounded-br-[10px] bg-[#DF6951] -z-10 group-hover:scale-105 transition-transform duration-300"
                    aria-hidden="true"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setActiveModal(cap)}
                  className={`w-full h-full text-left p-8 rounded-3xl transition-all duration-300 flex flex-col items-center text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DF6951] ${
                    cap.highlighted
                      ? 'bg-white shadow-2xl border border-gray-100 scale-[1.02] hover:scale-[1.04]'
                      : 'bg-white hover:bg-white hover:shadow-xl hover:-translate-y-1.5 border border-transparent hover:border-gray-100'
                  }`}
                  aria-label={`Expand details for ${cap.title}`}
                >
                  {/* Icon badge */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-200 ${cap.iconBg}`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Card Title */}
                  <h3 className="font-sans font-bold text-xl text-[#181E4B] mb-2">
                    {cap.title}
                  </h3>

                  {/* Card Description */}
                  <p className="font-sans text-sm text-[#5E6282] leading-relaxed mb-6">
                    {cap.description}
                  </p>

                  {/* Expansion Cue */}
                  <div className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[#DF6951] group-hover:translate-x-1 transition-transform">
                    <span>Expand Architecture</span>
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        {/* Subtle Preview Glimpse Footer Note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#5E6282] bg-gray-50 border border-gray-200 px-5 py-2.5 rounded-full shadow-2xs">
            <span>Production-grade inventory controls for modern distribution facilities</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#DF6951]" />
          </div>
        </div>
      </div>

      {/* Expanded Capability Detail Modal (Smooth Expansion Animation) */}
      {activeModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#181E4B]/50 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cap-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-panel-expand"
          >
            
            {/* Header with Close */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 bg-[#FAFAFC]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${activeModal.iconBg}`}>
                  <activeModal.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#DF6951] uppercase">
                    CAPABILITY SPECIFICATION
                  </span>
                  <h3 id="modal-cap-title" className="font-serif font-bold text-xl text-[#181E4B]">
                    {activeModal.title} — {activeModal.tagline}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                aria-label="Close specification dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Graphic Showcase */}
              <div className="relative aspect-21/9 rounded-2xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50">
                <img
                  src={activeModal.image}
                  alt={activeModal.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-[#181E4B]/90 backdrop-blur-xs text-white text-xs font-mono px-3 py-1 rounded-full">
                  {activeModal.metric.label}: <strong className="text-[#14B8A6]">{activeModal.metric.value}</strong>
                </div>
              </div>

              {/* Description */}
              <p className="font-sans text-sm sm:text-base text-[#5E6282] leading-relaxed">
                {activeModal.description}
              </p>

              {/* Technical Specifications */}
              <div className="space-y-3">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#181E4B]">
                  Technical Guardrails &amp; Constraints
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {activeModal.technicalDetails.map((detail, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-gray-100 text-xs text-[#212832]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formula if present */}
              {activeModal.formula && (
                <div className="p-4 rounded-xl bg-[#FFF8E6] border border-[#F1A501]/30">
                  <div className="text-[11px] font-mono uppercase font-bold text-[#F1A501] mb-1">
                    Mathematical Validation Model
                  </div>
                  <code className="text-xs font-mono font-bold text-[#181E4B]">
                    {activeModal.formula}
                  </code>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-[#5E6282]">
                  Documented in <code className="font-mono text-gray-700">Docs/DESIGN.md</code>
                </span>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Close
                  </button>
                  <Link
                    to={activeModal.routeLink}
                    onClick={() => setActiveModal(null)}
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-[#181E4B] hover:bg-[#283272] rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <span>View Dedicated Module</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
