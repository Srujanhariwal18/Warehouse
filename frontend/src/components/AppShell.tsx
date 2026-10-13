import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  Command,
  LayoutDashboard,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Truck,
  Warehouse,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/lib/authStore'
import { useInventoryStore } from '@/lib/inventoryStore'
import { useOrdersStore } from '@/lib/orderStore'
import { useSuppliersStore } from '@/lib/supplierStore'
import { useTransactionStore } from '@/lib/transactionStore'
import { useWarehouseStore } from '@/lib/warehouseStore'
import type { Supplier } from '@/mocks/supplierData'
import type { StockTransactionRecord } from '@/mocks/transactionData'

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
  to: string
  badge?: string
}

type NavGroup = {
  heading: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    heading: 'OPERATIONS',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/app/dashboard' },
      { label: 'Inventory', icon: Boxes, to: '/app/inventory' },
      { label: 'Transactions', icon: ArrowLeftRight, to: '/app/transactions' },
      { label: 'Orders', icon: Package, to: '/app/orders' },
    ],
  },
  {
    heading: 'LOGISTICS NETWORK',
    items: [
      { label: 'Warehouses', icon: Warehouse, to: '/app/warehouses' },
      { label: 'Suppliers', icon: Truck, to: '/app/suppliers' },
    ],
  },
  {
    heading: 'INTELLIGENCE',
    items: [
      { label: 'Reports', icon: BarChart3, to: '/app/reports' },
      { label: 'Alerts', icon: AlertTriangle, to: '/app/alerts' },
    ],
  },
]

