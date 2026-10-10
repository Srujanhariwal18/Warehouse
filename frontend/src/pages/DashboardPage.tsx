import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  Package,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  stockHistory7D,
  stockHistory30D,
  stockHistory12M,
  type MovementDataPoint,
} from '@/mocks/inventoryData'
import { formatDate, formatInr } from '@/lib/formatters'
import { useInventoryStore } from '@/lib/inventoryStore'
import { useOrdersStore } from '@/lib/orderStore'
import { useWarehouseStore } from '@/lib/warehouseStore'
import { useTransactionStore } from '@/lib/transactionStore'

type ChartRange = '7D' | '30D' | '12M'

const ranges: { label: string; value: ChartRange }[] = [
  { label: '7 DAYS', value: '7D' },
  { label: '30 DAYS', value: '30D' },
  { label: '12 MONTHS', value: '12M' },
]

const movementDataByRange: Record<ChartRange, MovementDataPoint[]> = {
  '7D': stockHistory7D,
  '30D': stockHistory30D,
  '12M': stockHistory12M,
}

export function DashboardPage() {
  const {
    lowStockProducts,
    products,
    transactions: stockTransactions,
  } = useInventoryStore()
  const { orders } = useOrdersStore()
  const { warehouses } = useWarehouseStore()
  const { transactions } = useTransactionStore()

  const [range, setRange] = useState<ChartRange>('12M')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState(new Date())

  useEffect(() => {
    if (!refreshing) return
    const timer = window.setTimeout(() => {
      setRefreshedAt(new Date())
      setRefreshing(false)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [refreshing])

  // Core metrics derived from stores
  const inventoryValue = useMemo(
    () => products.reduce((total, p) => total + p.stock * p.price, 0),
    [products],
  )
  const totalUnits = useMemo(
    () => products.reduce((total, p) => total + p.stock, 0),
    [products],
  )
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'Pending'),
    [orders],
  )
  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.stock === 0),
    [products],
  )

  const healthyProductsCount = Math.max(
    0,
    products.length - lowStockProducts.length - outOfStockProducts.length,
  )
  const healthRate =
    products.length > 0
      ? ((healthyProductsCount / products.length) * 100).toFixed(1)
      : '100.0'

  const chartData = movementDataByRange[range]
  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  )
  const warehousesById = useMemo(
    () => new Map(warehouses.map((w) => [w.id, w])),
    [warehouses],
  )

  const hasDataError = stockTransactions.some(
    (t) => !productsById.has(t.productId) || !warehousesById.has(t.warehouseId),
  )

  // Facility stock allocation & capacity computation
  const facilityTelemetry = useMemo(() => {
    return warehouses.map((wh) => {
      const assignedProducts = products.filter((p) => p.warehouseId === wh.id)
      const whStock = assignedProducts.reduce((sum, p) => sum + p.stock, 0)
      const whValue = assignedProducts.reduce(
        (sum, p) => sum + p.stock * p.price,
        0,
      )
      const capacitySqFt = wh.capacitySqFt ?? 75000
      // Estimated utilization percentage for mock visualization
      const utilizationPct = Math.min(
        96,
        Math.max(35, Math.round((whStock / (capacitySqFt / 40)) * 100)),
      )
      return {
        ...wh,
        skuCount: assignedProducts.length,
        stockUnits: whStock,
        valuation: whValue,
        capacitySqFt,
        utilizationPct,
      }
    })
  }, [warehouses, products])

  return (
    <div className="space-y-6">
      {/* 1. Header with Operational Context */}
      <PageHeader
        action={
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface/70 px-3 py-1.5 font-mono text-[11px] text-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>LIVE MOCK OS</span>
              <span className="text-surface-border">|</span>
              <span>
                {refreshedAt.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </span>
            <Button
              disabled={refreshing}
              onClick={() => setRefreshing(true)}
              size="md"
              variant="secondary"
            >
              <RefreshCw
                aria-hidden="true"
                className={refreshing ? 'animate-spin text-primary' : ''}
                size={15}
              />
              <span>{refreshing ? 'Refreshing' : 'Refresh Telemetry'}</span>
            </Button>
          </div>
        }
        description="Real-time materials valuation, network velocity, and facility telemetry across active distribution hubs."
        eyebrow="OPERATIONAL COMMAND"
        title="Operations Intelligence"
      />

      {refreshing ? (
        <LoadingState message="RECALIBRATING TELEMETRY NODES..." />
      ) : (
        <>
          {/* 2. Top Signature Operations Zone (Asymmetric 12-col layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Col 1-8: Hero Valuation & Health Matrix */}
            <div className="lg:col-span-8 rounded-xl border border-surface-border bg-gradient-to-br from-[#1c262d] via-[#1a2329] to-[#141b20] p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
              {/* Subtle technical background grid accent */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
              />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border/60 pb-4">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-primary uppercase tracking-widest font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    TOTAL ENTERPRISE VALUATION
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                    <span className="text-emerald-400 font-semibold">
                      {healthRate}%
                    </span>
                    <span>HEALTHY STOCK RATIO</span>
                  </div>
                </div>

                {/* Primary Valuation Display in Sora Typography */}
                <div className="mt-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
                  <div>
                    <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary">
                      {formatInr(inventoryValue)}
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary">
                      Aggregated valuation across {products.length} registered
                      SKUs in {warehouses.length} active distribution hubs
                    </p>
                  </div>
                </div>

                {/* Stock Health Composition Bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                    <span>CATALOGUE HEALTH BREAKDOWN</span>
                    <span>{products.length} TOTAL SKUS</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3 flex">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${(healthyProductsCount / (products.length || 1)) * 100}%`,
                      }}
                      title={`Healthy: ${healthyProductsCount} SKUs`}
                    />
                    <div
                      className="h-full bg-warning transition-all duration-500"
                      style={{
                        width: `${(lowStockProducts.length / (products.length || 1)) * 100}%`,
                      }}
                      title={`Low Stock: ${lowStockProducts.length} SKUs`}
                    />
                    <div
                      className="h-full bg-danger transition-all duration-500"
                      style={{
                        width: `${(outOfStockProducts.length / (products.length || 1)) * 100}%`,
                      }}
                      title={`Out of Stock: ${outOfStockProducts.length} SKUs`}
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-1 font-mono text-[11px]">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {healthyProductsCount} In Stock
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      {lowStockProducts.length} Low Stock
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className="h-2 w-2 rounded-full bg-danger" />
                      {outOfStockProducts.length} Stockout
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Metric Telemetry Strip (Varied emphasis, NOT 4 identical cards) */}
              <div className="mt-8 pt-5 border-t border-surface-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider block">
                    TOTAL UNITS
                  </span>
                  <span className="font-mono text-lg font-bold text-text-primary">
                    {totalUnits.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-text-muted block">
                    Physical items
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider block">
                    ACTIVE HUBS
                  </span>
                  <span className="font-mono text-lg font-bold text-secondary">
                    {warehouses.filter((w) => w.status !== 'Inactive').length} /{' '}
                    {warehouses.length}
                  </span>
                  <span className="text-[11px] text-text-muted block">
                    Online facilities
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider block">
                    DISPATCH QUEUE
                  </span>
                  <span className="font-mono text-lg font-bold text-text-primary">
                    {pendingOrders.length}
                  </span>
                  <span className="text-[11px] text-text-muted block">
                    Pending orders
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider block">
                    TOTAL MOVES
                  </span>
                  <span className="font-mono text-lg font-bold text-primary">
                    {transactions.length}
                  </span>
                  <span className="text-[11px] text-text-muted block">
                    Ledger records
                  </span>
                </div>
              </div>
            </div>

            {/* Col 9-12: Logistics Facility Network Schematics */}
            <div className="lg:col-span-4 rounded-xl border border-surface-border bg-surface p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-secondary" />
                    <span className="font-display text-sm font-semibold text-text-primary">
                      Facility Network
                    </span>
                  </div>
                  <Link
                    to="/app/warehouses"
                    className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>EXPLORE</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="mt-4 space-y-3.5">
                  {facilityTelemetry.map((wh) => (
                    <div
                      key={wh.id}
                      className="rounded-lg border border-surface-border bg-surface-2/60 p-3 hover:border-surface-3 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-text-primary">
                            {wh.name}
                          </p>
                          <p className="font-mono text-[10px] text-text-muted">
                            {wh.city} // {wh.id}
                          </p>
                        </div>
                        <StatusBadge
                          size="sm"
                          tone={wh.status === 'Active' ? 'success' : 'neutral'}
                        >
                          {wh.utilizationPct}% CAP
                        </StatusBadge>
                      </div>

                      <div className="mt-2.5 space-y-1">
                        <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                            style={{ width: `${wh.utilizationPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between font-mono text-[10px] text-text-muted pt-0.5">
                          <span>
                            {wh.stockUnits.toLocaleString('en-IN')} units stored
                          </span>
                          <span>{wh.skuCount} SKUs</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs text-text-secondary">
                <span className="font-mono text-[11px] text-text-muted">
                  Total Network Footprint
                </span>
                <span className="font-mono font-medium text-text-primary">
                  {facilityTelemetry
                    .reduce((sum, w) => sum + w.capacitySqFt, 0)
                    .toLocaleString('en-IN')}{' '}
                  sq ft
                </span>
              </div>
            </div>
          </div>

          {/* 3. Middle Operations Flow Zone (12-column grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Col 1-8: Telemetry Stock Movement Velocity */}
            <div className="lg:col-span-8 rounded-xl border border-surface-border bg-surface p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border/60 pb-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-text-primary flex items-center gap-2">
                    <span>Stock Movement Velocity</span>
                    <span className="font-mono text-[10px] font-normal uppercase text-primary border border-primary/20 px-1.5 py-0.5 rounded bg-primary/10">
                      TELEMETRY
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-text-secondary">
                    Comparative inbound replenishment vs outbound fulfillment
                    unit velocity
                  </p>
                </div>

                {/* Time Range Selector */}
                <div
                  aria-label="Stock movement range"
                  className="flex rounded-lg border border-surface-border bg-[#141b20] p-1 self-start sm:self-auto"
                  role="group"
                >
                  {ranges.map(({ label, value }) => (
                    <button
                      aria-pressed={range === value}
                      className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-all ${
                        range === value
                          ? 'bg-surface-2 text-primary border border-primary/30 shadow-xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                      key={value}
                      onClick={() => setRange(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#22d3c5"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22d3c5"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#55b9f3"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#55b9f3"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#26333d"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="period"
                      tick={{
                        fill: '#758792',
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{
                        fill: '#758792',
                        fontSize: 11,
                        fontFamily: 'monospace',
                      }}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null
                        const inUnits = Number(
                          payload.find((p) => p.dataKey === 'inbound')?.value ||
                            0,
                        )
                        const outUnits = Number(
                          payload.find((p) => p.dataKey === 'outbound')
                            ?.value || 0,
                        )
                        const net = inUnits - outUnits
                        return (
                          <div className="rounded-xl border border-surface-border bg-surface-2 p-3 shadow-xl text-xs font-mono">
                            <p className="font-semibold text-text-primary border-b border-surface-border pb-1.5 mb-1.5">
                              {label}
                            </p>
                            <div className="space-y-1">
                              <p className="flex justify-between gap-4 text-primary">
                                <span>INBOUND:</span>
                                <span className="font-bold">
                                  +{inUnits.toLocaleString('en-IN')}
                                </span>
                              </p>
                              <p className="flex justify-between gap-4 text-secondary">
                                <span>OUTBOUND:</span>
                                <span className="font-bold">
                                  -{outUnits.toLocaleString('en-IN')}
                                </span>
                              </p>
                              <p
                                className={`flex justify-between gap-4 pt-1 border-t border-surface-border font-semibold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                              >
                                <span>NET FLOW:</span>
                                <span>{net >= 0 ? `+${net}` : net}</span>
                              </p>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Area
                      dataKey="inbound"
                      fill="url(#tealGrad)"
                      fillOpacity={1}
                      name="Inbound"
                      stroke="#22d3c5"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Area
                      dataKey="outbound"
                      fill="url(#blueGrad)"
                      fillOpacity={1}
                      name="Outbound"
                      stroke="#55b9f3"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="mt-4 pt-3 border-t border-surface-border/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>Inbound (+Flow)</span>
                  </span>
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-secondary" />
                    <span>Outbound (-Flow)</span>
                  </span>
                </div>
                <span className="text-text-muted text-[11px]">
                  Sampled velocity points for{' '}
                  {range === '7D'
                    ? '7 days'
                    : range === '30D'
                      ? '30 days'
                      : '12 months'}
                </span>
              </div>
            </div>

            {/* Col 9-12: Critical Exception Watchlist */}
            <div className="lg:col-span-4 rounded-xl border border-surface-border bg-surface p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-warning" />
                    <span className="font-display text-sm font-semibold text-text-primary">
                      Exception Watchlist
                    </span>
                  </div>
                  <Link
                    to="/app/alerts"
                    className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>FEED</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {outOfStockProducts.length === 0 &&
                  lowStockProducts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-text-muted">
                      <CheckCircle2
                        size={24}
                        className="mx-auto text-success mb-2"
                      />
                      All SKUs above reorder thresholds.
                    </div>
                  ) : (
                    <>
                      {/* Critical Stockouts */}
                      {outOfStockProducts.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase font-bold text-danger tracking-wider">
                              CRITICAL STOCKOUT
                            </span>
                            <span className="font-mono font-bold text-danger">
                              0 UNITS
                            </span>
                          </div>
                          <p className="mt-1 font-semibold text-text-primary truncate">
                            {item.name}
                          </p>
                          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-text-muted">
                            <span>{item.sku}</span>
                            <Link
                              to="/app/transactions"
                              className="text-primary hover:underline font-semibold"
                            >
                              Restock →
                            </Link>
                          </div>
                        </div>
                      ))}

                      {/* Low Stock Warnings */}
                      {lowStockProducts.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase font-semibold text-warning tracking-wider">
                              LOW BUFFER CEILING
                            </span>
                            <span className="font-mono font-semibold text-amber-400">
                              {item.stock} / {item.reorderThreshold}
                            </span>
                          </div>
                          <p className="mt-1 font-medium text-text-primary truncate">
                            {item.name}
                          </p>
                          <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-text-muted">
                            <span>{item.sku}</span>
                            <Link
                              to="/app/inventory"
                              className="text-primary hover:underline"
                            >
                              Inspect →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-border/60">
                <Link
                  to="/app/alerts"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-surface-border bg-surface-2 hover:bg-surface-3 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span>
                    Open Full Incident Watchlist (
                    {outOfStockProducts.length + lowStockProducts.length})
                  </span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* 4. Bottom Operational Execution Zone (12-column grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Col 1-7: Recent Movement Terminal Feed */}
            <div className="lg:col-span-7 rounded-xl border border-surface-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-surface-border/60 px-5 py-4">
                <div>
                  <h3 className="font-display text-sm font-semibold text-text-primary flex items-center gap-2">
                    <TrendingUp size={15} className="text-primary" />
                    <span>Recent Movement Ledger</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Latest verified transactions across storage hubs
                  </p>
                </div>
                <Link
                  to="/app/transactions"
                  className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <span>ALL TXNS</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {hasDataError ? (
                <div className="p-5">
                  <ErrorState
                    description="Some preview records refer to missing products or warehouses."
                    title="Stock activity is unavailable"
                  />
                </div>
              ) : stockTransactions.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    description="There are no stock movements recorded in the current session."
                    title="No movements recorded"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-surface-border/60 bg-[#141b20] font-mono text-[10px] uppercase text-text-muted">
                      <tr>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Product / SKU</th>
                        <th className="px-4 py-2.5 text-right">Delta</th>
                        <th className="px-4 py-2.5">Hub</th>
                        <th className="px-4 py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/40 font-mono">
                      {stockTransactions.slice(0, 6).map((tx) => {
                        const product = productsById.get(tx.productId)
                        const warehouse = warehousesById.get(tx.warehouseId)
                        const isPositive = tx.quantity > 0
                        return (
                          <tr
                            key={tx.id}
                            className="text-text-secondary hover:bg-surface-2/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <StatusBadge
                                size="sm"
                                showPip={false}
                                tone={
                                  tx.type === 'Inbound'
                                    ? 'primary'
                                    : tx.type === 'Outbound'
                                      ? 'info'
                                      : 'neutral'
                                }
                              >
                                {tx.type}
                              </StatusBadge>
                            </td>
                            <td className="px-4 py-3 font-sans">
                              <p className="font-semibold text-text-primary truncate max-w-[180px]">
                                {product?.name ?? tx.productId}
                              </p>
                              <p className="font-mono text-[10px] text-text-muted">
                                {product?.sku}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right font-bold">
                              <span
                                className={
                                  isPositive ? 'text-primary' : 'text-secondary'
                                }
                              >
                                {isPositive ? `+${tx.quantity}` : tx.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-text-muted">
                              {warehouse?.city ?? tx.warehouseId}
                            </td>
                            <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                              {formatDate(tx.date)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Col 8-12: Pending Orders Dispatch Queue */}
            <div className="lg:col-span-5 rounded-xl border border-surface-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-surface-border/60 px-5 py-4">
                <div>
                  <h3 className="font-display text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Package size={15} className="text-secondary" />
                    <span>Fulfillment Queue</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Orders currently awaiting operational fulfillment
                  </p>
                </div>
                <Link
                  to="/app/orders"
                  className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <span>ALL ORDERS</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="p-4 space-y-2.5">
                {pendingOrders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">
                    <CheckCircle2
                      size={24}
                      className="mx-auto text-success mb-2"
                    />
                    Dispatch queue is completely clear.
                  </div>
                ) : (
                  pendingOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-surface-border bg-surface-2/40 hover:border-surface-3 transition-colors text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-secondary">
                            {order.id}
                          </span>
                          <span className="text-text-primary font-medium truncate max-w-[130px]">
                            {order.customerName}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-text-muted">
                          {order.items.length} item
                          {order.items.length > 1 ? 's' : ''} //{' '}
                          {order.createdAt}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-text-primary block">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </span>
                        <StatusBadge size="sm" tone="warning">
                          Pending
                        </StatusBadge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 pb-4">
                <Link
                  to="/app/orders"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-surface-border bg-surface-2 hover:bg-surface-3 text-xs text-text-secondary hover:text-text-primary transition-colors font-medium"
                >
                  <span>
                    Review {pendingOrders.length} Pending Orders in Queue
                  </span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
