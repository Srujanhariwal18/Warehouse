import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  IndianRupee,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextInput } from '@/components/ui/TextInput'
import { formatDate, formatInr } from '@/lib/formatters'
import { useOrdersStore, type CreateOrderItemInput } from '@/lib/orderStore'
import { type Order, type OrderStatus } from '@/mocks/orderData'
import { warehouses, type Product } from '@/mocks/inventoryData'
import { useInventoryStore } from '@/lib/inventoryStore'

export type DateFilterOption = 'all' | '7d' | '30d' | '90d'
export type SortField = 'date' | 'total' | 'id' | 'customer'
export type SortOrder = 'asc' | 'desc'

// eslint-disable-next-line react-refresh/only-export-components
export function isOrderWithinDateRange(
  createdAt: string,
  filter: DateFilterOption,
  referenceDate: Date = new Date(),
): boolean {
  if (filter === 'all') return true

  const parts = createdAt.split('-').map(Number)
  if (
    parts.length < 3 ||
    isNaN(parts[0]) ||
    isNaN(parts[1]) ||
    isNaN(parts[2])
  ) {
    return false
  }
  const [year, month, day] = parts

  const orderDate = new Date(year, month - 1, day)
  const refDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )

  const diffMs = refDate.getTime() - orderDate.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (diffDays < 0) return false
  if (filter === '7d') return diffDays <= 7
  if (filter === '30d') return diffDays <= 30
  if (filter === '90d') return diffDays <= 90

  return true
}

const statusOptions: Array<'All statuses' | OrderStatus> = [
  'All statuses',
  'Pending',
  'Processing',
  'Completed',
  'Cancelled',
]

const pageSizes = [10, 20, 40]

function statusToneFor(status: OrderStatus) {
  switch (status) {
    case 'Completed':
      return 'success' as const
    case 'Pending':
      return 'warning' as const
    case 'Cancelled':
      return 'danger' as const
    case 'Processing':
    default:
      return 'neutral' as const
  }
}

