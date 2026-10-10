import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpDown,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Plus,
  Search,
  Sliders,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextInput } from '@/components/ui/TextInput'
import { formatDate } from '@/lib/formatters'
import { useInventoryStore } from '@/lib/inventoryStore'
import { useWarehouseStore } from '@/lib/warehouseStore'
import { useSuppliersStore } from '@/lib/supplierStore'
import {
  getProductStockAtWarehouse,
  useTransactionStore,
  validateAdjustmentInput,
  validateStockInInput,
  validateStockOutInput,
  validateTransferInput,
} from '@/lib/transactionStore'
import type {
  CreateAdjustmentInput,
  CreateStockInInput,
  CreateStockOutInput,
  CreateTransferInput,
  StockTransactionRecord,
  TransactionType,
} from '@/mocks/transactionData'
import type { Product, Warehouse } from '@/mocks/inventoryData'
import type { Supplier } from '@/mocks/supplierData'

type TypeFilterOption = 'All' | TransactionType
type DateFilterOption = 'all' | 'today' | '7d' | '30d' | '90d'
type SortField = 'timestamp' | 'quantity' | 'type' | 'product'
type SortOrder = 'asc' | 'desc'

function isWithinDateFilter(
  isoString: string,
  filter: DateFilterOption,
  now: Date,
) {
  if (filter === 'all') return true
  const txDate = new Date(isoString)
  const diffTime = now.getTime() - txDate.getTime()
  const diffDays = diffTime / (1000 * 3600 * 24)

  if (filter === 'today') {
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() === now.getMonth() &&
      txDate.getDate() === now.getDate()
    )
  }
  if (filter === '7d') return diffDays <= 7
  if (filter === '30d') return diffDays <= 30
  if (filter === '90d') return diffDays <= 90
  return true
}

const pageSizes = [10, 20, 40]

