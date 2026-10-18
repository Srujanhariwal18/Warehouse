import { HeroSection } from '../components/HeroSection'
import { StackedCardCarousel } from '../components/StackedCardCarousel'
import { BelowFoldPreview } from '../components/BelowFoldPreview'
import { ScrollShowcase } from '../components/ScrollShowcase'

export function LandingPage() {
  return (
    <div>
      {/* 1. Initial Hero Section (Page 2: Hero Visual + Live Telemetry) */}
      <HeroSection />

      {/* 2. Stacked-Card Carousel (Page 3: Intelligent Warehousing in Motion) */}
      <StackedCardCarousel />

      {/* 3. Core Capabilities Section (Page 4: We Deliver Operational Certainty) */}
      <BelowFoldPreview />

      {/* 4. Scroll Showcase Deep Dive (Continuous Induction Workflow) */}
      <ScrollShowcase />
    </div>
  )
}