const pageMeta: Record<string, { title: string; category: string }> = {
  '/app/dashboard': { title: 'Operational Command', category: 'TELEMETRY' },
  '/app/inventory': { title: 'Inventory Catalogue', category: 'MATERIALS' },
  '/app/transactions': {
    title: 'Stock Movement Ledger',
    category: 'AUDIT STREAM',
  },
  '/app/orders': { title: 'Fulfillment Operations', category: 'DISPATCH' },
  '/app/warehouses': {
    title: 'Facility Network & Zones',
    category: 'INFRASTRUCTURE',
  },
  '/app/suppliers': {
    title: 'Vendor & Supplier Directory',
    category: 'PARTNERS',
  },
  '/app/reports': {
    title: 'Intelligence & Analytics',
    category: 'BUSINESS METRICS',
  },
  '/app/alerts': { title: 'Exception Watchlist', category: 'INCIDENT LOG' },
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('invora_sidebar_collapsed') === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [systemInfoOpen, setSystemInfoOpen] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Live Store Connections for working global search and notifications
  const { products, lowStockProducts } = useInventoryStore()
  const { warehouses } = useWarehouseStore()
  const { orders } = useOrdersStore()
  const { suppliers } = useSuppliersStore()
  const { transactions } = useTransactionStore()

  // Authentication State
  const { user, isAuthenticated, login, logout } = useAuth()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginUsername, setLoginUsername] = useState('admin')
  const [loginPassword, setLoginPassword] = useState('Password@123')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginSubmitting(true)
    const res = await login({
      username: loginUsername.trim(),
      password: loginPassword,
    })
    setLoginSubmitting(false)
    if (res.ok) {
      setLoginModalOpen(false)
    } else {
      setLoginError(res.message || 'Login failed. Please verify credentials.')
    }
  }

  const currentMeta = pageMeta[location.pathname] ?? {
    title: 'Workspace',
    category: 'SYSTEM',
  }

  // Toggle sidebar collapse and persist
  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('invora_sidebar_collapsed', String(next))
      return next
    })
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  // Keyboard shortcuts (Cmd+K / Ctrl+K for search, Esc to close)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => {
          if (prev) {
            setSearchQuery('')
            return false
          }
          return true
        })
      } else if (e.key === 'Escape') {
        closeSearch()
        setNotificationsOpen(false)
        setSystemInfoOpen(false)
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  // Derive notifications from actual store data
  const notifications = useMemo(() => {
    const list: Array<{
      id: string
      type: 'critical' | 'warning' | 'info'
      title: string
      detail: string
      to: string
    }> = []

    const outOfStock = products.filter((p) => p.stock === 0)
    if (outOfStock.length > 0) {
      list.push({
        id: 'oos',
        type: 'critical',
        title: `${outOfStock.length} Product${outOfStock.length > 1 ? 's' : ''} Out of Stock`,
        detail: `Critical replenishment needed for ${outOfStock[0].name}${outOfStock.length > 1 ? ` and ${outOfStock.length - 1} more` : ''}.`,
        to: '/app/alerts',
      })
    }

    if (lowStockProducts.length > 0) {
      list.push({
        id: 'low',
        type: 'warning',
        title: `${lowStockProducts.length} Items Below Reorder Ceiling`,
        detail: `Buffer threshold triggered across active warehouse nodes.`,
        to: '/app/alerts',
      })
    }

    const pendingOrders = orders.filter((o) => o.status === 'Pending')
    if (pendingOrders.length > 0) {
      list.push({
        id: 'orders',
        type: 'info',
        title: `${pendingOrders.length} Order${pendingOrders.length > 1 ? 's' : ''} Awaiting Processing`,
        detail: `Pending fulfillment pipeline requiring operator approval.`,
        to: '/app/orders',
      })
    }

    return list
  }, [products, lowStockProducts, orders])

  // Global search across entities
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null

    const matchedProducts = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      )
      .slice(0, 4)

    const matchedOrders = orders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q),
      )
      .slice(0, 3)

    const matchedWarehouses = warehouses
      .filter(
        (w) =>
          w.name.toLowerCase().includes(q) || w.city.toLowerCase().includes(q),
      )
      .slice(0, 2)

    const matchedSuppliers: Supplier[] = suppliers
      .filter(
        (s: Supplier) =>
          s.companyName.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q),
      )
      .slice(0, 2)

    const matchedTransactions: StockTransactionRecord[] = transactions
      .filter(
        (t: StockTransactionRecord) =>
          t.id.toLowerCase().includes(q) ||
          t.sku.toLowerCase().includes(q) ||
          (t.referenceNumber && t.referenceNumber.toLowerCase().includes(q)),
      )
      .slice(0, 3)

    const totalMatches =
      matchedProducts.length +
      matchedOrders.length +
      matchedWarehouses.length +
      matchedSuppliers.length +
      matchedTransactions.length

    return {
      matchedProducts,
      matchedOrders,
      matchedWarehouses,
      matchedSuppliers,
      matchedTransactions,
      totalMatches,
    }
  }, [searchQuery, products, orders, warehouses, suppliers, transactions])

  return (
    <div className="min-h-screen bg-transparent text-text-primary antialiased selection:bg-primary/20 selection:text-primary">
      {/* Desktop / Tablet Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col border-r border-surface-border bg-sidebar transition-all duration-200 motion-reduce:transition-none ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-5 border-b border-surface-border/60">
          <NavLink
            aria-label="Invora Command"
            className="flex items-center gap-3 group"
            to="/app/dashboard"
          >
            <BrandMark className="h-8 w-8 text-primary transition-transform group-hover:scale-105" />
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="font-display text-lg font-bold tracking-tight text-text-primary block leading-none">
                  INVORA
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/80">
                  OPERATIONS OS
                </span>
              </div>
            )}
          </NavLink>
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors"
            onClick={toggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {navGroups.map((group) => (
            <div key={group.heading} className="space-y-1">
              {!collapsed ? (
                <p className="px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-text-muted font-semibold">
                  {group.heading}
                </p>
              ) : (
                <div className="h-px bg-surface-border/60 my-2 mx-2" />
              )}
              <nav aria-label={group.heading} className="space-y-1 mt-1.5">
                {group.items.map(({ icon: Icon, label, to }) => (
                  <NavLink
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-surface-blue text-primary font-semibold shadow-xs'
                          : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                    key={to}
                    title={collapsed ? label : undefined}
                    to={to}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-primary" />
                        )}
                        <Icon
                          aria-hidden="true"
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? 'text-primary'
                              : 'text-text-muted group-hover:text-text-primary'
                          }`}
                          size={18}
                          strokeWidth={isActive ? 2 : 1.75}
                        />
                        {!collapsed && (
                          <span className="truncate">{label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Workspace Telemetry Status */}
        <div className="p-3 border-t border-surface-border/60">
          {!collapsed ? (
            <div className="rounded-xl border border-surface-border bg-surface-secondary p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-primary uppercase tracking-wider font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SYS.NORMAL
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  3 HUBS
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-text-muted truncate">
                LIVE TELEMETRY // ACTIVE
              </p>
            </div>
          ) : (
            <div
              className="flex justify-center py-2"
              title="System normal (3 Hubs online)"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] border-r border-surface-border bg-sidebar p-5 flex flex-col z-10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-3">
                <BrandMark className="h-8 w-8 text-primary" />
                <span className="font-display text-lg font-bold tracking-tight text-text-primary">
                  INVORA
                </span>
              </div>
              <button
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-primary"
                onClick={() => setMobileOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {navGroups.map((group) => (
                <div key={group.heading}>
                  <p className="px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                    {group.heading}
                  </p>
                  <nav className="mt-2 space-y-1">
                    {group.items.map(({ icon: Icon, label, to }) => (
                      <NavLink
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-surface-blue text-primary font-semibold'
                              : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                          }`
                        }
                        key={to}
                        onClick={() => setMobileOpen(false)}
                        to={to}
                      >
                        <Icon size={18} />
                        {label}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`relative min-h-screen transition-all duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}
      >
        {/* Top Operational Bar */}
        <header className="sticky top-0 z-30 border-b border-surface-border bg-sidebar/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Mobile Toggle & Page Context */}
            <div className="flex items-center gap-3">
              <button
                aria-label="Open mobile menu"
                className="rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text-primary lg:hidden"
                onClick={() => setMobileOpen(true)}
                type="button"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary">
                    {currentMeta.category}
                  </span>
                  <span className="text-surface-border text-xs">/</span>
                  <span className="text-xs text-text-secondary truncate">
                    {currentMeta.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Omnibox, Notifications, System Telemetry */}
            <div className="flex items-center gap-2.5">
              {/* Working Global Omnibox Trigger */}
              <button
                aria-label="Search entities across workspace"
                className="flex items-center gap-2.5 h-9 rounded-lg border border-surface-border bg-white px-3 text-xs text-text-muted hover:border-primary/40 hover:text-text-secondary transition-colors shadow-2xs"
                onClick={() => setSearchOpen(true)}
                type="button"
              >
                <Search size={14} className="text-primary" />
                <span className="hidden md:inline">
                  Search SKUs, orders, hubs...
                </span>
                <span className="md:hidden">Search...</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-surface-border bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                  <Command size={10} />K
                </kbd>
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  aria-expanded={notificationsOpen}
                  aria-label="Open notifications feed"
                  className="relative rounded-lg p-2 text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors"
                  onClick={() => {
                    setNotificationsOpen((prev) => !prev)
                    setSystemInfoOpen(false)
                  }}
                  type="button"
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-warning ring-2 ring-white" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 z-40 w-80 sm:w-96 rounded-xl border border-surface-border bg-white p-4 shadow-xl shadow-slate-200/60 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between border-b border-surface-border pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-semibold text-text-primary">
                          Operations Telemetry
                        </span>
                        <StatusBadge
                          size="sm"
                          tone={
                            notifications.length > 0 ? 'warning' : 'success'
                          }
                        >
                          {notifications.length} Active
                        </StatusBadge>
                      </div>
                      <button
                        className="text-text-muted hover:text-text-primary text-xs"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-text-muted">
                          <CheckCircle2
                            size={24}
                            className="mx-auto text-success mb-2"
                          />
                          Zero active operational exceptions.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                              n.type === 'critical'
                                ? 'bg-red-50/70 border-red-200 hover:bg-red-50'
                                : n.type === 'warning'
                                  ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-50'
                                  : 'bg-cyan-50/70 border-cyan-200 hover:bg-cyan-50'
                            }`}
                            onClick={() => {
                              setNotificationsOpen(false)
                              navigate(n.to)
                            }}
                          >
                            <p className="font-semibold text-text-primary flex items-center justify-between">
                              <span>{n.title}</span>
                              <ChevronRight
                                size={14}
                                className="text-text-muted"
                              />
                            </p>
                            <p className="mt-1 text-[11px] text-text-secondary leading-normal">
                              {n.detail}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Operator Profile / System Info */}
              <div className="relative">
                <button
                  aria-expanded={systemInfoOpen}
                  aria-label="System status & profile"
                  className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-2.5 py-1.5 text-xs hover:border-primary/40 transition-colors shadow-2xs"
                  onClick={() => {
                    setSystemInfoOpen((prev) => !prev)
                    setNotificationsOpen(false)
                  }}
                  type="button"
                >
                  <div
                    className={`h-5 w-5 rounded-md border flex items-center justify-center font-mono text-[10px] font-bold ${
                      isAuthenticated
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                    }`}
                  >
                    {isAuthenticated
                      ? (user?.username?.slice(0, 2).toUpperCase() || 'AD')
                      : 'IN'}
                  </div>
                  <span className="hidden sm:inline font-mono text-xs text-text-secondary font-medium">
                    {isAuthenticated ? user?.username : 'Sign In'}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isAuthenticated
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                    title={
                      isAuthenticated
                        ? 'Spring Boot Connected'
                        : 'Unauthenticated'
                    }
                  />
                </button>

                {systemInfoOpen && (
                  <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-surface-border bg-white p-4 shadow-xl shadow-slate-200/60 text-xs">
                    <div className="border-b border-surface-border pb-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-text-primary">
                          {isAuthenticated
                            ? 'Authenticated Session'
                            : 'Unauthenticated'}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            isAuthenticated
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isAuthenticated ? 'LIVE JWT' : 'GUEST'}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-text-muted mt-0.5">
                        {isAuthenticated
                          ? `${user?.email || user?.username} // ${user?.role}`
                          : 'Spring Boot REST backend (port 8080)'}
                      </p>
                    </div>
                    <div className="mt-3 space-y-2 text-text-secondary font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-text-muted">BACKEND SERVICE:</span>
                        <span className="text-primary font-semibold">
                          SPRING BOOT (8080)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">DATABASE:</span>
                        <span className="text-emerald-600 font-medium">
                          SUPABASE POSTGRESQL
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">FACILITY HUBS:</span>
                        <span>{warehouses.length} Active Hubs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">TOTAL INVENTORY:</span>
                        <span>{products.length} Products</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-surface-border flex gap-2">
                      {isAuthenticated ? (
                        <Button
                          className="w-full text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => {
                            logout()
                            setSystemInfoOpen(false)
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          <LogOut size={13} className="mr-1.5" />
                          Sign Out (Revoke JWT)
                        </Button>
                      ) : (
                        <Button
                          className="w-full text-xs"
                          onClick={() => {
                            setSystemInfoOpen(false)
                            setLoginModalOpen(true)
                          }}
                          size="sm"
                          variant="primary"
                        >
                          <LogIn size={13} className="mr-1.5" />
                          Sign In with Credentials
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Global Omnibox Search Modal */}
        {searchOpen && (
          <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-slate-900/40 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeSearch()
            }}
            role="dialog"
          >
            <div className="w-full max-w-2xl rounded-2xl border border-surface-border bg-white shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col max-h-[80vh]">
              {/* Search Bar Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface-secondary">
                <Search size={18} className="text-primary shrink-0" />
                <input
                  aria-label="Search all workspace entities"
                  className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by SKU, product name, order ID, customer, hub, or supplier..."
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                />
                <kbd className="rounded border border-surface-border bg-white px-1.5 py-0.5 font-mono text-[10px] text-text-muted shrink-0 shadow-2xs">
                  ESC
                </kbd>
              </div>

              {/* Search Results */}
              <div className="p-4 overflow-y-auto space-y-4">
                {!searchQuery.trim() ? (
                  <div className="py-8 text-center text-xs text-text-muted space-y-1">
                    <p className="font-semibold text-text-primary">
                      Global Operational Search
                    </p>
                    <p>
                      Type to search across Products, SKUs, Customer Orders,
                      Suppliers, and Warehouses.
                    </p>
                  </div>
                ) : searchResults && searchResults.totalMatches === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">
                    No entities matched query "{searchQuery}".
                  </div>
                ) : (
                  <>
                    {/* Products */}
                    {searchResults &&
                      searchResults.matchedProducts.length > 0 && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-text-muted tracking-wider mb-2 font-semibold">
                            Products ({searchResults.matchedProducts.length})
                          </p>
                          <div className="space-y-1.5">
                            {searchResults.matchedProducts.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-secondary/60 border border-surface-border hover:bg-surface-blue hover:border-primary/40 cursor-pointer transition-colors"
                                onClick={() => {
                                  closeSearch()
                                  navigate('/app/inventory')
                                }}
                              >
                                <div>
                                  <span className="font-semibold text-xs text-text-primary">
                                    {p.name}
                                  </span>
                                  <span className="ml-2 font-mono text-[11px] text-primary">
                                    {p.sku}
                                  </span>
                                </div>
                                <StatusBadge
                                  size="sm"
                                  tone={
                                    p.stock === 0
                                      ? 'danger'
                                      : p.stock <= p.reorderThreshold
                                        ? 'warning'
                                        : 'success'
                                  }
                                >
                                  {p.stock} units
                                </StatusBadge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Orders */}
                    {searchResults &&
                      searchResults.matchedOrders.length > 0 && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-text-muted tracking-wider mb-2 font-semibold">
                            Orders ({searchResults.matchedOrders.length})
                          </p>
                          <div className="space-y-1.5">
                            {searchResults.matchedOrders.map((o) => (
                              <div
                                key={o.id}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-secondary/60 border border-surface-border hover:bg-surface-blue hover:border-primary/40 cursor-pointer transition-colors"
                                onClick={() => {
                                  closeSearch()
                                  navigate('/app/orders')
                                }}
                              >
                                <div>
                                  <span className="font-mono text-xs font-semibold text-secondary">
                                    {o.id}
                                  </span>
                                  <span className="ml-2 text-xs text-text-secondary">
                                    {o.customerName}
                                  </span>
                                </div>
                                <span className="font-mono text-xs text-text-primary font-semibold">
                                  ₹{o.totalAmount.toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Warehouses */}
                    {searchResults &&
                      searchResults.matchedWarehouses.length > 0 && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-text-muted tracking-wider mb-2 font-semibold">
                            Facilities ({searchResults.matchedWarehouses.length}
                            )
                          </p>
                          <div className="space-y-1.5">
                            {searchResults.matchedWarehouses.map((w) => (
                              <div
                                key={w.id}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-secondary/60 border border-surface-border hover:bg-surface-blue hover:border-primary/40 cursor-pointer transition-colors"
                                onClick={() => {
                                  closeSearch()
                                  navigate('/app/warehouses')
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <Building2
                                    size={14}
                                    className="text-primary"
                                  />
                                  <span className="font-semibold text-xs text-text-primary">
                                    {w.name}
                                  </span>
                                  <span className="text-[11px] text-text-muted">
                                    ({w.city})
                                  </span>
                                </div>
                                <span className="font-mono text-[11px] text-text-muted">
                                  {w.id}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Suppliers */}
                    {searchResults &&
                      searchResults.matchedSuppliers.length > 0 && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-text-muted tracking-wider mb-2 font-semibold">
                            Suppliers ({searchResults.matchedSuppliers.length})
                          </p>
                          <div className="space-y-1.5">
                            {searchResults.matchedSuppliers.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-surface-secondary/60 border border-surface-border hover:bg-surface-blue hover:border-primary/40 cursor-pointer transition-colors"
                                onClick={() => {
                                  closeSearch()
                                  navigate('/app/suppliers')
                                }}
                              >
                                <div>
                                  <span className="font-semibold text-xs text-text-primary">
                                    {s.companyName}
                                  </span>
                                  <span className="ml-2 text-[11px] text-text-muted">
                                    {s.contactPerson}
                                  </span>
                                </div>
                                <StatusBadge
                                  size="sm"
                                  tone={
                                    s.status === 'Active'
                                      ? 'success'
                                      : 'neutral'
                                  }
                                >
                                  {s.status}
                                </StatusBadge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Authentication Modal */}
        {loginModalOpen && (
          <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLoginModalOpen(false)
            }}
            role="dialog"
          >
            <div className="w-full max-w-md rounded-2xl border border-surface-border bg-white shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-primary text-base">
                      Invora Authentication
                    </h3>
                    <p className="text-xs text-text-muted">
                      Sign in to Spring Boot Backend API
                    </p>
                  </div>
                </div>
                <button
                  className="text-text-muted hover:text-text-primary text-xs p-1"
                  onClick={() => setLoginModalOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {loginError && (
                <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Username
                  </label>
                  <input
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-primary outline-none"
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Password
                  </label>
                  <input
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus:border-primary outline-none"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-surface-secondary border border-surface-border text-[11px] text-text-muted">
                  <p className="font-medium text-text-secondary mb-1 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    Verified Backend Credentials:
                  </p>
                  <button
                    type="button"
                    className="text-primary hover:underline font-mono"
                    onClick={() => {
                      setLoginUsername('admin')
                      setLoginPassword('Password@123')
                    }}
                  >
                    Quick fill: admin / Password@123
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-1/2 text-xs"
                    onClick={() => setLoginModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-1/2 text-xs"
                    disabled={loginSubmitting}
                  >
                    {loginSubmitting ? 'Authenticating...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="relative z-10 mx-auto w-full max-w-[1536px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
