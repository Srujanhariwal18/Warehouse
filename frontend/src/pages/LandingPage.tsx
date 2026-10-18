import { HeroSection } from '../components/HeroSection'
import { ScrollShowcase } from '../components/ScrollShowcase'
import { StackedCardCarousel } from '../components/StackedCardCarousel'
import { BelowFoldPreview } from '../components/BelowFoldPreview'

export function LandingPage() {
  return (
    <div>
      {/* 1. Initial Hero Section (Jadoo visual style + Mouse effects + Animated grid) */}
      <HeroSection />

      {/* 2. Pinned Scroll Showcase (Scroll-driven motion reference) */}
      <ScrollShowcase />

      {/* 3. Stacked-Card Carousel (Overlapping 3D card slider reference) */}
      <StackedCardCarousel />

      {/* 4. Core Capabilities Section (Click-to-expand architectural panels) */}
      <BelowFoldPreview />
    </div>
  )
}
