import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Search,
  UserCheck,
  UserX,
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
import { useInventoryStore } from '@/lib/inventoryStore'
import {
  useSuppliersStore,
  type CreateSupplierInput,
} from '@/lib/supplierStore'
import type { Supplier, SupplierStatus } from '@/mocks/supplierData'
import type { Product } from '@/mocks/inventoryData'

type StatusFilterOption = 'All' | SupplierStatus
type SortField = 'companyName' | 'contactPerson' | 'date' | 'status'
type SortOrder = 'asc' | 'desc'

const pageSizes = [10, 20, 40]

export function SuppliersPage() {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deactivateSupplier,
    reactivateSupplier,
  } = useSuppliersStore()
  const { products } = useInventoryStore()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('All')
  const [sortField, setSortField] = useState<SortField>('companyName')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  )
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Supplier | null>(
    null,
  )

  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Sync selected supplier reactively
  const activeSelectedSupplier = useMemo(() => {
    if (!selectedSupplier) return null
    return suppliers.find((s) => s.id === selectedSupplier.id) ?? null
  }, [suppliers, selectedSupplier])

  // Count products associated with each supplier
  const supplierProductCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      if (p.supplierId) {
        map.set(p.supplierId, (map.get(p.supplierId) ?? 0) + 1)
      }
    }
    return map
  }, [products])

  // KPI Calculations
  const stats = useMemo(() => {
    const total = suppliers.length
    const active = suppliers.filter((s) => s.status === 'Active').length
    const inactive = suppliers.filter((s) => s.status === 'Inactive').length
    const linked = suppliers.filter(
      (s) => (supplierProductCounts.get(s.id) ?? 0) > 0,
    ).length
    return { total, active, inactive, linked }
  }, [suppliers, supplierProductCounts])

  // Filtering & Sorting
  const filteredSuppliers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return suppliers
      .filter((s) => {
        // Search query across name, contact, email, phone
        if (query) {
          const matchName = s.companyName.toLowerCase().includes(query)
          const matchContact = s.contactPerson.toLowerCase().includes(query)
          const matchEmail = s.email.toLowerCase().includes(query)
          const matchPhone = s.phone.toLowerCase().includes(query)
          const matchId = s.id.toLowerCase().includes(query)
          const matchCity = s.city.toLowerCase().includes(query)
          if (
            !matchName &&
            !matchContact &&
            !matchEmail &&
            !matchPhone &&
            !matchId &&
            !matchCity
          ) {
            return false
          }
        }

        // Status filter
        if (statusFilter !== 'All' && s.status !== statusFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        let comp = 0
        if (sortField === 'companyName') {
          comp = a.companyName.localeCompare(b.companyName)
        } else if (sortField === 'contactPerson') {
          comp = a.contactPerson.localeCompare(b.contactPerson)
        } else if (sortField === 'status') {
          comp = a.status.localeCompare(b.status)
        } else if (sortField === 'date') {
          comp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        return sortOrder === 'asc' ? comp : -comp
      })
  }, [suppliers, search, statusFilter, sortField, sortOrder])

  // Pagination slice
  const pageCount = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize))
  const paginatedSuppliers = filteredSuppliers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'All'

  function resetFilters() {
    setSearch('')
    setStatusFilter('All')
    setPage(1)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        action={
          <Button
            className="gap-2"
            onClick={() => setAddDialogOpen(true)}
            variant="primary"
          >
            <Plus size={16} />
            <span>Add supplier</span>
          </Button>
        }
        description="Manage approved vendors, partner contacts, and fulfillment sources."
        eyebrow="SUPPLIERS DIRECTORY"
        title="Suppliers"
      />

      {/* Notice Feedback Banner */}
      {notice && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm ${
            notice.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger'
          }`}
          role="status"
        >
          <div className="flex items-center gap-3">
            {notice.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            aria-label="Dismiss notice"
            className="text-current opacity-70 hover:opacity-100"
            onClick={() => setNotice(null)}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* In-Memory Persistence Disclaimer */}
      <div className="rounded-xl border border-surface-3/60 bg-surface-2/40 px-4 py-2.5 text-xs text-text-muted">
        <strong>Session Note:</strong> Supplier data is managed in-memory for
        the current workspace session. Modifications will reset upon page
        reload.
      </div>

      {/* Vendor Directory Telemetry Strip */}
      <section
        aria-label="Supplier key performance indicators"
        className="overflow-hidden rounded-xl border border-surface-3 bg-surface-1 shadow-sm"
      >
        <div className="grid grid-cols-2 divide-y divide-surface-3 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                // TOTAL VENDORS
              </span>
              <Building2 className="text-primary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {stats.total}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Registered vendor profiles
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                // ACTIVE OPERATIONAL
              </span>
              <UserCheck className="text-success" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-success sm:text-3xl">
              {stats.active}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Approved for fulfillment
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                // INACTIVE VENDORS
              </span>
              <UserX className="text-text-muted" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-secondary sm:text-3xl">
              {stats.inactive}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Paused or decommissioned
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">
                // CATALOGUE LINKED
              </span>
              <Package className="text-secondary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-secondary sm:text-3xl">
              {stats.linked}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Associated with products
            </div>
          </div>
        </div>
      </section>

      {/* Main Table Card with Search & Controls */}
      <Card className="overflow-hidden border border-surface-3/80">
        {/* Controls Toolbar */}
        <div className="flex flex-col gap-4 border-b border-surface-3/80 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              size={17}
            />
            <input
              aria-label="Search suppliers"
              className="h-10 w-full rounded-xl border border-surface-3 bg-sidebar pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-primary"
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name, contact, email, phone, city..."
              type="search"
              value={search}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-surface-3 bg-sidebar px-2.5 py-1">
              <span className="text-xs text-text-muted">Status:</span>
              <select
                aria-label="Filter by status"
                className="bg-transparent text-xs font-medium text-text-primary outline-none cursor-pointer"
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilterOption)
                  setPage(1)
                }}
                value={statusFilter}
              >
                <option className="bg-surface text-text-primary" value="All">
                  All
                </option>
                <option className="bg-surface text-text-primary" value="Active">
                  Active
                </option>
                <option
                  className="bg-surface text-text-primary"
                  value="Inactive"
                >
                  Inactive
                </option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-surface-3 bg-sidebar px-2.5 py-1">
              <span className="text-xs text-text-muted">Sort:</span>
              <select
                aria-label="Sort field"
                className="bg-transparent text-xs font-medium text-text-primary outline-none cursor-pointer"
                onChange={(e) => setSortField(e.target.value as SortField)}
                value={sortField}
              >
                <option
                  className="bg-surface text-text-primary"
                  value="companyName"
                >
                  Company Name
                </option>
                <option
                  className="bg-surface text-text-primary"
                  value="contactPerson"
                >
                  Contact Person
                </option>
                <option className="bg-surface text-text-primary" value="status">
                  Status
                </option>
                <option className="bg-surface text-text-primary" value="date">
                  Date Added
                </option>
              </select>
              <button
                aria-label={`Toggle sort order, current ${sortOrder}`}
                className="text-text-muted hover:text-text-primary ml-1"
                onClick={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                type="button"
              >
                <ArrowUpDown size={13} />
              </button>
            </div>

            {hasActiveFilters && (
              <Button
                className="h-9 px-3 text-xs"
                onClick={resetFilters}
                variant="ghost"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Suppliers Table */}
        {paginatedSuppliers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-3/80 bg-surface-2/60 text-xs font-medium text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-mono uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-5 py-3.5 font-mono uppercase tracking-wider">
                    Contact Person
                  </th>
                  <th className="px-5 py-3.5 font-mono uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th className="px-5 py-3.5 font-mono uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-5 py-3.5 font-mono uppercase tracking-wider text-center">
                    Products
                  </th>
                  <th className="px-5 py-3.5 font-mono uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-mono uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/50">
                {paginatedSuppliers.map((supplier) => {
                  const productCount =
                    supplierProductCounts.get(supplier.id) ?? 0

                  return (
                    <tr
                      className="text-text-secondary transition-colors hover:bg-surface-2/40"
                      key={supplier.id}
                    >
                      {/* Company Name & ID */}
                      <td className="px-5 py-4">
                        <button
                          className="text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                          onClick={() => setSelectedSupplier(supplier)}
                          type="button"
                        >
                          <p className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                            {supplier.companyName}
                          </p>
                          <span className="font-mono text-xs text-text-muted">
                            {supplier.id}
                          </span>
                        </button>
                      </td>

                      {/* Contact Person */}
                      <td className="px-5 py-4 font-medium text-text-primary whitespace-nowrap">
                        {supplier.contactPerson}
                      </td>

                      {/* Email & Phone */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        <p className="text-text-primary">{supplier.email}</p>
                        <p className="text-text-muted mt-0.5">
                          {supplier.phone}
                        </p>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4 text-xs text-text-secondary">
                        <p className="font-medium text-text-primary">
                          {supplier.city}
                          {supplier.state ? `, ${supplier.state}` : ''}
                        </p>
                        <p className="truncate max-w-[200px] text-text-muted mt-0.5">
                          {supplier.address}
                        </p>
                      </td>

                      {/* Products Count Badge */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center rounded-lg px-2.5 py-0.5 font-mono text-xs font-medium ${
                            productCount > 0
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-surface-3 text-text-muted'
                          }`}
                        >
                          {productCount} item{productCount === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <StatusBadge
                          tone={
                            supplier.status === 'Active' ? 'success' : 'neutral'
                          }
                        >
                          {supplier.status}
                        </StatusBadge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            aria-label={`View details for ${supplier.companyName}`}
                            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                            onClick={() => setSelectedSupplier(supplier)}
                            variant="ghost"
                          >
                            <Eye size={15} />
                          </Button>

                          <Button
                            aria-label={`Edit ${supplier.companyName}`}
                            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                            onClick={() => setEditingSupplier(supplier)}
                            variant="ghost"
                          >
                            <Edit2 size={15} />
                          </Button>

                          {supplier.status === 'Active' ? (
                            <Button
                              aria-label={`Deactivate ${supplier.companyName}`}
                              className="h-8 w-8 p-0 text-text-muted hover:text-danger"
                              onClick={() => setDeactivateTarget(supplier)}
                              variant="ghost"
                            >
                              <UserX size={15} />
                            </Button>
                          ) : (
                            <Button
                              aria-label={`Reactivate ${supplier.companyName}`}
                              className="h-8 w-8 p-0 text-text-muted hover:text-success"
                              onClick={() => {
                                const res = reactivateSupplier(supplier.id)
                                if (res.ok) {
                                  setNotice({
                                    type: 'success',
                                    message: `Supplier "${supplier.companyName}" was reactivated.`,
                                  })
                                }
                              }}
                              variant="ghost"
                            >
                              <RotateCcw size={15} />
                            </Button>
                          )}
                        </div>
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
                    onClick={() => setAddDialogOpen(true)}
                    variant="primary"
                  >
                    Add first supplier
                  </Button>
                )
              }
              description={
                hasActiveFilters
                  ? 'No suppliers match your current search or filter criteria. Try clearing filters.'
                  : 'Your supplier directory is empty. Add your first vendor profile to get started.'
              }
              title={
                hasActiveFilters
                  ? 'No matching suppliers'
                  : 'No suppliers registered'
              }
            />
          </div>
        )}

        {/* Pagination Toolbar */}
        {filteredSuppliers.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-3/80 px-5 py-4 text-xs text-text-muted sm:flex-row">
            <div>
              Showing{' '}
              <span className="font-medium text-text-primary">
                {(page - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-text-primary">
                {Math.min(page * pageSize, filteredSuppliers.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-text-primary">
                {filteredSuppliers.length}
              </span>{' '}
              suppliers
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

      {/* Supplier Details Drawer */}
      {activeSelectedSupplier && (
        <SupplierDetailsDrawer
          onClose={() => setSelectedSupplier(null)}
          onDeactivateRequest={(s) => setDeactivateTarget(s)}
          onEditRequest={(s) => setEditingSupplier(s)}
          onReactivateRequest={(s) => {
            const res = reactivateSupplier(s.id)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Supplier "${s.companyName}" was reactivated.`,
              })
            }
          }}
          products={products.filter(
            (p) => p.supplierId === activeSelectedSupplier.id,
          )}
          supplier={activeSelectedSupplier}
        />
      )}

      {/* Add Supplier Dialog */}
      {addDialogOpen && (
        <SupplierFormDialog
          mode="create"
          onClose={() => setAddDialogOpen(false)}
          onSubmit={(input) => {
            const res = addSupplier(input as CreateSupplierInput)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Supplier "${input.companyName}" was successfully added.`,
              })
              setAddDialogOpen(false)
            }
            return res
          }}
        />
      )}

      {/* Edit Supplier Dialog */}
      {editingSupplier && (
        <SupplierFormDialog
          initialSupplier={editingSupplier}
          mode="edit"
          onClose={() => setEditingSupplier(null)}
          onSubmit={(input) => {
            const res = updateSupplier(editingSupplier.id, input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Supplier "${input.companyName}" was successfully updated.`,
              })
              setEditingSupplier(null)
            }
            return res
          }}
        />
      )}

      {/* Deactivate Confirmation Dialog */}
      {deactivateTarget && (
        <DeactivateConfirmDialog
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={() => {
            const res = deactivateSupplier(deactivateTarget.id)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Supplier "${deactivateTarget.companyName}" was deactivated.`,
              })
            } else {
              setNotice({
                type: 'error',
                message: res.message,
              })
            }
            setDeactivateTarget(null)
          }}
          supplier={deactivateTarget}
        />
      )}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Supplier Details Drawer
