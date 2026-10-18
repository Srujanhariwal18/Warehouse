import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [selectedLang, setSelectedLang] = useState<'EN' | 'US' | 'DE'>('EN')
  const location = useLocation()

  const isCurrent = (path: string) => location.pathname === path

  return (
    <header className="relative z-50 w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-6 sm:pt-8">
      <nav className="flex items-center justify-between" aria-label="Main Navigation">
        {/* Invora Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#DF6951] rounded-lg p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-[#181E4B] flex items-center justify-center text-white shadow-md shadow-[#181E4B]/10 group-hover:scale-105 transition-transform duration-200">
            {/* Geometric Crate Icon with Teal & Coral accents */}
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z"
                stroke="#14B8A6"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 2V12M12 12L20 6.5M12 12L4 6.5"
                stroke="#14B8A6"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M12 12V22"
                stroke="#DF6951"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="1.5" fill="#DF6951" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-extrabold text-2xl tracking-tight text-[#181E4B] leading-none">
              Invora<span className="text-[#DF6951]">.</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest font-mono text-[#5E6282] font-semibold mt-0.5">
              Warehouse Intel
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 lg:gap-11 text-[15px] font-medium text-[#212832]">
          <Link
            to="/"
            className={`transition-colors py-1 relative group ${
              isCurrent('/') ? 'text-[#DF6951] font-semibold' : 'hover:text-[#DF6951]'
            }`}
          >
            Overview
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-[#DF6951] transition-all duration-200 ${
                isCurrent('/') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>

          <Link
            to="/warehouses"
            className={`transition-colors py-1 relative group ${
              isCurrent('/warehouses') ? 'text-[#DF6951] font-semibold' : 'hover:text-[#DF6951]'
            }`}
          >
            Warehouses
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-[#DF6951] transition-all duration-200 ${
                isCurrent('/warehouses') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>

          <Link
            to="/operations"
            className={`transition-colors py-1 relative group ${
              isCurrent('/operations') ? 'text-[#DF6951] font-semibold' : 'hover:text-[#DF6951]'
            }`}
          >
            Operations
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-[#DF6951] transition-all duration-200 ${
                isCurrent('/operations') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>

          <Link
            to="/carousel"
            className={`transition-colors py-1 relative group ${
              isCurrent('/carousel') || isCurrent('/motion') ? 'text-[#DF6951] font-semibold' : 'hover:text-[#DF6951]'
            }`}
          >
            Motion
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-[#DF6951] transition-all duration-200 ${
                isCurrent('/carousel') || isCurrent('/motion') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>

          <Link
            to="/capabilities"
            className={`transition-colors py-1 relative group ${
              isCurrent('/capabilities') ? 'text-[#DF6951] font-semibold' : 'hover:text-[#DF6951]'
            }`}
          >
            Capabilities
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-[#DF6951] transition-all duration-200 ${
                isCurrent('/capabilities') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>

          <Link
            to="/thresholds"
            className={`transition-colors py-1 relative group ${
              isCurrent('/thresholds') ? 'text-[#DF6951] font-semibold' : 'hover:text-[#DF6951]'
            }`}
          >
            Thresholds
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-[#DF6951] transition-all duration-200 ${
                isCurrent('/thresholds') ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
            />
          </Link>
        </div>

        {/* Right Authentication & Actions */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/auth"
            className="text-[15px] font-medium text-[#212832] hover:text-[#DF6951] transition-colors py-1"
          >
            Sign in
          </Link>

          <Link
            to="/auth"
            className="border border-[#212832] text-[#212832] hover:bg-[#212832] hover:text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-xs"
          >
            Request Access
          </Link>

          {/* Region / Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 text-sm font-medium text-[#212832] hover:text-[#DF6951] py-1 focus:outline-none cursor-pointer"
              aria-expanded={langDropdownOpen}
              aria-label="Select facility locale"
            >
              <span>{selectedLang}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#212832]" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLang('EN')
                    setLangDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 font-medium text-xs flex items-center justify-between text-[#181E4B] cursor-pointer"
                >
                  <span>English (IN)</span>
                  {selectedLang === 'EN' && <span className="text-[#14B8A6]">●</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLang('US')
                    setLangDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-[#5E6282] cursor-pointer"
                >
                  <span>English (US)</span>
                  {selectedLang === 'US' && <span className="text-[#14B8A6]">●</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLang('DE')
                    setLangDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-[#5E6282] cursor-pointer"
                >
                  <span>Deutsch (EU)</span>
                  {selectedLang === 'DE' && <span className="text-[#14B8A6]">●</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#212832] hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-[#DF6951]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 bg-white border border-gray-100 rounded-2xl shadow-xl p-5 space-y-4">
          <div className="flex flex-col space-y-3 text-[15px] font-medium text-[#212832]">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#DF6951] border-b border-gray-50"
            >
              Overview
            </Link>
            <Link
              to="/warehouses"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#DF6951] border-b border-gray-50"
            >
              Warehouses
            </Link>
            <Link
              to="/operations"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#DF6951] border-b border-gray-50"
            >
              Operations
            </Link>
            <Link
              to="/carousel"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#DF6951] border-b border-gray-50"
            >
              Motion (Carousel)
            </Link>
            <Link
              to="/capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#DF6951] border-b border-gray-50"
            >
              Capabilities
            </Link>
            <Link
              to="/thresholds"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#DF6951] border-b border-gray-50"
            >
              Thresholds
            </Link>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-medium text-[#212832] hover:bg-gray-50 rounded-lg border border-gray-200"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-medium text-white bg-[#181E4B] rounded-lg shadow-sm"
            >
              Request Access
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