export function OrdersPage() {
  const { createOrder, orders, updateOrderStatus, cancelOrder } =
    useOrdersStore()
  const { products: liveProducts } = useInventoryStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'All statuses' | OrderStatus
  >('All statuses')
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all')
  const [warehouseFilter, setWarehouseFilter] = useState('All warehouses')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const warehouseMap = useMemo(
    () => new Map(warehouses.map((w) => [w.id, w])),
    [],
  )

  // Sync selected order reactively with store
  const activeSelectedOrder = useMemo(() => {
    if (!selectedOrder) return null
    return orders.find((o) => o.id === selectedOrder.id) ?? null
  }, [orders, selectedOrder])

  // Summary counts
  const summary = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === 'Pending').length
    const processing = orders.filter((o) => o.status === 'Processing').length
    const completed = orders.filter((o) => o.status === 'Completed').length
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length
    const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    return { total, pending, processing, completed, cancelled, totalValue }
  }, [orders])

  // Filter & Sort
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders
      .filter((order) => {
        // Search query
        if (query) {
          const matchesId = order.id.toLowerCase().includes(query)
          const matchesName = order.customerName.toLowerCase().includes(query)
          const matchesEmail = order.customerEmail.toLowerCase().includes(query)
          if (!matchesId && !matchesName && !matchesEmail) return false
        }

        // Status
        if (statusFilter !== 'All statuses' && order.status !== statusFilter) {
          return false
        }

        // Warehouse
        if (
          warehouseFilter !== 'All warehouses' &&
          order.warehouseId !== warehouseFilter
        ) {
          return false
        }

        // Date range
        if (!isOrderWithinDateRange(order.createdAt, dateFilter)) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        let comp = 0
        if (sortField === 'date') {
          comp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        } else if (sortField === 'total') {
          comp = a.totalAmount - b.totalAmount
        } else if (sortField === 'customer') {
          comp = a.customerName.localeCompare(b.customerName)
        } else if (sortField === 'id') {
          comp = a.id.localeCompare(b.id)
        }
        return sortOrder === 'asc' ? comp : -comp
      })
  }, [
    orders,
    search,
    statusFilter,
    warehouseFilter,
    dateFilter,
    sortField,
    sortOrder,
  ])

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const visibleOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'All statuses' ||
    dateFilter !== 'all' ||
    warehouseFilter !== 'All warehouses'

  function resetFilters() {
    setSearch('')
    setStatusFilter('All statuses')
    setDateFilter('all')
    setWarehouseFilter('All warehouses')
    setPage(1)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        action={
          <Button
            onClick={() => {
              setNotice(null)
              setCreateDialogOpen(true)
            }}
          >
            <Plus aria-hidden="true" size={17} />
            Create order
          </Button>
        }
        description="Inspect, track, and process warehouse customer orders across all locations."
        eyebrow="Workspace"
        title="Orders"
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-xs text-text-secondary">
        <span className="h-2 w-2 rounded-full bg-secondary" />
        Mock data preview — order operations and status transitions stay in this
        browser session and do not affect live systems.
      </div>

      {notice && !createDialogOpen && !cancelTargetOrder && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-success/30 bg-success/5 text-success' : 'border-danger/30 bg-danger/5 text-danger'}`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          {notice.message}
          <button
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-sm">Total orders</span>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Package aria-hidden="true" size={17} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-text-primary">
            {summary.total.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-text-muted">All registered orders</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-sm">Pending orders</span>
            <span className="rounded-lg bg-warning/10 p-2 text-warning">
              <Clock aria-hidden="true" size={17} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-warning">
            {summary.pending.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-text-muted">Awaiting fulfillment</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-sm">Processing</span>
            <span className="rounded-lg bg-secondary/10 p-2 text-secondary">
              <RefreshCw aria-hidden="true" size={17} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-secondary">
            {summary.processing.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-text-muted">In warehouse queue</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-sm">Completed</span>
            <span className="rounded-lg bg-success/10 p-2 text-success">
              <CheckCircle2 aria-hidden="true" size={17} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-success">
            {summary.completed.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-text-muted">Fulfilled & dispatched</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-sm">Mock order value</span>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <IndianRupee aria-hidden="true" size={17} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-text-primary">
            {formatInr(summary.totalValue)}
          </p>
          <p className="mt-1 text-xs text-text-muted">Total catalogue demand</p>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(3,1fr)_auto]">
          <label className="relative">
            <span className="sr-only">Search orders</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              aria-label="Search orders by ID or customer"
              className="h-11 w-full rounded-xl border border-surface-3 bg-sidebar pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by order ID or customer"
              value={search}
            />
          </label>

          <select
            aria-label="Filter by order status"
            className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-secondary outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            onChange={(e) => {
              setStatusFilter(e.target.value as 'All statuses' | OrderStatus)
              setPage(1)
            }}
            value={statusFilter}
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by date range"
            className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-secondary outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            onChange={(e) => {
              setDateFilter(e.target.value as DateFilterOption)
              setPage(1)
            }}
            value={dateFilter}
          >
            <option value="all">All dates</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <select
            aria-label="Filter by warehouse"
            className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-secondary outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            onChange={(e) => {
              setWarehouseFilter(e.target.value)
              setPage(1)
            }}
            value={warehouseFilter}
          >
            <option value="All warehouses">All warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              aria-label="Rows per page"
              className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-secondary outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              value={pageSize}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <Button
                aria-label="Clear active filters"
                className="whitespace-nowrap px-3 text-xs"
                onClick={resetFilters}
                variant="secondary"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-3/70 px-5 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Orders overview
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {filteredOrders.length} order
              {filteredOrders.length === 1 ? '' : 's'} found
            </p>
          </div>
          <span className="hidden text-xs text-text-muted sm:inline">
            Select an order row to inspect details and history
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-5">
            <EmptyState
              action={
                hasActiveFilters ? (
                  <Button onClick={resetFilters} variant="secondary">
                    Clear active filters
                  </Button>
                ) : (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus size={16} /> Create first order
                  </Button>
                )
              }
              description={
                hasActiveFilters
                  ? 'No orders match your filter criteria. Try clearing search keywords or status filters.'
                  : 'No orders are registered in the current preview dataset.'
              }
              title="No orders found"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-sidebar/60 text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    <button
                      className="inline-flex items-center gap-1 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      onClick={() => toggleSort('id')}
                      type="button"
                    >
                      Order ID
                      <ArrowUpDown size={13} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      className="inline-flex items-center gap-1 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      onClick={() => toggleSort('customer')}
                      type="button"
                    >
                      Customer
                      <ArrowUpDown size={13} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      className="inline-flex items-center gap-1 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      onClick={() => toggleSort('date')}
                      type="button"
                    >
                      Order Date
                      <ArrowUpDown size={13} />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">Warehouse</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      className="inline-flex items-center gap-1 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      onClick={() => toggleSort('total')}
                      type="button"
                    >
                      Total Amount
                      <ArrowUpDown size={13} />
                    </button>
                  </th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/60">
                {visibleOrders.map((order) => {
                  const warehouse = warehouseMap.get(order.warehouseId)
                  const totalUnits = order.items.reduce(
                    (s, i) => s + i.quantity,
                    0,
                  )

                  return (
                    <tr
                      className="text-text-secondary transition-colors hover:bg-surface-2/40"
                      key={order.id}
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-text-primary">
                        <button
                          className="hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                          onClick={() => setSelectedOrder(order)}
                          type="button"
                        >
                          {order.id}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-text-primary">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-text-muted">
                          {order.customerEmail || order.customerPhone}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        {warehouse?.name ?? 'Unassigned'}
                      </td>
                      <td className="px-4 py-4">
                        {order.items.length} line item
                        {order.items.length === 1 ? '' : 's'}
                        <span className="ml-1 text-xs text-text-muted">
                          ({totalUnits} units)
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-text-primary">
                        {formatInr(order.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={statusToneFor(order.status)}>
                          {order.status}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          aria-label={`View order ${order.id}`}
                          className="px-2"
                          onClick={() => setSelectedOrder(order)}
                          variant="ghost"
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col gap-3 border-t border-surface-3/70 px-5 py-4 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing{' '}
            {filteredOrders.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredOrders.length)} of{' '}
            {filteredOrders.length} orders
          </span>

          <div className="flex items-center gap-2">
            <Button
              aria-label="Previous page"
              className="px-2"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              variant="ghost"
            >
              <ChevronLeft size={17} />
            </Button>
            <span className="text-xs">
              Page {page} of {pageCount}
            </span>
            <Button
              aria-label="Next page"
              className="px-2"
              disabled={page === pageCount || filteredOrders.length === 0}
              onClick={() => setPage((p) => p + 1)}
              variant="ghost"
            >
              <ChevronRight size={17} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Order Details Drawer */}
      {activeSelectedOrder && (
        <OrderDetailsDrawer
          onCancelRequest={(order) => setCancelTargetOrder(order)}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(nextStatus) => {
            const res = updateOrderStatus(activeSelectedOrder.id, nextStatus)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Order ${activeSelectedOrder.id} status updated to ${nextStatus}.`,
              })
            } else {
              setNotice({
                type: 'error',
                message: res.message,
              })
            }
          }}
          order={activeSelectedOrder}
        />
      )}

      {/* Cancellation Confirmation Dialog */}
      {cancelTargetOrder && (
        <CancelConfirmDialog
          onCancel={() => setCancelTargetOrder(null)}
          onConfirm={(reason) => {
            const res = cancelOrder(cancelTargetOrder.id, reason)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Order ${cancelTargetOrder.id} has been cancelled.`,
              })
            } else {
              setNotice({
                type: 'error',
                message: res.message,
              })
            }
            setCancelTargetOrder(null)
          }}
          order={cancelTargetOrder}
        />
      )}

      {/* Create Order Dialog */}
      {createDialogOpen && (
        <CreateOrderDialog
          onClose={() => setCreateDialogOpen(false)}
          onCreate={(input) => {
            const res = createOrder(input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Order ${res.id} successfully created.`,
              })
              setCreateDialogOpen(false)
            }
            return res
          }}
          products={liveProducts}
        />
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Order Details Drawer
// -----------------------------------------------------------------------------

function OrderDetailsDrawer({
  onCancelRequest,
  onClose,
  onStatusChange,
  order,
}: {
  onCancelRequest: (order: Order) => void
  onClose: () => void
  onStatusChange: (status: OrderStatus) => void
  order: Order
}) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const drawerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null
    const closeBtn = drawerRef.current?.querySelector<HTMLButtonElement>(
      'button[aria-label="Close order details"]',
    )
    closeBtn?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      triggerRef.current?.focus()
    }
  }, [onClose])

  const warehouse = warehouses.find((w) => w.id === order.warehouseId)

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <aside
        aria-label="Order details"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-surface-3 bg-sidebar p-6 shadow-2xl shadow-black/40 overflow-y-auto"
        ref={drawerRef}
        role="dialog"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Order inspection
            </span>
            <StatusBadge tone={statusToneFor(order.status)}>
              {order.status}
            </StatusBadge>
          </div>
          <Button
            aria-label="Close order details"
            onClick={onClose}
            variant="ghost"
          >
            <X size={18} />
          </Button>
        </div>

        <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-text-primary">
          {order.id}
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Created on {formatDate(order.createdAt)}
        </p>

        {/* Customer & Warehouse Cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-surface-3/80 bg-surface/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Customer
            </p>
            <p className="mt-2 text-sm font-medium text-text-primary">
              {order.customerName}
            </p>
            <p className="text-xs text-text-secondary">{order.customerEmail}</p>
            <p className="text-xs text-text-muted">{order.customerPhone}</p>
          </div>

          <div className="rounded-xl border border-surface-3/80 bg-surface/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Fulfillment Location
            </p>
            <p className="mt-2 text-sm font-medium text-text-primary">
              {warehouse?.name ?? 'Unassigned'}
            </p>
            <p className="text-xs text-text-secondary">{warehouse?.city}</p>
          </div>
        </div>

        {order.notes && (
          <div className="mt-4 rounded-xl border border-surface-3 bg-surface/20 p-3 text-xs text-text-secondary">
            <span className="font-medium text-text-primary">Notes: </span>
            {order.notes}
          </div>
        )}

        {/* Itemized list */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text-primary">
            Line Items ({order.items.length})
          </h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-surface-3/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium text-right">
                    Unit Price
                  </th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/60">
                {order.items.map((item, idx) => (
                  <tr key={`${item.productId}-${idx}`}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-text-primary">
                        {item.productName}
                      </p>
                      <p className="font-mono text-[10px] text-text-muted">
                        {item.sku}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right text-text-secondary">
                      {formatInr(item.unitPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-text-primary">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-text-primary">
                      {formatInr(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-2/80 font-medium">
                <tr>
                  <td className="px-3 py-2.5 text-text-primary" colSpan={3}>
                    Order Total
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-semibold text-primary">
                    {formatInr(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Status Actions */}
        <div className="mt-6 border-t border-surface-3/80 pt-6">
          <h3 className="text-sm font-semibold text-text-primary">
            Order Status Actions
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {order.status === 'Pending' && (
              <>
                <Button
                  className="text-xs"
                  onClick={() => onStatusChange('Processing')}
                >
                  <RefreshCw size={14} />
                  Move to processing
                </Button>
                <Button
                  className="text-xs"
                  onClick={() => onCancelRequest(order)}
                  variant="secondary"
                >
                  <XCircle size={14} />
                  Cancel order
                </Button>
              </>
            )}

            {order.status === 'Processing' && (
              <>
                <Button
                  className="text-xs"
                  onClick={() => onStatusChange('Completed')}
                >
                  <CheckCircle2 size={14} />
                  Mark completed
                </Button>
                <Button
                  className="text-xs"
                  onClick={() => onCancelRequest(order)}
                  variant="secondary"
                >
                  <XCircle size={14} />
                  Cancel order
                </Button>
              </>
            )}

            {order.status === 'Completed' && (
              <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-xs text-success">
                <CheckCircle2 size={15} />
                Order fulfilled and finalized. No further transitions allowed.
              </div>
            )}

            {order.status === 'Cancelled' && (
              <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
                <XCircle size={15} />
                Order cancelled. No further actions permitted.
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="mt-6 border-t border-surface-3/80 pt-6">
          <h3 className="text-sm font-semibold text-text-primary">
            Activity Timeline
          </h3>
          <div className="mt-3 space-y-3">
            {order.timeline.map((event) => (
              <div
                className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-full before:w-0.5 before:bg-surface-3 last:before:hidden"
                key={event.id}
              >
                <span className="absolute left-0.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-sidebar" />
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-text-primary">
                    {event.status}
                  </span>
                  <span className="text-text-muted">
                    {new Date(event.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {event.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

// -----------------------------------------------------------------------------
// Cancel Confirmation Dialog
// -----------------------------------------------------------------------------

function CancelConfirmDialog({
  onCancel,
  onConfirm,
  order,
}: {
  onCancel: () => void
  onConfirm: (reason: string) => void
  order: Order
}) {
  const [reason, setReason] = useState('')
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      triggerRef.current?.focus()
    }
  }, [onCancel])

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-danger">
          <AlertTriangle size={22} />
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Cancel Order {order.id}?
          </h2>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Are you sure you want to cancel this order for{' '}
          <strong className="text-text-primary">{order.customerName}</strong>?
          Once cancelled, this order cannot be reopened or fulfilled.
        </p>

        <div className="mt-4">
          <TextInput
            label="Cancellation reason (optional)"
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation, out of stock"
            value={reason}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="ghost">
            Keep order
          </Button>
          <Button
            className="bg-danger hover:bg-danger/90 text-white"
            onClick={() => onConfirm(reason)}
          >
            Confirm cancellation
          </Button>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Create Order Dialog
// -----------------------------------------------------------------------------

type CreateOrderFormLine = {
  productId: string
  quantity: string
}

function CreateOrderDialog({
  onClose,
  onCreate,
  products,
}: {
  onClose: () => void
  onCreate: (input: {
    customerName: string
    customerEmail: string
    customerPhone: string
    warehouseId: string
    items: CreateOrderItemInput[]
    notes?: string
  }) => { ok: true; id?: string } | { ok: false; message: string }
  products: Product[]
}) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [warehouseId, setWarehouseId] = useState(warehouses[0].id)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Initial line item: pick first available product
  const defaultProduct = products.find((p) => p.stock > 0) ?? products[0]
  const [lines, setLines] = useState<CreateOrderFormLine[]>([
    { productId: defaultProduct ? defaultProduct.id : '', quantity: '1' },
  ])

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      triggerRef.current?.focus()
    }
  }, [onClose])

  function updateLine(
    index: number,
    field: keyof CreateOrderFormLine,
    value: string,
  ) {
    setError(null)
    setLines((current) =>
      current.map((line, idx) =>
        idx === index ? { ...line, [field]: value } : line,
      ),
    )
  }

  function addLine() {
    setError(null)
    const nextProduct =
      products.find(
        (p) => p.stock > 0 && !lines.some((l) => l.productId === p.id),
      ) ?? defaultProduct
    if (nextProduct) {
      setLines((current) => [
        ...current,
        { productId: nextProduct.id, quantity: '1' },
      ])
    }
  }

  function removeLine(index: number) {
    setError(null)
    if (lines.length <= 1) return
    setLines((current) => current.filter((_, idx) => idx !== index))
  }

  // Calculate live order total
  const calculatedTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const prod = products.find((p) => p.id === line.productId)
      const qty = Number(line.quantity)
      if (prod && Number.isFinite(qty) && qty > 0) {
        return sum + qty * prod.price
      }
      return sum
    }, 0)
  }, [lines, products])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!customerName.trim()) {
      setError('Customer name is required.')
      return
    }

    if (lines.length === 0) {
      setError('Please add at least one line item to the order.')
      return
    }

    const rawItems: CreateOrderItemInput[] = []
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx]
      const prod = products.find((p) => p.id === line.productId)
      if (!prod) {
        setError(`Product in item #${idx + 1} is not valid.`)
        return
      }

      const parsedQty = Number(line.quantity)
      if (
        !line.quantity.trim() ||
        !Number.isFinite(parsedQty) ||
        !Number.isInteger(parsedQty) ||
        parsedQty <= 0
      ) {
        setError(
          `Quantity for "${prod.name}" must be a whole number greater than zero.`,
        )
        return
      }

      rawItems.push({
        productId: prod.id,
        quantity: parsedQty,
      })
    }

    // Aggregate quantities by productId before validating stock
    const aggregatedQuantities = new Map<string, number>()
    for (const item of rawItems) {
      const current = aggregatedQuantities.get(item.productId) ?? 0
      aggregatedQuantities.set(item.productId, current + item.quantity)
    }

    for (const [productId, combinedQty] of aggregatedQuantities.entries()) {
      const prod = products.find((p) => p.id === productId)
      if (prod && combinedQty > prod.stock) {
        const hasDuplicates =
          rawItems.filter((i) => i.productId === productId).length > 1
        setError(
          hasDuplicates
            ? `Combined quantity for "${prod.name}" (${combinedQty} units) exceeds available stock (${prod.stock} units).`
            : `Quantity for "${prod.name}" (${combinedQty}) exceeds current available stock (${prod.stock} units).`,
        )
        return
      }
    }

    const res = onCreate({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      warehouseId,
      items: rawItems,
      notes: notes.trim() || undefined,
    })

    if (!res.ok) {
      setError(res.message)
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Create New Order
          </h2>
          <Button aria-label="Close dialog" onClick={onClose} variant="ghost">
            <X size={18} />
          </Button>
        </div>

        <p className="mt-1 text-xs text-text-muted">
          Register a customer order in the workspace. Inventory quantities are
          not deducted in this phase.
        </p>

        {error && (
          <div
            className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
            role="alert"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Customer info */}
          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput
              label="Customer name"
              onChange={(e) => {
                setError(null)
                setCustomerName(e.target.value)
              }}
              placeholder="e.g. Acme Corp / Rahul V"
              required
              value={customerName}
            />
            <TextInput
              label="Email address"
              onChange={(e) => {
                setError(null)
                setCustomerEmail(e.target.value)
              }}
              placeholder="contact@example.com"
              type="email"
              value={customerEmail}
            />
            <TextInput
              label="Phone number"
              onChange={(e) => {
                setError(null)
                setCustomerPhone(e.target.value)
              }}
              placeholder="+91 98000 00000"
              value={customerPhone}
            />
          </div>

          {/* Warehouse */}
          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Fulfillment warehouse
            <select
              className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              onChange={(e) => setWarehouseId(e.target.value)}
              value={warehouseId}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.city})
                </option>
              ))}
            </select>
          </label>

          {/* Line items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">
                Order Items
              </span>
              <Button
                className="h-8 px-2 text-xs"
                onClick={addLine}
                type="button"
                variant="secondary"
              >
                <Plus size={14} /> Add item
              </Button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId)
                const qty = Number(line.quantity) || 0
                const itemTotal = prod ? qty * prod.price : 0

                return (
                  <div
                    className="grid items-end gap-2 rounded-xl border border-surface-3/80 bg-sidebar/50 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
                    key={idx}
                  >
                    <label className="grid gap-1 text-xs text-text-muted">
                      Product
                      <select
                        className="h-10 rounded-lg border border-surface-3 bg-surface px-2 text-xs text-text-primary outline-none focus:border-primary"
                        onChange={(e) =>
                          updateLine(idx, 'productId', e.target.value)
                        }
                        value={line.productId}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — {formatInr(p.price)} [Stock:{' '}
                            {p.stock}]
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1 text-xs text-text-muted">
                      Quantity (Max: {prod?.stock ?? 0})
                      <input
                        className="h-10 rounded-lg border border-surface-3 bg-surface px-2 text-xs text-text-primary outline-none focus:border-primary"
                        max={prod?.stock ?? 9999}
                        min="1"
                        onChange={(e) =>
                          updateLine(idx, 'quantity', e.target.value)
                        }
                        required
                        step="1"
                        type="number"
                        value={line.quantity}
                      />
                    </label>

                    <div className="text-right">
                      <p className="text-[10px] text-text-muted">Line Total</p>
                      <p className="font-medium text-text-primary text-xs">
                        {formatInr(itemTotal)}
                      </p>
                    </div>

                    <Button
                      aria-label="Remove item"
                      className="h-10 px-2 text-text-muted hover:text-danger"
                      disabled={lines.length <= 1}
                      onClick={() => removeLine(idx)}
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Order notes (optional)
            <textarea
              className="h-20 rounded-xl border border-surface-3 bg-sidebar p-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Shipping instructions, client PO reference, delivery notes..."
              value={notes}
            />
          </label>

          {/* Order Summary footer */}
          <div className="flex items-center justify-between rounded-xl bg-surface-2 p-4">
            <div>
              <p className="text-xs text-text-muted">Calculated Total</p>
              <p className="font-display text-xl font-semibold text-primary">
                {formatInr(calculatedTotal)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose} type="button" variant="ghost">
                Cancel
              </Button>
              <Button type="submit">Create order</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
