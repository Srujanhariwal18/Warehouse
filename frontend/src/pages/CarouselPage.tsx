import { Link } from 'react-router-dom'
import { ArrowLeft, Box, Bot, AlertTriangle, FileText, PackageCheck } from 'lucide-react'
import { StackedCardCarousel } from '../components/StackedCardCarousel'
import { ScrollHeadingReveal, ParagraphReveal } from '../components/AnimatedText'

export function CarouselPage() {
  const pillars = [
    {
      icon: PackageCheck,
      color: 'text-[#DF6951] bg-[#FFF1EE]',
      title: '01. Inbound Dock & Intake Telemetry',
      metric: '1.4s / Pallet',
      desc: 'Instant multi-point barcode scanning and purchase order verification. Incoming cargo is slotted directly to designated high-bay rack coordinates.',
    },
    {
      icon: Box,
      color: 'text-[#14B8A6] bg-[#E6F8FB]',
      title: '02. Smart High-Bay Storage Topology',
      metric: '88.4% Optimal',
      desc: 'Vertical lift integration with multi-tier capacity sensors. Live occupancy tracking ensures no bay exceeds safety limits or misplaces batch lots.',
    },
    {
      icon: Bot,
      color: 'text-[#F1A501] bg-[#FFF8E6]',
      title: '03. Autonomous AGV Fleet Routing',
      metric: '0.00% Zero Drift',
      desc: 'Sub-millisecond database locking coordinates autonomous floor robots. Eliminates multi-picker collisions and duplicate dispatch events.',
    },
    {
      icon: AlertTriangle,
      color: 'text-[#DF6951] bg-[#FFF1EE]',
      title: '04. Predictive Threshold Sentinel',
      metric: '3.4 Days Avg Lead',
      desc: 'Continuous analysis of daily consumption velocity against safety thresholds. Automatic warnings notify procurement before stock dips to zero.',
    },
    {
      icon: FileText,
      color: 'text-[#181E4B] bg-gray-100',
      title: '05. Cryptographic Audit Governance',
      metric: '100% Certified',
      desc: 'Tamper-evident operational logging of every movement, user credential, and timestamp. Built-in compliance reporting for high-governance industries.',
    },
  ]

  return (
    <div className="w-full">
      {/* Top Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5E6282] hover:text-[#DF6951] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Overview</span>
        </Link>
      </div>

      {/* Main Interactive Carousel Component (Page 3 Reference) */}
      <StackedCardCarousel />

      {/* Deep-Dive Pillar Breakdown */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-20">
        <div className="border-t border-gray-100 pt-12">
          <ScrollHeadingReveal className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold tracking-widest text-[#DF6951] uppercase mb-2 block">
              ARCHITECTURE TOPOLOGY
            </span>
            <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#181E4B]">
              The Five Pillars in Operational Alignment
            </h3>
            <ParagraphReveal delay={150} className="text-sm text-[#5E6282] mt-2">
              Each module communicates asynchronously over high-throughput event buses backed by pessimistic database locks.
            </ParagraphReveal>
          </ScrollHeadingReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pillar.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#14B8A6] bg-[#E6F8FB] px-2.5 py-1 rounded-md border border-[#14B8A6]/20">
                      {pillar.metric}
                    </span>
                  </div>
                  <h4 className="font-sans font-bold text-base text-[#181E4B] mb-2">
                    {pillar.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5E6282] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
