import {
  Bell,
  Boxes,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Package,
  Search,
  Settings,
  Truck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button } from '@/components/ui/Button'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/app/dashboard' },
  { label: 'Inventory', icon: Boxes, to: '/app/inventory' },
  { label: 'Orders', icon: Package, to: '/app/orders' },
  { label: 'Suppliers', icon: Truck, to: '/app/suppliers' },
]

const pageTitles: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/inventory': 'Inventory',
  '/app/orders': 'Orders',
  '/app/suppliers': 'Suppliers',
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()
  const pageTitle = pageTitles[location.pathname] ?? 'Workspace'

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (mobileOpen) setMobileOpen(false)
        if (notificationsOpen) setNotificationsOpen(false)
        if (profileOpen) setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, notificationsOpen, profileOpen])

  return (
    <div className="min-h-screen bg-main text-text-primary">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-surface-3/70 bg-sidebar px-5 py-6 transition-transform duration-200 motion-reduce:transition-none lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <NavLink
            aria-label="Invora home"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
            to="/"
          >
            <BrandMark />
            <span className="font-display text-xl font-semibold tracking-tight">
              Invora
            </span>
          </NavLink>
          <Button
            aria-label="Close navigation"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            variant="ghost"
          >
            <X aria-hidden="true" size={20} />
          </Button>
        </div>

        <div className="mt-12">
          <p className="px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            Workspace
          </p>
          <nav aria-label="Main navigation" className="mt-3 grid gap-1">
            {navigation.map(({ icon: Icon, label, to }) => (
              <NavLink
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                  }`
                }
                key={to}
                onClick={() => setMobileOpen(false)}
                to={to}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto rounded-2xl border border-surface-3 bg-surface/60 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-success" />
            Workspace ready
          </div>
          <p className="mt-2 text-xs leading-5 text-text-muted">
            Product surfaces will be connected in a later phase.
          </p>
        </div>
      </aside>

      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-surface-3/60 bg-main/90 backdrop-blur-md">
          <div className="flex min-h-20 items-center gap-3 px-5 sm:px-8 lg:px-10">
            <Button
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              variant="ghost"
            >
              <Menu aria-hidden="true" size={21} />
            </Button>
            <div className="hidden min-w-0 sm:block">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                Invora workspace
              </p>
              <h2 className="truncate font-display text-lg font-semibold">
                {pageTitle}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <label className="relative hidden md:block">
                <span className="sr-only">Search workspace</span>
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
                <input
                  aria-label="Search workspace"
                  className="h-10 w-44 rounded-xl border border-surface-3 bg-surface/70 pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary lg:w-60"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search workspace"
                  type="search"
                  value={search}
                />
              </label>
              <div className="relative">
                <Button
                  aria-expanded={notificationsOpen}
                  aria-label="Open notifications"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  variant="ghost"
                >
                  <Bell aria-hidden="true" size={18} />
                </Button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-30 w-64 rounded-2xl border border-surface-3 bg-surface-2 p-4 shadow-2xl shadow-black/30">
                    <p className="text-sm font-semibold">Notifications</p>
                    <p className="mt-2 text-xs leading-5 text-text-secondary">
                      You are all caught up for this foundation preview.
                    </p>
                  </div>
                )}
              </div>
              <div className="relative">
                <Button
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                  className="pl-2 pr-2 sm:gap-2 sm:pr-3"
                  onClick={() => setProfileOpen((open) => !open)}
                  variant="ghost"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
                    IW
                  </span>
                  <span className="hidden text-sm sm:block">Invora team</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="hidden sm:block"
                    size={15}
                  />
                </Button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-30 w-52 rounded-2xl border border-surface-3 bg-surface-2 p-2 shadow-2xl shadow-black/30">
                    <p className="px-3 py-2 text-xs text-text-muted">
                      Workspace preview
                    </p>
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                      type="button"
                    >
                      <Settings aria-hidden="true" size={16} />
                      Workspace settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
