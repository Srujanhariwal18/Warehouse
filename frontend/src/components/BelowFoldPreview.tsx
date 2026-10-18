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
import { ScrollHeadingReveal, ParagraphReveal } from './AnimatedText'

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
      highlighted: true, // Signature reference active accent card
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
      image: '/assets/audit-ledger.jpg',
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
        <ScrollHeadingReveal className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-gray-400 font-mono font-bold text-xs tracking-[0.2em] uppercase mb-2.5">
            CORE CAPABILITIES
          </p>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-[46px] text-[#181E4B] leading-tight">
            We Deliver Operational Certainty
          </h2>
          <ParagraphReveal delay={150} className="text-sm sm:text-base text-[#5E6282] mt-3.5 max-w-lg mx-auto leading-relaxed">
            Click any capability tile below to expand deep architectural specifications and operational flows.
          </ParagraphReveal>
        </ScrollHeadingReveal>

        {/* 4 Category / Capability Cards matching input_file_3.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {capabilities.map((cap) => {
            const Icon = cap.icon
            return (
              <div key={cap.id} className="relative group flex">
                {/* Jadoo-style Coral Accent Block behind highlighted card 2 */}
                {cap.highlighted && (
                  <div
                    className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 w-24 h-24 rounded-tl-[32px] rounded-bl-[16px] rounded-br-[16px] bg-[#DF6951] -z-10 group-hover:scale-105 transition-transform duration-300"
                    aria-hidden="true"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setActiveModal(cap)}
                  className={`w-full text-center p-7 sm:p-8 rounded-[28px] transition-all duration-300 flex flex-col items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DF6951] ${
                    cap.highlighted
                      ? 'bg-white shadow-2xl border border-gray-100/90 relative z-10 hover:-translate-y-1'
                      : 'bg-white hover:bg-white hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-gray-100/90'
                  }`}
                  aria-label={`Expand details for ${cap.title}`}
                >
                  {/* Icon badge */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-105 duration-200 shrink-0 ${cap.iconBg}`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Card Title */}
                  <h3 className="font-sans font-bold text-lg sm:text-xl text-[#181E4B] mb-3">
                    {cap.title}
                  </h3>

                  {/* Card Description */}
                  <p className="font-sans text-xs sm:text-[13px] text-[#5E6282] leading-relaxed mb-6 flex-1">
                    {cap.description}
                  </p>

                  {/* Expansion Cue: Expand Architecture ↘ */}
                  <div className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-[#DF6951] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
                    <span>Expand Architecture</span>
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer Pill Note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-sans text-[#5E6282] bg-white border border-gray-200/80 px-6 py-2.5 rounded-full shadow-2xs hover:border-[#DF6951]/40 transition-colors cursor-default">
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
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-panel-expand max-h-[90vh] flex flex-col"
          >
            {/* Header with Close */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 bg-[#FAFAFC] shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeModal.iconBg}`}>
                  <activeModal.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#DF6951] uppercase block">
                    CAPABILITY SPECIFICATION
                  </span>
                  <h3 id="modal-cap-title" className="font-serif font-bold text-xl sm:text-2xl text-[#181E4B]">
                    {activeModal.title} — {activeModal.tagline}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Context image & metric preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100">
                <div className="md:col-span-5 h-36 rounded-xl overflow-hidden">
                  <img
                    src={activeModal.image}
                    alt={activeModal.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:col-span-7 space-y-2">
                  <span className="text-xs font-mono font-bold text-[#5E6282] uppercase">
                    Key Performance Metric
                  </span>
                  <div className="text-2xl font-serif font-bold text-[#181E4B]">
                    {activeModal.metric.value}
                  </div>
                  <div className="text-xs text-[#5E6282]">
                    {activeModal.metric.label}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-gray-400 tracking-wider mb-2">
                  Operational Mechanics
                </h4>
                <p className="text-sm text-[#5E6282] leading-relaxed">
                  {activeModal.description}
                </p>
              </div>

              {/* Formula if present */}
              {activeModal.formula && (
                <div className="p-4 rounded-xl bg-[#FFF8E6] border border-[#F1A501]/30">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#F1A501] block mb-1">
                    Mathematical Validation Model
                  </span>
                  <code className="font-mono text-xs text-[#181E4B] font-semibold">
                    {activeModal.formula}
                  </code>
                </div>
              )}

              {/* Technical Specifications */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-gray-400 tracking-wider mb-3">
                  Architectural Guarantees
                </h4>
                <ul className="space-y-2.5">
                  {activeModal.technicalDetails.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#181E4B]">
                      <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer with Deep Route Link */}
            <div className="px-6 sm:px-8 py-4 bg-[#FAFAFC] border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-mono text-gray-400">
                Module ID: {activeModal.id}
              </span>
              <Link
                to={activeModal.routeLink}
                onClick={() => setActiveModal(null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#181E4B] hover:bg-[#283272] text-white text-xs font-semibold shadow-xs transition"
              >
                <span>Open Live Interface</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
