import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { PageTransition } from './components/PageTransition'
import { LandingPage } from './pages/LandingPage'
import { WarehousesPage } from './pages/WarehousesPage'
import { OperationsPage } from './pages/OperationsPage'
import { ThresholdsPage } from './pages/ThresholdsPage'
import { CarouselPage } from './pages/CarouselPage'
import { CapabilitiesPage } from './pages/CapabilitiesPage'
import { AuthPage } from './pages/AuthPage'

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-[#212832] flex flex-col font-sans selection:bg-[#FFF1EE] selection:text-[#DF6951]">
        {/* Global Navigation Bar */}
        <Navbar />

        {/* Dynamic Route Pages Wrapped in Transition Animation */}
        <main className="flex-1 w-full">
          <PageTransition>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/operations" element={<OperationsPage />} />
              <Route path="/thresholds" element={<ThresholdsPage />} />
              <Route path="/carousel" element={<CarouselPage />} />
              <Route path="/motion" element={<CarouselPage />} />
              <Route path="/capabilities" element={<CapabilitiesPage />} />
              <Route path="/auth" element={<AuthPage />} />
              {/* Fallback to Landing Page */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </PageTransition>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-gray-100 bg-[#FAFAFC] py-8 text-xs text-[#5E6282]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#181E4B]">Invora</span>
              <span>— Intelligent Warehouse Inventory Stock &amp; Threshold Alert System</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API Services Active
              </span>
              <span className="font-mono text-gray-400">v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
