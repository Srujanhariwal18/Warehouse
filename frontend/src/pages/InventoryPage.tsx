import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextInput } from '@/components/ui/TextInput'
import {
  useInventoryStore,
  type ProductInput,
  type StoreOperationResult,
} from '@/lib/inventoryStore'
import { formatInr } from '@/lib/formatters'
import type { Product } from '@/mocks/inventoryData'
import { useWarehouseStore } from '@/lib/warehouseStore'
import { useTransactionStore } from '@/lib/transactionStore'

type DialogMode = 'add' | 'edit' | 'stock-in' | 'stock-out' | null
type SortKey = 'name' | 'stock' | 'price' | 'value'

const categories = ['Storage', 'Packing', 'Equipment', 'Safety']
const pageSizes = [10, 20, 40]

function statusFor(product: Product) {
  if (product.stock === 0)
    return { label: 'Out of Stock', tone: 'danger' as const }
  if (product.stock <= product.reorderThreshold)
    return { label: 'Low Stock', tone: 'warning' as const }
  return { label: 'In Stock', tone: 'success' as const }
}

export function InventoryPage() {
  const { addProduct, lowStockProducts, products, updateProduct } =
    useInventoryStore()
  const { warehouses } = useWarehouseStore()
  const { createStockIn, createStockOut } = useTransactionStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [warehouse, setWarehouse] = useState('All warehouses')
  const [status, setStatus] = useState('All statuses')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAscending, setSortAscending] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<Product | null>(null)
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [loading] = useState(false)

  const warehouseMap = useMemo(
    () => new Map(warehouses.map((item) => [item.id, item.name])),
    [warehouses],
  )

  const hasDataError = useMemo(() => {
    const warehouseIds = new Set(warehouses.map((w) => w.id))
    return (
      !Array.isArray(products) ||
      products.some(
        (product) =>
          !product.id ||
          !product.name?.trim() ||
          !product.sku?.trim() ||
          !warehouseIds.has(product.warehouseId) ||
          !Number.isFinite(product.price) ||
          product.price <= 0 ||
          !Number.isFinite(product.stock) ||
          product.stock < 0 ||
          !Number.isFinite(product.reorderThreshold) ||
          product.reorderThreshold < 0,
      )
    )
  }, [products, warehouses])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products
      .filter((product) => {
        const productStatus = statusFor(product).label
        return (
          (!query ||
            `${product.name} ${product.sku}`.toLowerCase().includes(query)) &&
          (category === 'All categories' || product.category === category) &&
          (warehouse === 'All warehouses' ||
            product.warehouseId === warehouse) &&
          (status === 'All statuses' || productStatus === status)
        )
      })
      .sort((a, b) => {
        const valueA =
          sortKey === 'name'
            ? a.name
            : sortKey === 'stock'
              ? a.stock
              : sortKey === 'price'
                ? a.price
                : a.stock * a.price
        const valueB =
          sortKey === 'name'
            ? b.name
            : sortKey === 'stock'
              ? b.stock
              : sortKey === 'price'
                ? b.price
                : b.stock * b.price
        const comparison =
          typeof valueA === 'string'
            ? valueA.localeCompare(valueB as string)
            : valueA - (valueB as number)
        return sortAscending ? comparison : -comparison
      })
  }, [category, products, search, sortAscending, sortKey, status, warehouse])

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )
  const inventoryValue = products.reduce(
    (sum, product) => sum + product.stock * product.price,
    0,
  )
  const outOfStock = products.filter((product) => product.stock === 0).length

  function setFilter(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  function changeSort(key: SortKey) {
    if (sortKey === key) setSortAscending((ascending) => !ascending)
    else {
      setSortKey(key)
      setSortAscending(true)
    }
  }

  function handleSave(
    input: ProductInput & { id?: string },
  ): StoreOperationResult {
    const result = input.id ? updateProduct(input.id, input) : addProduct(input)
    if (!result.ok) {
      return result
    }
    setNotice({
      type: 'success',
      message: input.id
        ? 'Product updated in catalogue.'
        : 'Product added to catalogue.',
    })
    setDialog(null)
    return { ok: true }
  }

  function handleStock(
    quantity: number,
    operation: 'Stock In' | 'Stock Out',
  ): StoreOperationResult {
    if (!selected) {
      return { ok: false, message: 'No product selected.' }
    }
    const result =
      operation === 'Stock In'
        ? createStockIn({
            productId: selected.id,
            destinationWarehouseId: selected.warehouseId,
            quantity,
            reason: 'Catalogue stock replenishment',
          })
        : createStockOut({
            productId: selected.id,
            sourceWarehouseId: selected.warehouseId,
            quantity,
            reason: 'Catalogue stock dispatch',
          })

    if (!result.ok) {
      return result
    }
    setNotice({
      type: 'success',
      message: `${operation} recorded in transactions ledger.`,
    })
    setDialog(null)
    return { ok: true }
  }

  const selectedCurrent = selected
    ? (products.find((product) => product.id === selected.id) ?? null)
    : null

  return (
    <div className="space-y-3.5">
      {/* 1. Compact Integrated Workspace Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-2.5 py-0.5 font-mono text-[11px] font-medium text-primary shadow-xs">
              Warehouse Catalog
            </span>
            <span className="text-text-muted text-xs">•</span>
            <span className="font-mono text-xs text-text-muted">
              Session Preview
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Inventory Catalogue
            </h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-md border border-surface-border bg-white px-2.5 py-1 font-mono text-text-secondary shadow-2xs">
                {products.length} SKUs
              </span>
              <span className="rounded-md border border-surface-border bg-white px-2.5 py-1 font-mono text-primary font-semibold shadow-2xs">
                Valuation: {formatInr(inventoryValue)}
              </span>
              {outOfStock > 0 && (
                <span className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 font-mono text-rose-700 font-semibold shadow-2xs">
                  {outOfStock} Stockout
                </span>
              )}
              {lowStockProducts.length > 0 && (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-mono text-amber-800 font-semibold shadow-2xs">
                  {lowStockProducts.length} Low Buffer
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setNotice(null)
              setDialog('add')
            }}
            size="sm"
            variant="primary"
          >
            <Plus aria-hidden="true" size={15} />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {notice && !dialog && (
        <div
          className={`flex items-center justify-between rounded-lg border px-3.5 py-2 text-xs ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss message"
            className="text-current hover:opacity-75"
            onClick={() => setNotice(null)}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Integrated Data Table Card with Natural Toolbar (Starts immediately!) */}
      <Card className="overflow-hidden border border-surface-border bg-white shadow-2xs">
        {/* Integrated Natural Filter Command Bar (Single Compact Row) */}
        <div className="border-b border-surface-border bg-surface-secondary/70 p-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 lg:max-w-xs">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                size={14}
              />
              <input
                aria-label="Search products by name or SKU"
                className="h-9 w-full rounded-lg border border-surface-border bg-white pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-2xs"
                onChange={(event) => setFilter(setSearch, event.target.value)}
                placeholder="Search name, SKU..."
                value={search}
              />
              {search && (
                <button
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  onClick={() => setFilter(setSearch, '')}
                  type="button"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Natural Filter Controls Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Pills */}
              <div className="flex items-center rounded-lg border border-surface-border bg-white p-0.5 shadow-2xs">
                {['All categories', ...categories].map((cat) => (
                  <button
                    key={cat}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                      category === cat
                        ? 'bg-surface-blue text-primary font-semibold shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                    onClick={() => setFilter(setCategory, cat)}
                    type="button"
                  >
                    {cat === 'All categories' ? 'All' : cat}
                  </button>
                ))}
              </div>

              {/* Warehouse Dropdown */}
              <select
                aria-label="Filter by warehouse"
                className="h-8 rounded-lg border border-surface-border bg-white px-2.5 text-xs text-text-secondary outline-none focus:border-primary shadow-2xs"
                onChange={(event) =>
                  setFilter(setWarehouse, event.target.value)
                }
                value={warehouse}
              >
                <option value="All warehouses">All Hubs</option>
                {warehouses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                aria-label="Filter by stock status"
                className="h-8 rounded-lg border border-surface-border bg-white px-2.5 text-xs text-text-secondary outline-none focus:border-primary shadow-2xs"
                onChange={(event) => setFilter(setStatus, event.target.value)}
                value={status}
              >
                <option value="All statuses">All Statuses</option>
                <option value="In Stock">
                  In Stock (
                  {products.filter((p) => p.stock > p.reorderThreshold).length})
                </option>
                <option value="Low Stock">
                  Low Stock ({lowStockProducts.length})
                </option>
                <option value="Out of Stock">
                  Out of Stock ({outOfStock})
                </option>
              </select>

              {/* Rows per page */}
              <select
                aria-label="Rows per page"
                className="h-8 rounded-lg border border-surface-border bg-white px-2 font-mono text-[11px] text-text-muted outline-none focus:border-primary shadow-2xs"
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
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
            </div>
          </div>
        </div>

        {/* 3. The Catalogue Table (Immediate Visibility on 1856x810!) */}
        {loading ? (
          <div className="p-8">
            <LoadingState />
          </div>
        ) : hasDataError ? (
          <div className="p-8">
            <ErrorState
              description="The local inventory preview contains corrupted product records."
              title="Inventory data error"
            />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8">
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    setNotice(null)
                    setDialog('add')
                  }}
                  size="sm"
                >
                  <Plus aria-hidden="true" size={15} />
                  Add product
                </Button>
              }
              description="No products exist in the catalogue yet."
              title="Catalogue is empty"
            />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              description="No products match your current filters. Try resetting search keywords or category filters."
              title="No products found"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="border-b border-surface-border bg-surface-secondary/80 text-[11px] font-medium text-text-secondary">
                <tr>
                  <SortableHeader
                    active={sortKey === 'name'}
                    ascending={sortAscending}
                    label="Product Name"
                    onClick={() => changeSort('name')}
                  />
                  <th className="px-3.5 py-2.5 font-medium">SKU</th>
                  <th className="px-3.5 py-2.5 font-medium">Category</th>
                  <th className="px-3.5 py-2.5 font-medium">Facility</th>
                  <SortableHeader
                    active={sortKey === 'stock'}
                    ascending={sortAscending}
                    label="Available Units"
                    onClick={() => changeSort('stock')}
                  />
                  <SortableHeader
                    active={sortKey === 'price'}
                    ascending={sortAscending}
                    label="Unit Price"
                    onClick={() => changeSort('price')}
                  />
                  <SortableHeader
                    active={sortKey === 'value'}
                    ascending={sortAscending}
                    label="Total Value"
                    onClick={() => changeSort('value')}
                  />
                  <th className="px-3.5 py-2.5 font-medium">Status</th>
                  <th className="px-3.5 py-2.5 font-medium text-right pr-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-sans">
                {visibleProducts.map((product) => {
                  const stockStatus = statusFor(product)
                  const warehouseName =
                    warehouseMap.get(product.warehouseId) ?? 'Unknown'
                  const isSelected = selected?.id === product.id

                  return (
                    <tr
                      key={product.id}
                      className={`text-text-secondary transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-surface-blue/50 text-text-primary'
                          : 'hover:bg-surface-secondary/60'
                      }`}
                      onClick={() => setSelected(product)}
                    >
                      {/* Product Name */}
                      <td className="px-4 py-3">
                        <button
                          className="rounded text-left font-medium text-text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors block"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(product)
                          }}
                          type="button"
                        >
                          {product.name}
                        </button>
                      </td>

                      {/* SKU */}
                      <td className="px-3.5 py-3">
                        <span className="inline-block rounded bg-surface-secondary border border-surface-border px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary">
                          {product.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-3.5 py-3 text-text-secondary">
                        <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] text-text-muted font-medium">
                          {product.category}
                        </span>
                      </td>

                      {/* Warehouse Facility */}
                      <td className="px-3.5 py-3 text-text-secondary text-[11px]">
                        {warehouseName}
                      </td>

                      {/* Available Units with Subtle Inline Stock-Health Gauge */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-text-primary min-w-[32px]">
                            {product.stock}
                          </span>
                          {/* Inline gauge meter */}
                          <div
                            className="w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden"
                            title={`Reorder at ${product.reorderThreshold}`}
                          >
                            <div
                              className={`h-full rounded-full transition-all ${
                                product.stock === 0
                                  ? 'bg-rose-500 w-full'
                                  : product.stock <= product.reorderThreshold
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                              }`}
                              style={{
                                width:
                                  product.stock === 0
                                    ? '100%'
                                    : `${Math.min(100, Math.max(15, (product.stock / ((product.reorderThreshold || 10) * 2.5)) * 100))}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-text-muted">
                            min {product.reorderThreshold}
                          </span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="px-3.5 py-3 font-mono text-[11px] text-text-secondary">
                        {formatInr(product.price)}
                      </td>

                      {/* Total Value */}
                      <td className="px-3.5 py-3 font-mono text-[11px] font-semibold text-text-primary">
                        {formatInr(product.stock * product.price)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-3.5 py-3">
                        <StatusBadge size="sm" tone={stockStatus.tone}>
                          {stockStatus.label}
                        </StatusBadge>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3 text-right pr-4">
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            aria-label={`Inspect ${product.name}`}
                            className="px-1.5 py-1 text-xs"
                            onClick={() => setSelected(product)}
                            size="sm"
                            variant="ghost"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            aria-label={`Stock In ${product.name}`}
                            className="px-1.5 py-1 text-xs"
                            onClick={() => {
                              setSelected(product)
                              setDialog('stock-in')
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            <PackagePlus size={14} />
                          </Button>
                          <Button
                            aria-label={`Edit ${product.name}`}
                            className="px-1.5 py-1 text-xs"
                            onClick={() => {
                              setSelected(product)
                              setDialog('edit')
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            <Pencil size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Table Pagination Footer */}
        <div className="flex flex-col gap-2 border-t border-surface-border px-4 py-2.5 text-xs text-text-secondary sm:flex-row sm:items-center sm:justify-between bg-surface-secondary/50">
          <span className="text-[11px] text-text-muted">
            Showing{' '}
            {filteredProducts.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredProducts.length)} of{' '}
            {filteredProducts.length} filtered items
          </span>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Previous page"
              className="px-2 py-1 text-xs"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              size="sm"
              variant="ghost"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="font-mono text-[11px] text-text-muted">
              Page {page} of {pageCount}
            </span>
            <Button
              aria-label="Next page"
              className="px-2 py-1 text-xs"
              disabled={page === pageCount || filteredProducts.length === 0}
              onClick={() => setPage((current) => current + 1)}
              size="sm"
              variant="ghost"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      {/* 5. Intentional Slide-out Product Inspection Drawer */}
      {selectedCurrent && (
        <ProductDrawer
          onClose={() => setSelected(null)}
          onEdit={() => setDialog('edit')}
          onStockIn={() => setDialog('stock-in')}
          onStockOut={() => setDialog('stock-out')}
          product={selectedCurrent}
        />
      )}

      {/* 6. Product Modals (Add, Edit, Stock Operations) */}
      {dialog && (
        <ProductDialog
          mode={dialog}
          onClose={() => setDialog(null)}
          onSave={handleSave}
          onStock={handleStock}
          product={dialog === 'add' ? null : selectedCurrent}
        />
      )}
    </div>
  )
}

function SortableHeader({
  active,
  ascending,
  label,
  onClick,
}: {
  active: boolean
  ascending: boolean
  label: string
  onClick: () => void
}) {
  return (
    <th className="px-3.5 py-2.5 font-medium first:pl-4">
      <button
        className="inline-flex items-center gap-1 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded transition-colors"
        onClick={onClick}
        type="button"
      >
        <span>{label}</span>
        {active && (
          <span className="text-primary font-mono">
            {ascending ? '↑' : '↓'}
          </span>
        )}
      </button>
    </th>
  )
}

function ProductDrawer({
  onClose,
  onEdit,
  onStockIn,
  onStockOut,
  product,
}: {
  onClose: () => void
  onEdit: () => void
  onStockIn: () => void
  onStockOut: () => void
  product: Product
}) {
  const triggerRef = useRef<HTMLElement | null>(null)
  const drawerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null
    const closeBtn = drawerRef.current?.querySelector<HTMLButtonElement>(
      'button[aria-label="Close product details"]',
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

  const { warehouses } = useWarehouseStore()
  const warehouseName = warehouses.find(
    (item) => item.id === product.warehouseId,
  )?.name

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <aside
        aria-label="Product details"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-surface-border bg-white p-6 shadow-2xl flex flex-col justify-between"
        ref={drawerRef}
        role="dialog"
      >
        <div>
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <span className="text-xs font-semibold text-primary">
              Product Inspection
            </span>
            <Button
              aria-label="Close product details"
              onClick={onClose}
              size="sm"
              variant="ghost"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-surface-secondary border border-surface-border px-1.5 py-0.5 font-mono text-xs font-bold text-primary">
                {product.sku}
              </span>
              <StatusBadge size="sm" tone={statusFor(product).tone}>
                {statusFor(product).label}
              </StatusBadge>
            </div>
            <h2
              className="mt-2 font-display text-xl font-bold text-text-primary"
              id="drawer-product-title"
            >
              {product.name}
            </h2>
          </div>

          <div className="mt-6 space-y-2.5 rounded-xl border border-surface-border bg-surface-secondary/60 p-4">
            {[
              ['Category', product.category],
              ['Storage Facility', warehouseName ?? 'Unknown'],
              [
                'Available Quantity',
                `${product.stock.toLocaleString('en-IN')} units`,
              ],
              ['Unit Price', formatInr(product.price)],
              ['Inventory Valuation', formatInr(product.stock * product.price)],
              ['Reorder Threshold', `${product.reorderThreshold} units`],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between border-b border-surface-border/50 pb-2 text-xs last:border-0 last:pb-0"
                key={label}
              >
                <span className="text-text-muted">{label}</span>
                <span className="font-semibold text-text-primary font-mono">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-surface-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onStockIn} variant="primary">
              <PackagePlus size={15} />
              <span>Stock In</span>
            </Button>
            <Button onClick={onStockOut} variant="secondary">
              <PackagePlus size={15} />
              <span>Stock Out</span>
            </Button>
          </div>
          <Button className="w-full" onClick={onEdit} variant="outline">
            <Pencil size={15} />
            <span>Edit Product Details</span>
          </Button>
        </div>
      </aside>
    </>
  )
}

function ProductDialog({
  mode,
  onClose,
  onSave,
  onStock,
  product,
}: {
  mode: Exclude<DialogMode, null>
  onClose: () => void
  onSave: (input: ProductInput & { id?: string }) => StoreOperationResult
  onStock: (
    quantity: number,
    operation: 'Stock In' | 'Stock Out',
  ) => StoreOperationResult
  product: Product | null
}) {
  const isStock = mode === 'stock-in' || mode === 'stock-out'
  const triggerRef = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const { warehouses } = useWarehouseStore()

  const [quantity, setQuantity] = useState('')
  const [name, setName] = useState(product?.name ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [category, setCategory] = useState(product?.category ?? categories[0])
  const [warehouseId, setWarehouseId] = useState(
    product?.warehouseId ?? (warehouses[0]?.id || ''),
  )
  const [price, setPrice] = useState(
    product && product.price > 0 ? String(product.price) : '',
  )
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [reorderThreshold, setReorderThreshold] = useState(
    product ? String(product.reorderThreshold) : '10',
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null
    const firstInput = dialogRef.current?.querySelector<
      HTMLInputElement | HTMLButtonElement
    >('input, button[aria-label="Close dialog"]')
    firstInput?.focus()

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (isStock) {
      const parsedQuantity = Number(quantity)
      if (
        !quantity.trim() ||
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity <= 0
      ) {
        setError('Quantity must be a positive integer.')
        return
      }

      const operation = mode === 'stock-in' ? 'Stock In' : 'Stock Out'
      const result = onStock(parsedQuantity, operation)
      if (!result.ok) {
        setError(result.message)
      }
      return
    }

    const parsedPrice = Number(price)
    const parsedStock = Number(stock)
    const parsedReorder = Number(reorderThreshold)

    if (!name.trim()) {
      setError('Product name is required.')
      return
    }
    if (!sku.trim()) {
      setError('SKU is required.')
      return
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Unit price must be a positive number.')
      return
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setError('Initial stock must be zero or a positive integer.')
      return
    }
    if (!Number.isInteger(parsedReorder) || parsedReorder < 0) {
      setError('Reorder threshold must be zero or a positive integer.')
      return
    }

    const result = onSave({
      id: product?.id,
      name: name.trim(),
      sku: sku.trim(),
      category,
      warehouseId,
      price: parsedPrice,
      stock: parsedStock,
      reorderThreshold: parsedReorder,
    })

    if (!result.ok) {
      setError(result.message)
    }
  }

  const title =
    mode === 'add'
      ? 'Add Product'
      : mode === 'edit'
        ? `Edit ${product?.name ?? 'Product'}`
        : mode === 'stock-in'
          ? `Stock In — ${product?.name ?? 'Product'}`
          : `Stock Out — ${product?.name ?? 'Product'}`

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
      >
        <div
          className="w-full max-w-lg rounded-xl border border-surface-border bg-white p-6 shadow-2xl"
          ref={dialogRef}
        >
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h2
              className="font-display text-lg font-bold text-text-primary"
              id="dialog-title"
            >
              {title}
            </h2>
            <Button
              aria-label="Close dialog"
              onClick={onClose}
              size="sm"
              variant="ghost"
            >
              <X size={16} />
            </Button>
          </div>

          {error && (
            <div
              className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              role="alert"
            >
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
            {isStock ? (
              <TextInput
                autoFocus
                id="stock-quantity"
                label="Quantity"
                min="1"
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Number of units"
                step="1"
                type="number"
                value={quantity}
              />
            ) : (
              <>
                <TextInput
                  autoFocus
                  id="product-name"
                  label="Product Name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Heavy Duty Pallet"
                  value={name}
                />
                <TextInput
                  id="product-sku"
                  label="SKU Code"
                  onChange={(event) => setSku(event.target.value)}
                  placeholder="e.g. SKU-PLT-001"
                  value={sku}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-xs font-medium text-text-secondary mb-1"
                      htmlFor="product-category"
                    >
                      Category
                    </label>
                    <select
                      className="h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-xs text-text-primary outline-none focus:border-primary shadow-2xs"
                      id="product-category"
                      onChange={(event) => setCategory(event.target.value)}
                      value={category}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium text-text-secondary mb-1"
                      htmlFor="product-warehouse"
                    >
                      Facility
                    </label>
                    <select
                      className="h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-xs text-text-primary outline-none focus:border-primary shadow-2xs"
                      id="product-warehouse"
                      onChange={(event) => setWarehouseId(event.target.value)}
                      value={warehouseId}
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <TextInput
                    id="product-price"
                    label="Price (₹)"
                    min="0.01"
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={price}
                  />
                  <TextInput
                    id="product-stock"
                    label="Initial Stock"
                    min="0"
                    onChange={(event) => setStock(event.target.value)}
                    placeholder="0"
                    step="1"
                    type="number"
                    value={stock}
                  />
                  <TextInput
                    id="product-reorder"
                    label="Reorder Min"
                    min="0"
                    onChange={(event) =>
                      setReorderThreshold(event.target.value)
                    }
                    placeholder="10"
                    step="1"
                    type="number"
                    value={reorderThreshold}
                  />
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t border-surface-border pt-4">
              <Button onClick={onClose} size="sm" type="button" variant="ghost">
                Cancel
              </Button>
              <Button size="sm" type="submit" variant="primary">
                {isStock
                  ? 'Record Movement'
                  : mode === 'add'
                    ? 'Create Product'
                    : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
