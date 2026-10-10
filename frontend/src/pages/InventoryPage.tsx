import {
  ChevronLeft,
  ChevronRight,
  Eye,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextInput } from '@/components/ui/TextInput'
import { useInventoryStore } from '@/lib/inventoryStore'
import { formatInr } from '@/lib/formatters'
import { warehouses, type Product } from '@/mocks/inventoryData'

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
  const {
    addProduct,
    applyStockOperation,
    lowStockProducts,
    products,
    updateProduct,
  } = useInventoryStore()
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 250)
    return () => window.clearTimeout(timer)
  }, [])

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

  function handleSave(input: ProductInput) {
    const duplicate = products.some(
      (product) =>
        product.id !== input.id &&
        product.sku.toLowerCase() === input.sku.toLowerCase(),
    )
    if (duplicate) {
      setNotice({ type: 'error', message: 'That SKU is already in use.' })
      return
    }
    if (
      !input.name.trim() ||
      !/^[A-Za-z0-9-]+$/.test(input.sku) ||
      input.price <= 0 ||
      input.stock < 0 ||
      input.reorderThreshold < 0
    ) {
      setNotice({
        type: 'error',
        message: 'Complete the required fields with valid values.',
      })
      return
    }
    if (input.id) updateProduct(input.id, input)
    else addProduct(input)
    setNotice({
      type: 'success',
      message: input.id
        ? 'Product updated in the mock dataset.'
        : 'Product added to the mock dataset.',
    })
    setDialog(null)
  }

  function handleStock(quantity: number, operation: 'Stock In' | 'Stock Out') {
    if (!selected) return
    const result = applyStockOperation(selected.id, quantity, operation)
    if (!result.ok) {
      setNotice({ type: 'error', message: result.message })
      return
    }
    setNotice({
      type: 'success',
      message: `${operation} recorded in the mock transaction history.`,
    })
    setDialog(null)
    setSelected(null)
  }

  const selectedCurrent = selected
    ? (products.find((product) => product.id === selected.id) ?? null)
    : null

  return (
    <div className="grid gap-8">
      <PageHeader
        action={
          <Button
            onClick={() => {
              setNotice(null)
              setDialog('add')
            }}
          >
            <Plus aria-hidden="true" size={17} />
            Add product
          </Button>
        }
        description="Search, review and adjust the local product catalogue across all warehouse locations."
        eyebrow="Workspace"
        title="Inventory"
      />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-xs text-text-secondary">
        <span className="h-2 w-2 rounded-full bg-secondary" />
        Mock data preview — changes stay in this browser session and do not
        update real warehouse stock.
      </div>
      {notice && (
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            'Total products',
            products.length.toLocaleString('en-IN'),
            'Catalogue items',
          ],
          [
            'Low-stock products',
            lowStockProducts.length.toLocaleString('en-IN'),
            'At or below threshold',
          ],
          [
            'Out of stock',
            outOfStock.toLocaleString('en-IN'),
            'Require replenishment',
          ],
          ['Inventory value', formatInr(inventoryValue), 'Current unit prices'],
        ].map(([label, value, detail]) => (
          <Card className="p-5" key={label}>
            <p className="text-sm text-text-muted">{label}</p>
            <p className="mt-5 font-display text-2xl font-semibold text-text-primary">
              {value}
            </p>
            <p className="mt-2 text-xs text-text-muted">{detail}</p>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_repeat(3,1fr)_auto]">
          <label className="relative">
            <span className="sr-only">Search products</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              aria-label="Search products by name or SKU"
              className="h-11 w-full rounded-xl border border-surface-3 bg-sidebar pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
              onChange={(event) => setFilter(setSearch, event.target.value)}
              placeholder="Search product or SKU"
              value={search}
            />
          </label>
          <FilterSelect
            ariaLabel="Filter by category"
            onChange={(value) => setFilter(setCategory, value)}
            options={['All categories', ...categories]}
            value={category}
          />
          <FilterSelect
            ariaLabel="Filter by warehouse"
            onChange={(value) => setFilter(setWarehouse, value)}
            options={['All warehouses', ...warehouses.map((item) => item.id)]}
            labels={Object.fromEntries(
              warehouses.map((item) => [item.id, item.name]),
            )}
            value={warehouse}
          />
          <FilterSelect
            ariaLabel="Filter by stock status"
            onChange={(value) => setFilter(setStatus, value)}
            options={['All statuses', 'In Stock', 'Low Stock', 'Out of Stock']}
            value={status}
          />
          <select
            aria-label="Rows per page"
            className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-secondary outline-none focus:border-primary"
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
      </Card>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-3/70 px-5 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Product catalogue
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {filteredProducts.length} result
              {filteredProducts.length === 1 ? '' : 's'} found
            </p>
          </div>
          <span className="hidden text-xs text-text-muted sm:inline">
            Select a row to inspect details
          </span>
        </div>
        {loading ? (
          <div className="p-5">
            <LoadingState />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              description="Try clearing a filter or searching for another SKU."
              title="No products match"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-sidebar/60 text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <SortableHeader
                    label="Product"
                    active={sortKey === 'name'}
                    ascending={sortAscending}
                    onClick={() => changeSort('name')}
                  />
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Warehouse</th>
                  <SortableHeader
                    label="Available"
                    active={sortKey === 'stock'}
                    ascending={sortAscending}
                    onClick={() => changeSort('stock')}
                  />
                  <SortableHeader
                    label="Unit price"
                    active={sortKey === 'price'}
                    ascending={sortAscending}
                    onClick={() => changeSort('price')}
                  />
                  <SortableHeader
                    label="Value"
                    active={sortKey === 'value'}
                    ascending={sortAscending}
                    onClick={() => changeSort('value')}
                  />
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/60">
                {visibleProducts.map((product) => {
                  const stockStatus = statusFor(product)
                  const warehouseName =
                    warehouses.find((item) => item.id === product.warehouseId)
                      ?.name ?? 'Unknown'
                  return (
                    <tr className="text-text-secondary" key={product.id}>
                      <td className="px-5 py-4">
                        <button
                          className="text-left font-medium text-text-primary hover:text-primary"
                          onClick={() => setSelected(product)}
                          type="button"
                        >
                          {product.name}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs">
                        {product.sku}
                      </td>
                      <td className="px-4 py-4">{product.category}</td>
                      <td className="px-4 py-4">{warehouseName}</td>
                      <td className="px-4 py-4 font-medium text-text-primary">
                        {product.stock}
                      </td>
                      <td className="px-4 py-4">{formatInr(product.price)}</td>
                      <td className="px-4 py-4">
                        {formatInr(product.stock * product.price)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={stockStatus.tone}>
                          {stockStatus.label}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <Button
                            aria-label={`View ${product.name}`}
                            className="px-2"
                            onClick={() => setSelected(product)}
                            variant="ghost"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            aria-label={`Edit ${product.name}`}
                            className="px-2"
                            onClick={() => {
                              setSelected(product)
                              setDialog('edit')
                            }}
                            variant="ghost"
                          >
                            <Pencil size={16} />
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
        <div className="flex flex-col gap-3 border-t border-surface-3/70 px-5 py-4 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing{' '}
            {filteredProducts.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredProducts.length)} of{' '}
            {filteredProducts.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              aria-label="Previous page"
              className="px-2"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
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
              disabled={page === pageCount}
              onClick={() => setPage((current) => current + 1)}
              variant="ghost"
            >
              <ChevronRight size={17} />
            </Button>
          </div>
        </div>
      </Card>
      {selectedCurrent && (
        <ProductDrawer
          product={selectedCurrent}
          onClose={() => setSelected(null)}
          onEdit={() => setDialog('edit')}
          onStockIn={() => setDialog('stock-in')}
          onStockOut={() => setDialog('stock-out')}
        />
      )}
      {dialog && (
        <ProductDialog
          mode={dialog}
          product={selectedCurrent}
          onClose={() => setDialog(null)}
          onSave={handleSave}
          onStock={handleStock}
        />
      )}
      {loading && (
        <ErrorState
          description="The local inventory preview could not be loaded."
          title="Inventory unavailable"
        />
      )}
    </div>
  )
}

type ProductInput = Omit<Product, 'id'> & { id?: string }

function FilterSelect({
  ariaLabel,
  labels = {},
  onChange,
  options,
  value,
}: {
  ariaLabel: string
  labels?: Record<string, string>
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-secondary outline-none focus:border-primary"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {labels[option] ?? option}
        </option>
      ))}
    </select>
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
    <th className="px-4 py-3 font-medium first:pl-5">
      <button
        className="inline-flex items-center gap-1 hover:text-text-primary"
        onClick={onClick}
        type="button"
      >
        {label}
        {active && (ascending ? ' ↑' : ' ↓')}
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
  const warehouseName = warehouses.find(
    (item) => item.id === product.warehouseId,
  )?.name
  return (
    <aside
      aria-label="Product details"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-surface-3 bg-sidebar p-6 shadow-2xl shadow-black/40"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Product detail
        </p>
        <Button
          aria-label="Close product details"
          onClick={onClose}
          variant="ghost"
        >
          <X size={18} />
        </Button>
      </div>
      <h2 className="mt-8 font-display text-2xl font-semibold text-text-primary">
        {product.name}
      </h2>
      <p className="mt-2 font-mono text-xs text-text-muted">{product.sku}</p>
      <div className="mt-8 grid gap-4">
        {[
          ['Category', product.category],
          ['Warehouse', warehouseName ?? 'Unknown'],
          ['Available quantity', `${product.stock} units`],
          ['Unit price', formatInr(product.price)],
          ['Inventory value', formatInr(product.stock * product.price)],
          ['Reorder threshold', `${product.reorderThreshold} units`],
        ].map(([label, value]) => (
          <div
            className="flex items-center justify-between border-b border-surface-3/70 py-3 text-sm"
            key={label}
          >
            <span className="text-text-muted">{label}</span>
            <span className="font-medium text-text-primary">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-3">
        <Button onClick={onStockIn}>
          <PackagePlus size={17} />
          Stock in
        </Button>
        <Button onClick={onStockOut} variant="secondary">
          <PackagePlus size={17} />
          Stock out
        </Button>
        <Button onClick={onEdit} variant="ghost">
          <Pencil size={16} />
          Edit product
        </Button>
      </div>
    </aside>
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
  onSave: (input: ProductInput) => void
  onStock: (quantity: number, operation: 'Stock In' | 'Stock Out') => void
  product: Product | null
}) {
  const isStock = mode === 'stock-in' || mode === 'stock-out'
  const [quantity, setQuantity] = useState('')
  const [form, setForm] = useState<ProductInput>(
    product
      ? { ...product }
      : {
          name: '',
          sku: '',
          category: categories[0],
          warehouseId: warehouses[0].id,
          price: 0,
          stock: 0,
          reorderThreshold: 10,
        },
  )
  const [error, setError] = useState('')
  function update<K extends keyof ProductInput>(
    key: K,
    value: ProductInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4"
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {isStock
              ? mode === 'stock-in'
                ? 'Stock in'
                : 'Stock out'
              : product
                ? 'Edit product'
                : 'Add product'}
          </h2>
          <Button aria-label="Close dialog" onClick={onClose} variant="ghost">
            <X size={18} />
          </Button>
        </div>
        {isStock ? (
          <div className="mt-6 grid gap-4">
            <p className="text-sm text-text-secondary">
              {product?.name} currently has {product?.stock} units available.
            </p>
            <TextInput
              label="Quantity"
              min="1"
              onChange={(event) => setQuantity(event.target.value)}
              type="number"
              value={quantity}
            />
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <Button
              onClick={() => {
                const value = Number(quantity)
                if (!Number.isInteger(value) || value <= 0) {
                  setError('Enter a whole number greater than zero.')
                  return
                }
                onStock(value, mode === 'stock-in' ? 'Stock In' : 'Stock Out')
              }}
            >
              Confirm {mode === 'stock-in' ? 'stock in' : 'stock out'}
            </Button>
          </div>
        ) : (
          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSave(form)
            }}
          >
            <TextInput
              label="Product name"
              onChange={(event) => update('name', event.target.value)}
              required
              value={form.name}
            />
            <TextInput
              label="SKU"
              onChange={(event) => update('sku', event.target.value)}
              required
              value={form.sku}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FilterSelect
                ariaLabel="Category"
                onChange={(value) => update('category', value)}
                options={categories}
                value={form.category}
              />
              <FilterSelect
                ariaLabel="Warehouse"
                onChange={(value) => update('warehouseId', value)}
                options={warehouses.map((item) => item.id)}
                labels={Object.fromEntries(
                  warehouses.map((item) => [item.id, item.name]),
                )}
                value={form.warehouseId}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput
                label="Unit price"
                min="0.01"
                onChange={(event) =>
                  update('price', Number(event.target.value))
                }
                required
                step="0.01"
                type="number"
                value={form.price || ''}
              />
              <TextInput
                label="Available quantity"
                min="0"
                onChange={(event) =>
                  update('stock', Number(event.target.value))
                }
                required
                type="number"
                value={form.stock}
              />
              <TextInput
                label="Reorder threshold"
                min="0"
                onChange={(event) =>
                  update('reorderThreshold', Number(event.target.value))
                }
                required
                type="number"
                value={form.reorderThreshold}
              />
            </div>
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <Button type="submit">
              {product ? 'Save changes' : 'Add product'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