// -----------------------------------------------------------------------------

function SupplierDetailsDrawer({
  supplier,
  products,
  onClose,
  onEditRequest,
  onDeactivateRequest,
  onReactivateRequest,
}: {
  supplier: Supplier
  products: Product[]
  onClose: () => void
  onEditRequest: (supplier: Supplier) => void
  onDeactivateRequest: (supplier: Supplier) => void
  onReactivateRequest: (supplier: Supplier) => void
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

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
    >
      <div className="flex h-full w-full max-w-xl flex-col border-l border-surface-3 bg-surface p-6 shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-surface-3/80 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
                {supplier.id}
              </span>
              <StatusBadge
                tone={supplier.status === 'Active' ? 'success' : 'neutral'}
              >
                {supplier.status}
              </StatusBadge>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">
              {supplier.companyName}
            </h2>
          </div>
          <Button
            aria-label="Close supplier details"
            className="text-text-muted hover:text-text-primary"
            onClick={onClose}
            variant="ghost"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Drawer Body */}
        <div className="mt-6 flex-1 space-y-6">
          {/* Quick Contact Card */}
          <div className="rounded-xl border border-surface-3/80 bg-sidebar/60 p-4 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Primary Contact
            </h3>
            <p className="font-semibold text-base text-text-primary">
              {supplier.contactPerson}
            </p>

            <div className="grid gap-2 pt-1 text-sm">
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail className="shrink-0 text-text-muted" size={16} />
                <a
                  className="hover:text-primary transition-colors hover:underline"
                  href={`mailto:${supplier.email}`}
                >
                  {supplier.email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Phone className="shrink-0 text-text-muted" size={16} />
                <a
                  className="hover:text-primary transition-colors hover:underline"
                  href={`tel:${supplier.phone}`}
                >
                  {supplier.phone}
                </a>
              </div>
              <div className="flex items-start gap-3 text-text-secondary">
                <MapPin className="shrink-0 mt-0.5 text-text-muted" size={16} />
                <span>
                  {supplier.address}, {supplier.city}
                  {supplier.state ? `, ${supplier.state}` : ''}
                  {supplier.postalCode ? ` - ${supplier.postalCode}` : ''},{' '}
                  {supplier.country ?? 'India'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
            <div className="rounded-xl border border-surface-3/60 bg-surface-2/30 p-3">
              <span className="block font-mono uppercase tracking-wider text-[10px]">
                Registered On
              </span>
              <p className="mt-1 font-medium text-text-primary">
                {formatDate(supplier.createdAt)}
              </p>
            </div>
            <div className="rounded-xl border border-surface-3/60 bg-surface-2/30 p-3">
              <span className="block font-mono uppercase tracking-wider text-[10px]">
                Last Updated
              </span>
              <p className="mt-1 font-medium text-text-primary">
                {formatDate(supplier.updatedAt)}
              </p>
            </div>
          </div>

          {/* Associated Products Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Package size={16} className="text-primary" />
                <span>Associated Inventory Products</span>
              </h3>
              <span className="font-mono text-xs text-text-muted">
                {products.length} item{products.length === 1 ? '' : 's'}
              </span>
            </div>

            {products.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {products.map((p) => (
                  <div
                    className="flex items-center justify-between rounded-xl border border-surface-3/80 bg-sidebar/40 p-3 text-xs"
                    key={p.id}
                  >
                    <div>
                      <p className="font-medium text-text-primary">{p.name}</p>
                      <p className="font-mono text-[11px] text-text-muted">
                        {p.sku} • {p.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-text-primary">
                        {formatInr(p.price)}
                      </p>
                      <p className="text-text-muted">Stock: {p.stock} units</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-surface-3 p-4 text-center text-xs text-text-muted">
                No inventory products are currently mapped to this supplier.
              </div>
            )}
          </div>
        </div>

        {/* Drawer Actions Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-surface-3/80 pt-5">
          <Button
            onClick={() => onEditRequest(supplier)}
            type="button"
            variant="secondary"
          >
            <Edit2 size={15} /> Edit profile
          </Button>
          {supplier.status === 'Active' ? (
            <Button
              className="text-danger hover:bg-danger/10"
              onClick={() => onDeactivateRequest(supplier)}
              type="button"
              variant="ghost"
            >
              <UserX size={15} /> Deactivate
            </Button>
          ) : (
            <Button
              className="text-success hover:bg-success/10"
              onClick={() => onReactivateRequest(supplier)}
              type="button"
              variant="ghost"
            >
              <RotateCcw size={15} /> Reactivate
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Supplier Form Dialog (Add / Edit)
// -----------------------------------------------------------------------------

function SupplierFormDialog({
  initialSupplier,
  mode,
  onClose,
  onSubmit,
}: {
  initialSupplier?: Supplier
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (
    input: Partial<CreateSupplierInput>,
  ) => { ok: true; id?: string } | { ok: false; message: string }
}) {
  const triggerRef = useRef<HTMLElement | null>(null)

  const [companyName, setCompanyName] = useState(
    initialSupplier?.companyName ?? '',
  )
  const [contactPerson, setContactPerson] = useState(
    initialSupplier?.contactPerson ?? '',
  )
  const [email, setEmail] = useState(initialSupplier?.email ?? '')
  const [phone, setPhone] = useState(initialSupplier?.phone ?? '')
  const [address, setAddress] = useState(initialSupplier?.address ?? '')
  const [city, setCity] = useState(initialSupplier?.city ?? '')
  const [state, setState] = useState(initialSupplier?.state ?? '')
  const [postalCode, setPostalCode] = useState(
    initialSupplier?.postalCode ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!companyName.trim()) {
      setError('Company name is required.')
      return
    }
    if (!contactPerson.trim()) {
      setError('Contact person is required.')
      return
    }
    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    if (!phone.trim()) {
      setError('Phone number is required.')
      return
    }
    if (!address.trim()) {
      setError('Address is required.')
      return
    }

    setIsSubmitting(true)

    const res = onSubmit({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
    })

    setIsSubmitting(false)

    if (!res.ok) {
      setError(res.message)
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-60 grid place-items-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {mode === 'create' ? 'Add New Supplier' : 'Edit Supplier Profile'}
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
          {mode === 'create'
            ? 'Register a verified partner vendor into the workspace supplier directory.'
            : `Update information for ${initialSupplier?.companyName}.`}
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

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Company Name *"
              onChange={(e) => {
                setError(null)
                setCompanyName(e.target.value)
              }}
              placeholder="e.g. Apex Industrial Supplies"
              required
              value={companyName}
            />

            <TextInput
              label="Contact Person *"
              onChange={(e) => {
                setError(null)
                setContactPerson(e.target.value)
              }}
              placeholder="e.g. Ramesh Patel"
              required
              value={contactPerson}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Email Address *"
              onChange={(e) => {
                setError(null)
                setEmail(e.target.value)
              }}
              placeholder="orders@vendor.com"
              required
              type="email"
              value={email}
            />

            <TextInput
              label="Phone Number *"
              onChange={(e) => {
                setError(null)
                setPhone(e.target.value)
              }}
              placeholder="+91 98000 00000"
              required
              value={phone}
            />
          </div>

          <TextInput
            label="Street Address / Facility Location *"
            onChange={(e) => {
              setError(null)
              setAddress(e.target.value)
            }}
            placeholder="e.g. Plot 42, Peenya Industrial Area Phase II"
            required
            value={address}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput
              label="City"
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
              value={city}
            />

            <TextInput
              label="State"
              onChange={(e) => setState(e.target.value)}
              placeholder="Karnataka"
              value={state}
            />

            <TextInput
              label="Postal Code"
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="560058"
              value={postalCode}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-3/80">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {mode === 'create' ? 'Save supplier' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Deactivate Confirmation Dialog
// -----------------------------------------------------------------------------

function DeactivateConfirmDialog({
  supplier,
  onConfirm,
  onCancel,
}: {
  supplier: Supplier
  onConfirm: () => void
  onCancel: () => void
}) {
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
      className="fixed inset-0 z-70 grid place-items-center bg-black/75 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-danger">
          <AlertTriangle size={22} />
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Deactivate {supplier.companyName}?
          </h2>
        </div>

        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          Are you sure you want to mark{' '}
          <strong className="text-text-primary">{supplier.companyName}</strong>{' '}
          as inactive?
        </p>

        <p className="mt-2 text-xs text-text-muted">
          Existing inventory items and previous order lines associated with this
          supplier will remain completely intact. You can reactivate this
          supplier at any time.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel} type="button" variant="ghost">
            Keep active
          </Button>
          <Button
            className="bg-danger hover:bg-danger/90 text-white"
            onClick={onConfirm}
            type="button"
          >
            Confirm deactivation
          </Button>
        </div>
      </div>
    </div>
  )
}