export function StockTransactionsPage() {
  const {
    transactions,
    createStockIn,
    createStockOut,
    createAdjustment,
    createTransfer,
  } = useTransactionStore()

  const { products } = useInventoryStore()
  const { warehouses } = useWarehouseStore()
  const { suppliers } = useSuppliersStore()

  // Filters and controls
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilterOption>('All')
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Drawer and Dialog state
  const [selectedTxn, setSelectedTxn] = useState<StockTransactionRecord | null>(
    null,
  )
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Feedback notice banner
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  // Warehouse name lookup
  const warehousesById = useMemo(() => {
    const map = new Map<string, Warehouse>()
    for (const w of warehouses) {
      map.set(w.id, w)
    }
    return map
  }, [warehouses])

  // KPI Calculations
  const stats = useMemo(() => {
    const totalTransactions = transactions.length
    const totalReceived = transactions
      .filter((t) => t.type === 'Stock In')
      .reduce((sum, t) => sum + t.quantity, 0)
    const totalDispatched = transactions
      .filter((t) => t.type === 'Stock Out')
      .reduce((sum, t) => sum + t.quantity, 0)
    const adjustmentsAndTransfers = transactions.filter(
      (t) => t.type === 'Adjustment' || t.type === 'Transfer',
    ).length

    return {
      totalTransactions,
      totalReceived,
      totalDispatched,
      adjustmentsAndTransfers,
    }
  }, [transactions])

  // Date filtering helper
  const now = useMemo(() => new Date(), [])

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase()

    return transactions
      .filter((t) => {
        // Type filter
        if (typeFilter !== 'All' && t.type !== typeFilter) return false

        // Warehouse filter (matches source, destination, or primary warehouse)
        if (warehouseFilter !== 'All') {
          const matchWh =
            t.warehouseId === warehouseFilter ||
            t.sourceWarehouseId === warehouseFilter ||
            t.destinationWarehouseId === warehouseFilter
          if (!matchWh) return false
        }

        // Status filter
        if (statusFilter !== 'All' && t.status !== statusFilter) return false

        // Date filter
        if (!isWithinDateFilter(t.timestamp, dateFilter, now)) return false

        // Text search
        if (!q) return true
        const matchId = t.id.toLowerCase().includes(q)
        const matchProduct = t.productName.toLowerCase().includes(q)
        const matchSku = t.sku.toLowerCase().includes(q)
        const matchRef = t.referenceNumber?.toLowerCase().includes(q) ?? false
        const matchReason = t.reason?.toLowerCase().includes(q) ?? false

        return matchId || matchProduct || matchSku || matchRef || matchReason
      })
      .sort((a, b) => {
        let diff = 0
        if (sortField === 'timestamp') {
          diff =
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        } else if (sortField === 'quantity') {
          diff = a.quantity - b.quantity
        } else if (sortField === 'type') {
          diff = a.type.localeCompare(b.type)
        } else if (sortField === 'product') {
          diff = a.productName.localeCompare(b.productName)
        }
        return sortOrder === 'asc' ? diff : -diff
      })
  }, [
    transactions,
    search,
    typeFilter,
    warehouseFilter,
    statusFilter,
    dateFilter,
    sortField,
    sortOrder,
    now,
  ])

  const pageCount = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize),
  )
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredTransactions.slice(start, start + pageSize)
  }, [filteredTransactions, page, pageSize])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const hasActiveFilters = Boolean(
    search ||
    typeFilter !== 'All' ||
    warehouseFilter !== 'All' ||
    statusFilter !== 'All' ||
    dateFilter !== 'all',
  )

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('All')
    setWarehouseFilter('All')
    setStatusFilter('All')
    setDateFilter('all')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        action={
          <Button
            className="flex items-center gap-2"
            onClick={() => setCreateDialogOpen(true)}
            variant="primary"
          >
            <Plus size={16} />
            Record Transaction
          </Button>
        }
        description="Audit real-time inventory inflows, dispatches, physical count adjustments, and inter-facility warehouse transfers with immutable historical logs."
        title="Stock Transactions & Movement History"
      />

      {/* Notice Banner */}
      {notice && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
            notice.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? (
              <CheckCircle2 className="shrink-0" size={18} />
            ) : (
              <AlertCircle className="shrink-0" size={18} />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            aria-label="Dismiss message"
            className="text-current hover:opacity-75"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Transactions
            </span>
            <FileText className="text-primary" size={20} />
          </div>
          <div className="mt-3 font-mono text-3xl font-bold text-text-primary">
            {stats.totalTransactions}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            Recorded audit events
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Stock In (Received)
            </span>
            <ArrowDownLeft className="text-success" size={20} />
          </div>
          <div className="mt-3 font-mono text-3xl font-bold text-text-primary">
            +{stats.totalReceived.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            Units received into facilities
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Stock Out (Dispatched)
            </span>
            <ArrowUpRight className="text-danger" size={20} />
          </div>
          <div className="mt-3 font-mono text-3xl font-bold text-text-primary">
            -{stats.totalDispatched.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            Units fulfilled and shipped
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Adjustments & Transfers
            </span>
            <ArrowLeftRight className="text-accent" size={20} />
          </div>
          <div className="mt-3 font-mono text-3xl font-bold text-text-primary">
            {stats.adjustmentsAndTransfers}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            Reconciliations and relocations
          </div>
        </Card>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              aria-label="Search transactions"
              className="h-10 w-full rounded-xl border border-surface-3 bg-sidebar pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by transaction ID, product name, SKU, reference, or reason..."
              value={search}
            />
            {search && (
              <button
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                onClick={() => setSearch('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex flex-wrap rounded-xl border border-surface-3 bg-sidebar p-1">
            {(
              [
                'All',
                'Stock In',
                'Stock Out',
                'Adjustment',
                'Transfer',
              ] as TypeFilterOption[]
            ).map((t) => (
              <button
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-surface text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                key={t}
                onClick={() => {
                  setTypeFilter(t)
                  setPage(1)
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-surface-3/60 text-xs">
          {/* Date range filter */}
          <label className="flex items-center gap-1.5 text-text-muted">
            <Calendar size={13} />
            Period:
            <select
              aria-label="Filter by date range"
              className="rounded-lg border border-surface-3 bg-sidebar px-2.5 py-1 text-xs text-text-primary outline-none cursor-pointer"
              onChange={(e) => {
                setDateFilter(e.target.value as DateFilterOption)
                setPage(1)
              }}
              value={dateFilter}
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>

          {/* Warehouse filter */}
          <label className="flex items-center gap-1.5 text-text-muted">
            <Building2 size={13} />
            Warehouse:
            <select
              aria-label="Filter by warehouse"
              className="rounded-lg border border-surface-3 bg-sidebar px-2.5 py-1 text-xs text-text-primary outline-none cursor-pointer"
              onChange={(e) => {
                setWarehouseFilter(e.target.value)
                setPage(1)
              }}
              value={warehouseFilter}
            >
              <option value="All">All warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>

          {/* Status filter */}
          <label className="flex items-center gap-1.5 text-text-muted">
            Status:
            <select
              aria-label="Filter by status"
              className="rounded-lg border border-surface-3 bg-sidebar px-2.5 py-1 text-xs text-text-primary outline-none cursor-pointer"
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              value={statusFilter}
            >
              <option value="All">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </label>

          {hasActiveFilters && (
            <Button
              className="ml-auto text-xs text-text-muted hover:text-text-primary"
              onClick={resetFilters}
              variant="ghost"
            >
              Reset filters
            </Button>
          )}
          {!hasActiveFilters && (
            <div className="ml-auto text-xs text-text-muted">
              {filteredTransactions.length}{' '}
              {filteredTransactions.length === 1
                ? 'transaction'
                : 'transactions'}
            </div>
          )}
        </div>
      </Card>

      {/* Transactions Table / Cards */}
      <Card className="overflow-hidden">
        {paginatedTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="border-b border-surface-3 bg-sidebar text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('timestamp')}
                  >
                    <div className="flex items-center gap-1.5">
                      Transaction ID & Time
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('type')}
                  >
                    <div className="flex items-center gap-1.5">
                      Type
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('product')}
                  >
                    <div className="flex items-center gap-1.5">
                      Product & SKU
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('quantity')}
                  >
                    <div className="flex items-center gap-1.5">
                      Movement
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-5 py-3.5">Facility / Route</th>
                  <th className="px-5 py-3.5">Stock Impact</th>
                  <th className="px-5 py-3.5">Reference / Notes</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/60">
                {paginatedTransactions.map((tx) => {
                  const sourceWh = tx.sourceWarehouseId
                    ? warehousesById.get(tx.sourceWarehouseId)
                    : undefined
                  const destWh = tx.destinationWarehouseId
                    ? warehousesById.get(tx.destinationWarehouseId)
                    : undefined
                  const primaryWh = warehousesById.get(tx.warehouseId)

                  return (
                    <tr
                      className="group transition-colors hover:bg-surface-3/30"
                      key={tx.id}
                    >
                      {/* ID and Time */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-text-primary">
                          {tx.id}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {formatDate(tx.date)}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <TransactionTypeBadge type={tx.type} />
                      </td>

                      {/* Product & SKU */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-text-primary">
                          {tx.productName}
                        </div>
                        <div className="font-mono text-[11px] text-text-muted mt-0.5">
                          {tx.sku}
                        </div>
                      </td>

                      {/* Quantity / Movement */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <MovementIndicator
                          quantity={tx.quantity}
                          type={tx.type}
                        />
                      </td>

                      {/* Facility / Route */}
                      <td className="px-5 py-4 text-xs whitespace-nowrap">
                        {tx.type === 'Transfer' ? (
                          <div className="flex items-center gap-1.5 text-text-primary">
                            <span>
                              {sourceWh?.name ?? tx.sourceWarehouseId}
                            </span>
                            <span className="text-text-muted">➔</span>
                            <span className="text-accent font-medium">
                              {destWh?.name ?? tx.destinationWarehouseId}
                            </span>
                          </div>
                        ) : (
                          <div className="text-text-primary">
                            {(tx.type === 'Stock In' ? destWh : sourceWh)
                              ?.name ??
                              primaryWh?.name ??
                              tx.warehouseId}
                          </div>
                        )}
                      </td>

                      {/* Stock Impact */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs font-mono text-text-muted">
                        <span className="text-text-secondary">
                          {tx.previousStock}
                        </span>{' '}
                        <span>➔</span>{' '}
                        <span className="font-semibold text-text-primary">
                          {tx.resultingStock}
                        </span>
                      </td>

                      {/* Reference / Reason */}
                      <td className="px-5 py-4 text-xs max-w-xs truncate">
                        {tx.referenceNumber && (
                          <span className="font-mono font-medium text-text-primary mr-1.5">
                            {tx.referenceNumber}
                          </span>
                        )}
                        <span className="text-text-muted">
                          {tx.reason ?? '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge
                          tone={
                            tx.status === 'Completed' ? 'success' : 'neutral'
                          }
                        >
                          {tx.status}
                        </StatusBadge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Button
                          aria-label={`View details for transaction ${tx.id}`}
                          className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                          onClick={() => setSelectedTxn(tx)}
                          variant="ghost"
                        >
                          <Eye size={15} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              action={
                hasActiveFilters ? (
                  <Button onClick={resetFilters} variant="secondary">
                    Clear filters
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    variant="primary"
                  >
                    Record first transaction
                  </Button>
                )
              }
              description={
                hasActiveFilters
                  ? 'No transactions match your current search and filter criteria. Try clearing filters.'
                  : 'No inventory transactions recorded yet. Record your first stock movement to build an audit trail.'
              }
              title={
                hasActiveFilters
                  ? 'No matching transactions'
                  : 'No transactions recorded'
              }
            />
          </div>
        )}

        {/* Pagination Toolbar */}
        {filteredTransactions.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-3/80 px-5 py-4 text-xs text-text-muted sm:flex-row">
            <div>
              Showing{' '}
              <span className="font-medium text-text-primary">
                {(page - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-text-primary">
                {Math.min(page * pageSize, filteredTransactions.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-text-primary">
                {filteredTransactions.length}
              </span>{' '}
              transactions
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5">
                Rows per page:
                <select
                  aria-label="Rows per page"
                  className="rounded-lg border border-surface-3 bg-sidebar px-2 py-1 text-xs text-text-primary outline-none cursor-pointer"
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  value={pageSize}
                >
                  {pageSizes.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-1">
                <Button
                  aria-label="Previous page"
                  className="px-2"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  variant="ghost"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-2 font-mono text-text-primary">
                  {page} / {pageCount}
                </span>
                <Button
                  aria-label="Next page"
                  className="px-2"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  variant="ghost"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Transaction Details Drawer */}
      {selectedTxn && (
        <TransactionDetailsDrawer
          onClose={() => setSelectedTxn(null)}
          transaction={selectedTxn}
          warehousesById={warehousesById}
        />
      )}

      {/* Create Transaction Modal Flow */}
      {createDialogOpen && (
        <CreateTransactionModal
          onClose={() => setCreateDialogOpen(false)}
          onSubmitAdjustment={(input) => {
            const res = createAdjustment(input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Inventory adjustment recorded successfully (${res.id}).`,
              })
              setCreateDialogOpen(false)
            }
            return res
          }}
          onSubmitStockIn={(input) => {
            const res = createStockIn(input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Stock receipt of ${input.quantity} units recorded successfully (${res.id}).`,
              })
              setCreateDialogOpen(false)
            }
            return res
          }}
          onSubmitStockOut={(input) => {
            const res = createStockOut(input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Stock dispatch of ${input.quantity} units recorded successfully (${res.id}).`,
              })
              setCreateDialogOpen(false)
            }
            return res
          }}
          onSubmitTransfer={(input) => {
            const res = createTransfer(input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Inter-facility transfer of ${input.quantity} units completed successfully (${res.id}).`,
              })
              setCreateDialogOpen(false)
            }
            return res
          }}
          products={products}
          suppliers={suppliers}
          warehouses={warehouses}
        />
      )}
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function TransactionTypeBadge({ type }: { type: TransactionType }) {
  switch (type) {
    case 'Stock In':
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
          <ArrowDownLeft size={12} />
          Stock In
        </span>
      )
    case 'Stock Out':
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-danger/30 bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
          <ArrowUpRight size={12} />
          Stock Out
        </span>
      )
    case 'Adjustment':
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
          <Sliders size={12} />
          Adjustment
        </span>
      )
    case 'Transfer':
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
          <ArrowLeftRight size={12} />
          Transfer
        </span>
      )
  }
}

function MovementIndicator({
  type,
  quantity,
}: {
  type: TransactionType
  quantity: number
}) {
  if (type === 'Stock In') {
    return (
      <span className="font-mono font-semibold text-success">
        +{quantity} units
      </span>
    )
  }
  if (type === 'Stock Out') {
    return (
      <span className="font-mono font-semibold text-danger">
        -{quantity} units
      </span>
    )
  }
  if (type === 'Transfer') {
    return (
      <span className="font-mono font-medium text-accent">
        ⇄ {quantity} units
      </span>
    )
  }
  // Adjustment
  return (
    <span className="font-mono font-medium text-warning">
      ±{quantity} units
    </span>
  )
}

// -----------------------------------------------------------------------------
// Transaction Details Drawer
// -----------------------------------------------------------------------------

function TransactionDetailsDrawer({
  transaction,
  warehousesById,
  onClose,
}: {
  transaction: StockTransactionRecord
  warehousesById: Map<string, Warehouse>
  onClose: () => void
}) {
  const triggerRef = useRef<HTMLElement | null>(null)

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

  const sourceWh = transaction.sourceWarehouseId
    ? warehousesById.get(transaction.sourceWarehouseId)
    : undefined
  const destWh = transaction.destinationWarehouseId
    ? warehousesById.get(transaction.destinationWarehouseId)
    : undefined
  const primaryWh = warehousesById.get(transaction.warehouseId)

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-surface-3 bg-surface p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-3/80 pb-4">
          <div className="flex items-center gap-2.5">
            <FileText className="text-primary" size={20} />
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Transaction Details
            </h2>
          </div>
          <Button
            aria-label="Close drawer"
            className="text-text-muted hover:text-text-primary"
            onClick={onClose}
            variant="ghost"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* ID, Type & Status */}
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-xs text-text-muted">
                Transaction ID
              </div>
              <div className="font-mono text-base font-bold text-text-primary mt-0.5">
                {transaction.id}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <TransactionTypeBadge type={transaction.type} />
              <StatusBadge
                tone={
                  transaction.status === 'Completed' ? 'success' : 'neutral'
                }
              >
                {transaction.status}
              </StatusBadge>
            </div>
          </div>

          {/* Product Overview Card */}
          <div className="rounded-xl border border-surface-3 bg-sidebar p-3.5 space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Product Information
            </div>
            <div className="text-sm font-semibold text-text-primary">
              {transaction.productName}
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
              <span>SKU: {transaction.sku}</span>
              <span>•</span>
              <span>ID: {transaction.productId}</span>
            </div>
          </div>

          {/* Stock Impact Card */}
          <div className="rounded-xl border border-surface-3 bg-sidebar p-3.5 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Stock Impact
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-surface-3/60 bg-surface p-2">
                <div className="text-[11px] text-text-muted">Previous</div>
                <div className="font-mono text-base font-bold text-text-secondary mt-0.5">
                  {transaction.previousStock}
                </div>
              </div>
              <div className="rounded-lg border border-surface-3/60 bg-surface p-2">
                <div className="text-[11px] text-text-muted">Quantity</div>
                <div className="font-mono text-base font-bold text-text-primary mt-0.5">
                  <MovementIndicator
                    quantity={transaction.quantity}
                    type={transaction.type}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-surface-3/60 bg-surface p-2">
                <div className="text-[11px] text-text-muted">Resulting</div>
                <div className="font-mono text-base font-bold text-success mt-0.5">
                  {transaction.resultingStock}
                </div>
              </div>
            </div>

            {/* Granular location breakdown for transfers */}
            {transaction.type === 'Transfer' &&
              transaction.sourcePreviousStock !== undefined &&
              transaction.destinationResultingStock !== undefined && (
                <div className="pt-2 border-t border-surface-3/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-text-muted">
                    <span>
                      Source ({sourceWh?.name ?? transaction.sourceWarehouseId}
                      ):
                    </span>
                    <span className="font-mono text-text-primary">
                      {transaction.sourcePreviousStock} ➔{' '}
                      {transaction.sourceResultingStock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-text-muted">
                    <span>
                      Destination (
                      {destWh?.name ?? transaction.destinationWarehouseId}):
                    </span>
                    <span className="font-mono text-text-primary">
                      {transaction.destinationPreviousStock} ➔{' '}
                      {transaction.destinationResultingStock}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted italic pt-1">
                    * Total stock across all locations remains unchanged.
                  </div>
                </div>
              )}
          </div>

          {/* Facility / Route Details */}
          <div className="rounded-xl border border-surface-3 bg-sidebar p-3.5 space-y-2 text-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Location & Logistics
            </div>
            {transaction.type === 'Transfer' ? (
              <>
                <div className="flex items-start gap-2 text-text-secondary">
                  <Building2
                    className="text-text-muted shrink-0 mt-0.5"
                    size={14}
                  />
                  <div>
                    <span className="text-text-muted">Source:</span>{' '}
                    <strong className="text-text-primary">
                      {sourceWh?.name ?? transaction.sourceWarehouseId}
                    </strong>
                    {sourceWh?.city && ` (${sourceWh.city})`}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-text-secondary">
                  <Building2
                    className="text-accent shrink-0 mt-0.5"
                    size={14}
                  />
                  <div>
                    <span className="text-text-muted">Destination:</span>{' '}
                    <strong className="text-text-primary">
                      {destWh?.name ?? transaction.destinationWarehouseId}
                    </strong>
                    {destWh?.city && ` (${destWh.city})`}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2 text-text-secondary">
                <Building2
                  className="text-text-muted shrink-0 mt-0.5"
                  size={14}
                />
                <div>
                  <span className="text-text-muted">Facility:</span>{' '}
                  <strong className="text-text-primary">
                    {(transaction.type === 'Stock In' ? destWh : sourceWh)
                      ?.name ??
                      primaryWh?.name ??
                      transaction.warehouseId}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Reference & Audit Notes */}
          <div className="rounded-xl border border-surface-3 bg-sidebar p-3.5 space-y-2 text-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Audit & Notes
            </div>
            {transaction.referenceNumber && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Reference #:</span>
                <span className="font-mono font-semibold text-text-primary">
                  {transaction.referenceNumber}
                </span>
              </div>
            )}
            {transaction.supplierName && (
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Supplier:</span>
                <span className="text-text-primary font-medium">
                  {transaction.supplierName} ({transaction.supplierId})
                </span>
              </div>
            )}
            <div>
              <span className="text-text-muted">Reason / Note:</span>
              <p className="mt-1 text-text-primary italic leading-relaxed">
                "{transaction.reason ?? 'No notes provided'}"
              </p>
            </div>
            <div className="pt-2 border-t border-surface-3/60 text-[11px] text-text-muted flex items-center justify-between">
              <span>Logged: {transaction.timestamp}</span>
              {transaction.isSeed && (
                <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px]">
                  Historical Seed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-surface-3/80">
          <Button className="w-full" onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Create Transaction Modal
// -----------------------------------------------------------------------------

function CreateTransactionModal({
  products,
  warehouses,
  suppliers,
  onClose,
  onSubmitStockIn,
  onSubmitStockOut,
  onSubmitAdjustment,
  onSubmitTransfer,
}: {
  products: Product[]
  warehouses: Warehouse[]
  suppliers: Supplier[]
  onClose: () => void
  onSubmitStockIn: (input: CreateStockInInput) => {
    ok: boolean
    message?: string
  }
  onSubmitStockOut: (input: CreateStockOutInput) => {
    ok: boolean
    message?: string
  }
  onSubmitAdjustment: (input: CreateAdjustmentInput) => {
    ok: boolean
    message?: string
  }
  onSubmitTransfer: (input: CreateTransferInput) => {
    ok: boolean
    message?: string
  }
}) {
  const [activeType, setActiveType] = useState<TransactionType>('Stock In')
  const [productId, setProductId] = useState<string>(products[0]?.id ?? '')

  // Warehouse targets
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string>(
    warehouses[0]?.id ?? '',
  )
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<string>(
    warehouses[1]?.id ?? warehouses[0]?.id ?? '',
  )

  // Values
  const [quantityStr, setQuantityStr] = useState<string>('')
  const [supplierId, setSupplierId] = useState<string>('')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [reason, setReason] = useState<string>('')

  // Adjustment Mode: delta vs target
  const [adjustmentMode, setAdjustmentMode] = useState<'delta' | 'target'>(
    'delta',
  )

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)

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

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  )

  const availableSourceStock = useMemo(() => {
    if (!selectedProduct) return 0
    return getProductStockAtWarehouse(selectedProduct, sourceWarehouseId)
  }, [selectedProduct, sourceWarehouseId])

  // Real-time stock impact computation
  const stockPreview = useMemo(() => {
    if (!selectedProduct) return null
    const parsedQty = parseInt(quantityStr, 10)
    const validQty = Number.isFinite(parsedQty) ? parsedQty : 0

    if (activeType === 'Stock In') {
      return {
        previous: selectedProduct.stock,
        resulting: selectedProduct.stock + validQty,
        valid: validQty > 0,
      }
    }
    if (activeType === 'Stock Out') {
      return {
        previous: selectedProduct.stock,
        resulting: selectedProduct.stock - validQty,
        valid: validQty > 0 && validQty <= availableSourceStock,
      }
    }
    if (activeType === 'Adjustment') {
      if (adjustmentMode === 'target') {
        const delta = validQty - availableSourceStock
        return {
          previous: selectedProduct.stock,
          resulting: selectedProduct.stock + delta,
          valid: validQty >= 0,
        }
      }
      return {
        previous: selectedProduct.stock,
        resulting: selectedProduct.stock + validQty,
        valid: selectedProduct.stock + validQty >= 0 && validQty !== 0,
      }
    }
    // Transfer
    return {
      previous: selectedProduct.stock,
      resulting: selectedProduct.stock, // total stock unchanged
      sourcePrevious: availableSourceStock,
      sourceResulting: availableSourceStock - validQty,
      valid:
        validQty > 0 &&
        validQty <= availableSourceStock &&
        sourceWarehouseId !== destinationWarehouseId,
    }
  }, [
    selectedProduct,
    quantityStr,
    activeType,
    availableSourceStock,
    adjustmentMode,
    sourceWarehouseId,
    destinationWarehouseId,
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsedQty = parseInt(quantityStr.trim(), 10)

    if (activeType === 'Stock In') {
      const payload: CreateStockInInput = {
        productId,
        destinationWarehouseId,
        quantity: parsedQty,
        supplierId: supplierId.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        reason: reason.trim() || undefined,
      }
      const val = validateStockInInput(payload, products, warehouses, suppliers)
      if (!val.ok) {
        setError(val.message)
        return
      }
      setIsSubmitting(true)
      const res = onSubmitStockIn(payload)
      if (!res.ok) {
        setError(res.message ?? 'Stock In failed.')
        setIsSubmitting(false)
      }
    } else if (activeType === 'Stock Out') {
      const payload: CreateStockOutInput = {
        productId,
        sourceWarehouseId,
        quantity: parsedQty,
        referenceNumber: referenceNumber.trim() || undefined,
        reason: reason.trim() || undefined,
      }
      const val = validateStockOutInput(payload, products, warehouses)
      if (!val.ok) {
        setError(val.message)
        return
      }
      setIsSubmitting(true)
      const res = onSubmitStockOut(payload)
      if (!res.ok) {
        setError(res.message ?? 'Stock Out failed.')
        setIsSubmitting(false)
      }
    } else if (activeType === 'Adjustment') {
      const payload: CreateAdjustmentInput = {
        productId,
        warehouseId: sourceWarehouseId,
        mode: adjustmentMode,
        quantity: parsedQty,
        reason: reason.trim(),
        referenceNumber: referenceNumber.trim() || undefined,
      }
      const val = validateAdjustmentInput(payload, products, warehouses)
      if (!val.ok) {
        setError(val.message)
        return
      }
      setIsSubmitting(true)
      const res = onSubmitAdjustment(payload)
      if (!res.ok) {
        setError(res.message ?? 'Adjustment failed.')
        setIsSubmitting(false)
      }
    } else if (activeType === 'Transfer') {
      const payload: CreateTransferInput = {
        productId,
        sourceWarehouseId,
        destinationWarehouseId,
        quantity: parsedQty,
        referenceNumber: referenceNumber.trim() || undefined,
        reason: reason.trim() || undefined,
      }
      const val = validateTransferInput(payload, products, warehouses)
      if (!val.ok) {
        setError(val.message)
        return
      }
      setIsSubmitting(true)
      const res = onSubmitTransfer(payload)
      if (!res.ok) {
        setError(res.message ?? 'Transfer failed.')
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Record Stock Transaction
          </h2>
          <Button
            aria-label="Close dialog"
            className="text-text-muted hover:text-text-primary"
            onClick={onClose}
            variant="ghost"
          >
            <X size={18} />
          </Button>
        </div>

        <p className="mt-1 text-xs text-text-muted">
          Select transaction type, configure parameters, and verify stock
          impact.
        </p>

        {/* Type Selector Tabs */}
        <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-surface-3 bg-sidebar p-1">
          {(
            [
              'Stock In',
              'Stock Out',
              'Adjustment',
              'Transfer',
            ] as TransactionType[]
          ).map((t) => (
            <button
              className={`rounded-lg py-2 text-xs font-medium transition-colors cursor-pointer text-center ${
                activeType === t
                  ? 'bg-surface text-text-primary shadow-xs font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              key={t}
              onClick={() => {
                setError(null)
                setActiveType(t)
              }}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
            role="alert"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {/* Product Select */}
          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Product Item *
            <select
              className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              onChange={(e) => {
                setError(null)
                const nextId = e.target.value
                setProductId(nextId)
                const nextProd = products.find((p) => p.id === nextId)
                if (nextProd) {
                  setSourceWarehouseId(nextProd.warehouseId)
                  const otherWh = warehouses.find(
                    (w) => w.id !== nextProd.warehouseId,
                  )
                  if (otherWh) setDestinationWarehouseId(otherWh.id)
                }
              }}
              value={productId}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.stock} units
                </option>
              ))}
            </select>
          </label>

          {/* Form fields based on Active Type */}
          {activeType === 'Stock In' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-text-secondary">
                  Destination Warehouse *
                  <select
                    className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    onChange={(e) => {
                      setError(null)
                      setDestinationWarehouseId(e.target.value)
                    }}
                    value={destinationWarehouseId}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.city})
                      </option>
                    ))}
                  </select>
                </label>

                <TextInput
                  label="Received Quantity *"
                  min={1}
                  onChange={(e) => {
                    setError(null)
                    setQuantityStr(e.target.value)
                  }}
                  placeholder="e.g. 24"
                  required
                  type="number"
                  value={quantityStr}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-text-secondary">
                  Associated Supplier (Optional)
                  <select
                    className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    onChange={(e) => setSupplierId(e.target.value)}
                    value={supplierId}
                  >
                    <option value="">No supplier specified</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName}
                      </option>
                    ))}
                  </select>
                </label>

                <TextInput
                  label="PO / Invoice Reference #"
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. PO-2026-904"
                  value={referenceNumber}
                />
              </div>

              <TextInput
                label="Reason / Receipt Notes"
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Weekly inventory replenishment consignment"
                value={reason}
              />
            </>
          )}

          {activeType === 'Stock Out' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-text-secondary">
                  Source Warehouse *
                  <select
                    className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    onChange={(e) => {
                      setError(null)
                      setSourceWarehouseId(e.target.value)
                    }}
                    value={sourceWarehouseId}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Stock:{' '}
                        {selectedProduct
                          ? getProductStockAtWarehouse(selectedProduct, w.id)
                          : 0}
                        )
                      </option>
                    ))}
                  </select>
                </label>

                <TextInput
                  label="Dispatch Quantity *"
                  max={availableSourceStock}
                  min={1}
                  onChange={(e) => {
                    setError(null)
                    setQuantityStr(e.target.value)
                  }}
                  placeholder={`Max: ${availableSourceStock}`}
                  required
                  type="number"
                  value={quantityStr}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Dispatch Order Ref #"
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. DO-2026-0812"
                  value={referenceNumber}
                />

                <TextInput
                  label="Reason / Notes"
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Customer order fulfillment dispatch"
                  value={reason}
                />
              </div>
            </>
          )}

          {activeType === 'Adjustment' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-text-secondary">
                  Warehouse Location *
                  <select
                    className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    onChange={(e) => {
                      setError(null)
                      setSourceWarehouseId(e.target.value)
                    }}
                    value={sourceWarehouseId}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Stock:{' '}
                        {selectedProduct
                          ? getProductStockAtWarehouse(selectedProduct, w.id)
                          : 0}
                        )
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-text-secondary">
                  Adjustment Mode *
                  <select
                    className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    onChange={(e) => {
                      setError(null)
                      setAdjustmentMode(e.target.value as 'delta' | 'target')
                    }}
                    value={adjustmentMode}
                  >
                    <option value="delta">Quantity Change (+ / - delta)</option>
                    <option value="target">New Physical Stock Count</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label={
                    adjustmentMode === 'target'
                      ? 'New Count (Resulting Stock) *'
                      : 'Quantity Delta (+5 or -3) *'
                  }
                  onChange={(e) => {
                    setError(null)
                    setQuantityStr(e.target.value)
                  }}
                  placeholder={
                    adjustmentMode === 'target'
                      ? `Current count: ${availableSourceStock}`
                      : 'e.g. -2 or +5'
                  }
                  required
                  type="number"
                  value={quantityStr}
                />

                <TextInput
                  label="Audit Ref #"
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. AUDIT-2026-Q3"
                  value={referenceNumber}
                />
              </div>

              <TextInput
                label="Adjustment Reason * (Required for audit compliance)"
                onChange={(e) => {
                  setError(null)
                  setReason(e.target.value)
                }}
                placeholder="e.g. Physical inventory cycle count reconciliation"
                required
                value={reason}
              />
            </>
          )}

          {activeType === 'Transfer' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-text-secondary">
                  Source Warehouse *
                  <select
                    className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    onChange={(e) => {
                      setError(null)
                      setSourceWarehouseId(e.target.value)
                    }}
                    value={sourceWarehouseId}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Stock:{' '}
                        {selectedProduct
                          ? getProductStockAtWarehouse(selectedProduct, w.id)
                          : 0}
                        )
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-text-secondary">
                  Destination Warehouse *
                  <select
                    className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    onChange={(e) => {
                      setError(null)
                      setDestinationWarehouseId(e.target.value)
                    }}
                    value={destinationWarehouseId}
                  >
                    {warehouses.map((w) => (
                      <option
                        disabled={w.id === sourceWarehouseId}
                        key={w.id}
                        value={w.id}
                      >
                        {w.name} {w.id === sourceWarehouseId ? '(Source)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Transfer Quantity *"
                  max={availableSourceStock}
                  min={1}
                  onChange={(e) => {
                    setError(null)
                    setQuantityStr(e.target.value)
                  }}
                  placeholder={`Max: ${availableSourceStock}`}
                  required
                  type="number"
                  value={quantityStr}
                />

                <TextInput
                  label="Transfer Waybill / Ref #"
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. TRF-2026-99"
                  value={referenceNumber}
                />
              </div>

              <TextInput
                label="Transfer Reason / Notes"
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Inter-warehouse regional stock replenishment"
                value={reason}
              />
            </>
          )}

          {/* Real-time Stock Impact Preview Banner */}
          {stockPreview && quantityStr.trim() !== '' && (
            <div
              className={`rounded-xl border p-3 text-xs leading-relaxed ${
                stockPreview.valid
                  ? 'border-primary/30 bg-primary/10 text-text-primary'
                  : 'border-danger/30 bg-danger/10 text-danger'
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                {stockPreview.valid ? (
                  <CheckCircle2 className="text-success" size={14} />
                ) : (
                  <AlertTriangle className="text-danger" size={14} />
                )}
                Stock Impact Preview
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span>Total product stock:</span>
                <span className="font-mono">
                  {stockPreview.previous} ➔{' '}
                  <strong>{stockPreview.resulting} units</strong>
                </span>
                {activeType === 'Transfer' &&
                  stockPreview.sourcePrevious !== undefined && (
                    <span className="text-text-muted">
                      (Source: {stockPreview.sourcePrevious} ➔{' '}
                      {stockPreview.sourceResulting} units)
                    </span>
                  )}
              </div>
              {!stockPreview.valid && (
                <div className="mt-1 font-medium text-danger">
                  {activeType === 'Transfer' &&
                  sourceWarehouseId === destinationWarehouseId
                    ? 'Source and destination warehouses cannot be the same.'
                    : 'Invalid quantity: exceeds available stock or results in negative inventory.'}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-3/80">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={
                isSubmitting || (stockPreview !== null && !stockPreview.valid)
              }
              type="submit"
              variant="primary"
            >
              Record {activeType}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
