import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  Download,
  IndianRupee,
  Layers,
  Package,
  RotateCcw,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Warehouse,
  XCircle,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatInr } from '@/lib/formatters'
import { useInventoryStore } from '@/lib/inventoryStore'
import {
  calculateCategoryValuation,
  calculateInventoryValuation,
  calculateMovementByWarehouse,
  calculateMovementSummary,
  calculateMovementTrends,
  calculateWarehouseDistribution,
  downloadCsvFile,
  filterTransactions,
  generateInventoryReportCsv,
  generateMovementReportCsv,
  getMostFrequentlyMovedProducts,
  getTopValuedProducts,
  type MovementFilters,
  type ReportDateRange,
} from '@/lib/reportUtils'
import { useTransactionStore } from '@/lib/transactionStore'
import { useWarehouseStore } from '@/lib/warehouseStore'

const CATEGORY_COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
const WAREHOUSE_COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6']

export function ReportsPage() {
  const { products } = useInventoryStore()
  const { transactions } = useTransactionStore()
  const { warehouses } = useWarehouseStore()

  // Tab State
  const [activeTab, setActiveTab] = useState<'valuation' | 'movement'>(
    'valuation',
  )

  // Filters State
  const [dateRange, setDateRange] = useState<ReportDateRange>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState('All')

  // Available unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      if (p.category) set.add(p.category)
    }
    return Array.from(set).sort()
  }, [products])

  // Products lookup map
  const productsById = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]))
  }, [products])

  // Reset filters handler
  function handleResetFilters() {
    setDateRange('30d')
    setCustomStart('')
    setCustomEnd('')
    setSelectedWarehouse('All')
    setSelectedCategory('All')
    setSelectedType('All')
  }

  // Filtered Products for Valuation
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false
      }
      if (selectedWarehouse !== 'All') {
        if (p.warehouseStock && typeof p.warehouseStock === 'object') {
          const locStock = p.warehouseStock[selectedWarehouse]
          if (!locStock || locStock <= 0) return false
        } else if (p.warehouseId !== selectedWarehouse) {
          return false
        }
      }
      return true
    })
  }, [products, selectedCategory, selectedWarehouse])

  // Filtered Transactions for Movement Analytics
  const movementFilterPayload: MovementFilters = useMemo(
    () => ({
      dateRange,
      customStartDate: customStart || undefined,
      customEndDate: customEnd || undefined,
      warehouseId: selectedWarehouse,
      category: selectedCategory,
      type: selectedType,
    }),
    [
      dateRange,
      customStart,
      customEnd,
      selectedWarehouse,
      selectedCategory,
      selectedType,
    ],
  )

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, movementFilterPayload, productsById)
  }, [transactions, movementFilterPayload, productsById])

  // Computed Summaries
  const valuationSummary = useMemo(() => {
    return calculateInventoryValuation(filteredProducts)
  }, [filteredProducts])

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryValuation(filteredProducts)
  }, [filteredProducts])

  const warehouseDistribution = useMemo(() => {
    return calculateWarehouseDistribution(filteredProducts, warehouses)
  }, [filteredProducts, warehouses])

  const topValuedProducts = useMemo(() => {
    return getTopValuedProducts(filteredProducts, 10)
  }, [filteredProducts])

  const movementSummary = useMemo(() => {
    return calculateMovementSummary(filteredTransactions)
  }, [filteredTransactions])

  const movementTrends = useMemo(() => {
    return calculateMovementTrends(filteredTransactions)
  }, [filteredTransactions])

  const warehouseMovements = useMemo(() => {
    return calculateMovementByWarehouse(filteredTransactions, warehouses)
  }, [filteredTransactions, warehouses])

  const topMovedProducts = useMemo(() => {
    return getMostFrequentlyMovedProducts(filteredTransactions, 5)
  }, [filteredTransactions])

  // CSV Export Handlers
  function handleExportValuationCsv() {
    const csvContent = generateInventoryReportCsv(filteredProducts, warehouses)
    const today = new Date().toISOString().slice(0, 10)
    downloadCsvFile(`invora-inventory-valuation-${today}.csv`, csvContent)
  }

  function handleExportMovementsCsv() {
    const csvContent = generateMovementReportCsv(
      filteredTransactions,
      warehouses,
    )
    const today = new Date().toISOString().slice(0, 10)
    downloadCsvFile(`invora-stock-movements-${today}.csv`, csvContent)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              aria-label="Export Inventory Valuation CSV"
              onClick={handleExportValuationCsv}
              variant="secondary"
            >
              <Download aria-hidden="true" size={16} />
              Export Valuation CSV
            </Button>
            <Button
              aria-label="Export Stock Movement CSV"
              onClick={handleExportMovementsCsv}
              variant="secondary"
            >
              <Download aria-hidden="true" size={16} />
              Export Movement CSV
            </Button>
          </div>
        }
        description="Multi-facility inventory valuation, category distribution, stock movement velocity, and turnover analysis derived from active records."
        eyebrow="Intelligence & Analytics"
        title="Reports & Analytics"
      />

      {/* Primary KPI Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Inventory Value
            </span>
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <IndianRupee aria-hidden="true" size={18} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-bold tracking-tight text-text-primary">
            {formatInr(valuationSummary.totalValue)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Est. based on current unit prices
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Units in Stock
            </span>
            <span className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
              <Boxes aria-hidden="true" size={18} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-bold tracking-tight text-text-primary">
            {valuationSummary.totalUnits.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Units across selected facilities
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Catalog Products
            </span>
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Package aria-hidden="true" size={18} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-bold tracking-tight text-text-primary">
            {valuationSummary.totalProducts.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Total active catalog lines
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Low Stock Items
            </span>
            <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <AlertTriangle aria-hidden="true" size={18} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-bold tracking-tight text-amber-400">
            {valuationSummary.lowStockCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            At or below reorder threshold
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Stockout Items
            </span>
            <span className="rounded-lg bg-danger/10 p-2 text-danger">
              <XCircle aria-hidden="true" size={18} />
            </span>
          </div>
          <p className="mt-4 font-display text-2xl font-bold tracking-tight text-danger">
            {valuationSummary.outOfStockCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Zero available physical stock
          </p>
        </Card>
      </div>

      {/* Global Filter Bar */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <SlidersHorizontal
              aria-hidden="true"
              className="text-primary"
              size={18}
            />
            <span>Reporting Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Picker */}
            <div className="flex rounded-xl border border-surface-3 bg-sidebar p-1">
              {(
                [
                  { label: '7 Days', val: '7d' },
                  { label: '30 Days', val: '30d' },
                  { label: '90 Days', val: '90d' },
                  { label: 'All History', val: 'all' },
                  { label: 'Custom', val: 'custom' },
                ] as const
              ).map(({ label, val }) => (
                <button
                  aria-pressed={dateRange === val}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    dateRange === val
                      ? 'bg-surface-3 text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                  key={val}
                  onClick={() => setDateRange(val)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Warehouse Filter */}
            <select
              aria-label="Filter by warehouse"
              className="h-9 rounded-xl border border-surface-3 bg-surface-2 px-3 text-xs text-text-primary focus:border-primary focus:outline-none"
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              value={selectedWarehouse}
            >
              <option value="All">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.city})
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              aria-label="Filter by category"
              className="h-9 rounded-xl border border-surface-3 bg-surface-2 px-3 text-xs text-text-primary focus:border-primary focus:outline-none"
              onChange={(e) => setSelectedCategory(e.target.value)}
              value={selectedCategory}
            >
              <option value="All">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Transaction Type Filter */}
            <select
              aria-label="Filter by transaction type"
              className="h-9 rounded-xl border border-surface-3 bg-surface-2 px-3 text-xs text-text-primary focus:border-primary focus:outline-none"
              onChange={(e) => setSelectedType(e.target.value)}
              value={selectedType}
            >
              <option value="All">All Movements</option>
              <option value="Stock In">Stock In</option>
              <option value="Stock Out">Stock Out</option>
              <option value="Adjustment">Adjustment</option>
              <option value="Transfer">Transfer</option>
            </select>

            {/* Reset Filters Action */}
            <Button
              aria-label="Reset all filters"
              className="h-9 text-xs"
              onClick={handleResetFilters}
              variant="ghost"
            >
              <RotateCcw aria-hidden="true" size={14} />
              Reset
            </Button>
          </div>
        </div>

        {/* Custom Date Range Sub-row */}
        {dateRange === 'custom' && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-surface-3/60 pt-4">
            <span className="text-xs text-text-muted">Custom Period:</span>
            <input
              aria-label="Start date"
              className="h-8 w-36 rounded-xl border border-surface-3 bg-surface-2 px-2.5 text-xs text-text-primary focus:border-primary focus:outline-none"
              onChange={(e) => setCustomStart(e.target.value)}
              placeholder="YYYY-MM-DD"
              type="date"
              value={customStart}
            />
            <span className="text-xs text-text-muted">to</span>
            <input
              aria-label="End date"
              className="h-8 w-36 rounded-xl border border-surface-3 bg-surface-2 px-2.5 text-xs text-text-primary focus:border-primary focus:outline-none"
              onChange={(e) => setCustomEnd(e.target.value)}
              placeholder="YYYY-MM-DD"
              type="date"
              value={customEnd}
            />
            {customStart && customEnd && customStart > customEnd && (
              <span className="text-xs text-danger">
                Start date must be on or before end date.
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Main Section Tabs */}
      <div className="border-b border-surface-3/70">
        <nav aria-label="Report sections" className="flex gap-6">
          <button
            className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'valuation'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('valuation')}
            type="button"
          >
            Inventory Valuation & Distribution
          </button>
          <button
            className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'movement'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
            onClick={() => setActiveTab('movement')}
            type="button"
          >
            Stock Movement & Velocity Analytics
          </button>
        </nav>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: INVENTORY VALUATION & DISTRIBUTION                             */}
      {/* ===================================================================== */}
      {activeTab === 'valuation' && (
        <div className="space-y-8">
          {/* Charts Row: Category Breakdown + Warehouse Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Category Breakdown Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-text-primary">
                    Category Valuation Share
                  </h3>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Estimated valuation and units grouped by product category
                  </p>
                </div>
                <Layers aria-hidden="true" className="text-primary" size={18} />
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    description="No inventory matches the current filter selection."
                    title="No category data"
                  />
                </div>
              ) : (
                <>
                  <div className="mt-6 h-64 w-full">
                    <ResponsiveContainer height="100%" width="100%">
                      <PieChart>
                        <Pie
                          cx="50%"
                          cy="50%"
                          data={categoryBreakdown}
                          dataKey="totalValue"
                          innerRadius={55}
                          nameKey="category"
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell
                              fill={
                                CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                              }
                              key={entry.category}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#242e2b',
                            border: '1px solid #2c3734',
                            borderRadius: 12,
                            color: '#edf3f0',
                            fontSize: 12,
                          }}
                          formatter={(value: unknown) => [
                            formatInr(Number(value)),
                            'Valuation',
                          ]}
                        />
                        <Legend
                          formatter={(val) => (
                            <span className="text-xs text-text-secondary">
                              {val}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 divide-y divide-surface-3/50 overflow-hidden rounded-xl border border-surface-3/60">
                    {categoryBreakdown.map((cat, idx) => (
                      <div
                        className="flex items-center justify-between px-4 py-2.5 text-xs"
                        key={cat.category}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                            }}
                          />
                          <span className="font-medium text-text-primary">
                            {cat.category}
                          </span>
                          <span className="text-text-muted">
                            ({cat.productCount} lines)
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-text-secondary">
                            {cat.totalStock.toLocaleString('en-IN')} units
                          </span>
                          <span className="font-semibold text-text-primary">
                            {formatInr(cat.totalValue)}
                          </span>
                          <span className="w-12 text-right font-mono text-[11px] text-text-muted">
                            {cat.percentageOfValue}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Warehouse Distribution Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-text-primary">
                    Warehouse Stock Allocation
                  </h3>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Total stock units and estimated inventory value per facility
                  </p>
                </div>
                <Warehouse
                  aria-hidden="true"
                  className="text-primary"
                  size={18}
                />
              </div>

              {warehouseDistribution.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    description="No warehouse inventory found for this filter."
                    title="No warehouse data"
                  />
                </div>
              ) : (
                <>
                  <div className="mt-6 h-64 w-full">
                    <ResponsiveContainer height="100%" width="100%">
                      <BarChart
                        data={warehouseDistribution}
                        margin={{ left: 0, right: 12, top: 12 }}
                      >
                        <CartesianGrid
                          stroke="#2c3734"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          axisLine={false}
                          dataKey="warehouseName"
                          tick={{ fill: '#8a9b95', fontSize: 11 }}
                          tickLine={false}
                        />
                        <YAxis
                          axisLine={false}
                          tick={{ fill: '#8a9b95', fontSize: 11 }}
                          tickLine={false}
                          width={44}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#242e2b',
                            border: '1px solid #2c3734',
                            borderRadius: 12,
                            color: '#edf3f0',
                            fontSize: 12,
                          }}
                          formatter={(value: unknown, name: unknown) => [
                            name === 'totalStock'
                              ? `${Number(value).toLocaleString('en-IN')} units`
                              : formatInr(Number(value)),
                            name === 'totalStock' ? 'Stock Units' : 'Valuation',
                          ]}
                        />
                        <Bar
                          dataKey="totalStock"
                          name="Units in Stock"
                          radius={[6, 6, 0, 0]}
                        >
                          {warehouseDistribution.map((entry, index) => (
                            <Cell
                              fill={
                                WAREHOUSE_COLORS[
                                  index % WAREHOUSE_COLORS.length
                                ]
                              }
                              key={entry.warehouseId}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 divide-y divide-surface-3/50 overflow-hidden rounded-xl border border-surface-3/60">
                    {warehouseDistribution.map((wh, idx) => (
                      <div
                        className="flex items-center justify-between px-4 py-2.5 text-xs"
                        key={wh.warehouseId}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                WAREHOUSE_COLORS[idx % WAREHOUSE_COLORS.length],
                            }}
                          />
                          <span className="font-medium text-text-primary">
                            {wh.warehouseName}
                          </span>
                          <span className="text-text-muted">
                            ({wh.productCount} lines)
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-text-secondary">
                            {wh.totalStock.toLocaleString('en-IN')} units
                          </span>
                          <span className="font-semibold text-text-primary">
                            {formatInr(wh.totalValue)}
                          </span>
                          <span className="w-12 text-right font-mono text-[11px] text-text-muted">
                            {wh.percentageOfStock}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Top 10 Products by Inventory Value */}
          <Card className="overflow-hidden">
            <div className="border-b border-surface-3/70 p-6">
              <h3 className="font-display text-base font-semibold text-text-primary">
                Top 10 Products by Inventory Valuation
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Highest capital inventory assets based on quantity multiplied by
                current unit price
              </p>
            </div>

            {topValuedProducts.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  description="No products match the selected criteria."
                  title="No items to display"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-sidebar/60 text-xs uppercase tracking-wide text-text-muted">
                    <tr>
                      <th className="px-5 py-3 font-medium">Rank & Product</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Stock on Hand
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Valuation
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        % of Catalog
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-3/60">
                    {topValuedProducts.map((item, index) => (
                      <tr
                        className="transition-colors hover:bg-surface-2/40"
                        key={item.id}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-3 font-mono text-xs font-bold text-text-muted">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-text-primary">
                                {item.name}
                              </p>
                              <p className="font-mono text-xs text-text-muted">
                                {item.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-md bg-surface-2 px-2.5 py-1 text-xs text-text-secondary">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-xs text-text-secondary">
                          {formatInr(item.price)}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-xs font-semibold text-text-primary">
                          {item.stock.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm font-bold text-primary">
                          {formatInr(item.totalValue)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    item.percentageOfTotalValue * 3,
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs text-text-muted">
                              {item.percentageOfTotalValue}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: STOCK MOVEMENT & VELOCITY ANALYTICS                            */}
      {/* ===================================================================== */}
      {activeTab === 'movement' && (
        <div className="space-y-8">
          {/* Movement Summary Cards Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Total Received (Stock In)
                </span>
                <span className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
                  <ArrowDownLeft aria-hidden="true" size={18} />
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-bold tracking-tight text-teal-400">
                +{movementSummary.stockInUnits.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {movementSummary.stockInCount} receipt batches
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Total Dispatched (Stock Out)
                </span>
                <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                  <ArrowUpRight aria-hidden="true" size={18} />
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-bold tracking-tight text-amber-400">
                -{movementSummary.stockOutUnits.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {movementSummary.stockOutCount} outbound dispatches
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Org Net Movement
                </span>
                <span
                  className={`rounded-lg p-2 ${
                    movementSummary.netMovementUnits >= 0
                      ? 'bg-teal-500/10 text-teal-400'
                      : 'bg-danger/10 text-danger'
                  }`}
                >
                  {movementSummary.netMovementUnits >= 0 ? (
                    <TrendingUp aria-hidden="true" size={18} />
                  ) : (
                    <TrendingDown aria-hidden="true" size={18} />
                  )}
                </span>
              </div>
              <p
                className={`mt-4 font-display text-2xl font-bold tracking-tight ${
                  movementSummary.netMovementUnits >= 0
                    ? 'text-teal-400'
                    : 'text-danger'
                }`}
              >
                {movementSummary.netMovementUnits > 0 ? '+' : ''}
                {movementSummary.netMovementUnits.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Net stock delta (Transfers net 0)
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-text-muted">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Inter-Facility Transfers
                </span>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                  <ArrowLeftRight aria-hidden="true" size={18} />
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-bold tracking-tight text-blue-400">
                {movementSummary.transferUnits.toLocaleString('en-IN')} units
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {movementSummary.transferCount} location rebalances
              </p>
            </Card>
          </div>

          {/* Movement Trends Chart */}
          <Card className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-text-primary">
                  Movement Velocity & Daily Volume Trends
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Daily distribution of inbound receipts, outbound dispatches,
                  and inter-warehouse transfers
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-teal-400">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />
                  Inbound
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Outbound
                </span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  Transfers
                </span>
              </div>
            </div>

            {movementTrends.length === 0 ? (
              <div className="py-16">
                <EmptyState
                  description="No transactions found for the selected filter period."
                  title="No movement trends"
                />
              </div>
            ) : (
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart
                    data={movementTrends}
                    margin={{ left: 0, right: 12, top: 12 }}
                  >
                    <defs>
                      <linearGradient
                        id="inboundGrad"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#14b8a6"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#14b8a6"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="outboundGrad"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f59e0b"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                      <linearGradient id="trfGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#2c3734"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="period"
                      tick={{ fill: '#8a9b95', fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{ fill: '#8a9b95', fontSize: 11 }}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#242e2b',
                        border: '1px solid #2c3734',
                        borderRadius: 12,
                        color: '#edf3f0',
                        fontSize: 12,
                      }}
                    />
                    <Area
                      dataKey="inbound"
                      fill="url(#inboundGrad)"
                      name="Inbound (+)"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Area
                      dataKey="outbound"
                      fill="url(#outboundGrad)"
                      name="Outbound (-)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Area
                      dataKey="transfers"
                      fill="url(#trfGrad)"
                      name="Transfers (0)"
                      stroke="#6366f1"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Warehouse Movement Balance & Top Moved Items Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Warehouse Movement Balance */}
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-text-primary">
                Facility Movement Activity
              </h3>
              <p className="mt-0.5 text-xs text-text-muted">
                Receipts, dispatches, and transfers broken down by warehouse
              </p>

              {warehouseMovements.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    description="No warehouse activity recorded in this period."
                    title="No activity"
                  />
                </div>
              ) : (
                <div className="mt-6 divide-y divide-surface-3/50 overflow-hidden rounded-xl border border-surface-3/60">
                  {warehouseMovements.map((wh) => (
                    <div className="p-4" key={wh.warehouseId}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text-primary">
                          {wh.warehouseName}
                        </span>
                        <StatusBadge
                          tone={
                            wh.netUnits > 0
                              ? 'success'
                              : wh.netUnits < 0
                                ? 'warning'
                                : 'neutral'
                          }
                        >
                          Net: {wh.netUnits > 0 ? '+' : ''}
                          {wh.netUnits} units
                        </StatusBadge>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-surface-2 p-2">
                          <span className="block text-[10px] text-text-muted">
                            Inbound
                          </span>
                          <span className="font-mono font-semibold text-teal-400">
                            +{wh.inboundUnits}
                          </span>
                        </div>
                        <div className="rounded-lg bg-surface-2 p-2">
                          <span className="block text-[10px] text-text-muted">
                            Outbound
                          </span>
                          <span className="font-mono font-semibold text-amber-400">
                            -{wh.outboundUnits}
                          </span>
                        </div>
                        <div className="rounded-lg bg-surface-2 p-2">
                          <span className="block text-[10px] text-text-muted">
                            Transfer In
                          </span>
                          <span className="font-mono font-semibold text-blue-400">
                            +{wh.transferInUnits}
                          </span>
                        </div>
                        <div className="rounded-lg bg-surface-2 p-2">
                          <span className="block text-[10px] text-text-muted">
                            Transfer Out
                          </span>
                          <span className="font-mono font-semibold text-purple-400">
                            -{wh.transferOutUnits}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Moved Items */}
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-text-primary">
                High-Velocity Product Lines
              </h3>
              <p className="mt-0.5 text-xs text-text-muted">
                Items with the highest volume of physical warehouse activity
              </p>

              {topMovedProducts.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    description="No product movements recorded in this period."
                    title="No velocity data"
                  />
                </div>
              ) : (
                <div className="mt-6 divide-y divide-surface-3/50 overflow-hidden rounded-xl border border-surface-3/60">
                  {topMovedProducts.map((p, idx) => (
                    <div
                      className="flex items-center justify-between p-3.5 text-xs"
                      key={p.productId}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-3 font-mono text-[10px] font-bold text-text-muted">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-text-primary">
                            {p.productName}
                          </p>
                          <p className="font-mono text-[11px] text-text-muted">
                            {p.sku} • {p.transactionCount} transactions
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="block font-mono font-bold text-text-primary">
                            {p.totalUnitsMoved.toLocaleString('en-IN')} units
                          </span>
                          <span className="text-[10px] text-text-muted">
                            +{p.inboundUnits} in / -{p.outboundUnits} out
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
