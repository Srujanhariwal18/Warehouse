import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BelowFoldPreview } from '../components/BelowFoldPreview'

export function CapabilitiesPage() {
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

      {/* Main Core Capabilities Component (Page 4 Reference) */}
      <BelowFoldPreview />
    </div>
  )
}
