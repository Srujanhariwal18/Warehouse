import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
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
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  stockHistory7D,
  stockHistory30D,
  stockHistory12M,
  type MovementDataPoint,
} from '@/mocks/inventoryData'
import { WarehouseIsometricVisualizer } from '@/components/warehouse/WarehouseIsometricVisualizer'
import { formatDate, formatInr } from '@/lib/formatters'
import { useInventoryStore } from '@/lib/inventoryStore'
import { useOrdersStore } from '@/lib/orderStore'
import { useWarehouseStore } from '@/lib/warehouseStore'
import { useTransactionStore } from '@/lib/transactionStore'

type ChartRange = '7D' | '30D' | '12M'

const ranges: { label: string; value: ChartRange }[] = [
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '12M', value: '12M' },
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
  const { warehouses, zones, racks } = useWarehouseStore()
  const { transactions } = useTransactionStore()

  const [range, setRange] = useState<ChartRange>('12M')
  const [selectedWarehouseId, setSelectedWarehouseId] =
    useState<string>('wh-mum')
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
      const utilizationPct = Math.min(
        96,
        Math.max(35, Math.round((whStock / (capacitySqFt / 40)) * 100)),
      )
      const whZones = zones.filter((z) => z.warehouseId === wh.id)
      return {
        ...wh,
        skuCount: assignedProducts.length,
        stockUnits: whStock,
        valuation: whValue,
        capacitySqFt,
        utilizationPct,
        zones: whZones,
      }
    })
  }, [warehouses, products, zones])

  const activeFacility = useMemo(() => {
    return (
      facilityTelemetry.find((f) => f.id === selectedWarehouseId) ||
      facilityTelemetry[0] ||
      null
    )
  }, [facilityTelemetry, selectedWarehouseId])

  return (
    <div className="space-y-4">
      {/* 1. Header with Operational Context (Compact, No Wasted Space) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-surface-border pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary">
              Operational Command
            </span>
            <span className="text-surface-border text-xs">•</span>
            <span className="text-xs text-text-muted">
              Live Mock OS{' '}
              {refreshedAt.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary mt-0.5">
            Operations Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            disabled={refreshing}
            onClick={() => setRefreshing(true)}
            size="sm"
            variant="secondary"
          >
            <RefreshCw
              aria-hidden="true"
              className={refreshing ? 'animate-spin text-primary' : ''}
              size={14}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </Button>
          <Link to="/app/orders">
            <Button size="sm" variant="primary">
              <Package size={14} />
              <span>Orders ({pendingOrders.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {refreshing ? (
        <LoadingState message="Recalibrating facility telemetry nodes..." />
      ) : (
        <>
          {/* 2. Unified High-Density Operations Telemetry Strip (Balanced, Dense, No Bloat) */}
          <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-1 shadow-xs">
            <div className="grid grid-cols-2 divide-y divide-surface-border sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
              {/* Metric 1: Enterprise Valuation */}
              <div className="p-3.5 sm:p-4">
                <span className="text-[11px] font-medium text-text-muted">
                  Enterprise Valuation
                </span>
                <div className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                  {formatInr(inventoryValue)}
                </div>
                <div className="mt-0.5 text-[11px] text-text-muted">
                  {products.length} SKUs in {warehouses.length} active hubs
                </div>
              </div>

              {/* Metric 2: Stock Health Ratio */}
              <div className="p-3.5 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-text-muted">
                    Catalog Stock Health
                  </span>
                  <span className="font-mono text-xs font-semibold text-emerald-400">
                    {healthRate}%
                  </span>
                </div>
                {/* 3-segment health bar */}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3 flex">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(healthyProductsCount / (products.length || 1)) * 100}%`,
                    }}
                    title={`Healthy: ${healthyProductsCount}`}
                  />
                  <div
                    className="h-full bg-warning"
                    style={{
                      width: `${(lowStockProducts.length / (products.length || 1)) * 100}%`,
                    }}
                    title={`Low Stock: ${lowStockProducts.length}`}
                  />
                  <div
                    className="h-full bg-danger"
                    style={{
                      width: `${(outOfStockProducts.length / (products.length || 1)) * 100}%`,
                    }}
                    title={`Out of Stock: ${outOfStockProducts.length}`}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-primary">
                    {healthyProductsCount} In Stock
                  </span>
                  <span className="text-warning">
                    {lowStockProducts.length} Low
                  </span>
                  <span className="text-danger">
                    {outOfStockProducts.length} Out
                  </span>
                </div>
              </div>

              {/* Metric 3: Total Physical Units */}
              <div className="p-3.5 sm:p-4">
                <span className="text-[11px] font-medium text-text-muted">
                  Total Physical Stock
                </span>
                <div className="mt-1 font-mono text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                  {totalUnits.toLocaleString('en-IN')}
                </div>
                <div className="mt-0.5 text-[11px] text-text-muted">
                  Units in circulation
                </div>
              </div>

              {/* Metric 4: Logistics Hub Footprint */}
              <div className="p-3.5 sm:p-4">
                <span className="text-[11px] font-medium text-text-muted">
                  Logistics Network
                </span>
                <div className="mt-1 font-mono text-xl sm:text-2xl font-bold tracking-tight text-secondary">
                  {warehouses.filter((w) => w.status !== 'Inactive').length} /{' '}
                  {warehouses.length} Active
                </div>
                <div className="mt-0.5 text-[11px] text-text-muted">
                  {facilityTelemetry
                    .reduce((sum, w) => sum + w.capacitySqFt, 0)
                    .toLocaleString('en-IN')}{' '}
                  sq ft floor
                </div>
              </div>

              {/* Metric 5: Dispatch Queue & Movement Velocity */}
              <div className="col-span-2 p-3.5 sm:col-span-1 sm:p-4">
                <span className="text-[11px] font-medium text-text-muted">
                  Fulfillment Queue
                </span>
                <div className="mt-1 font-mono text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                  {pendingOrders.length} Orders
                </div>
                <div className="mt-0.5 text-[11px] text-text-muted">
                  {transactions.length} ledger movements recorded
                </div>
              </div>
            </div>
          </div>

          {/* 3. Main Stage: Asymmetric 2-Column Split (Schematic + Velocity/Exceptions) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Col 1-7: Signature 3D Warehouse Visualization */}
            <div className="lg:col-span-7 flex flex-col gap-2.5">
              {/* Hub switcher bar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Building2 size={15} className="text-primary shrink-0" />
                  <span className="text-xs font-semibold text-text-primary">
                    Facility Node: {activeFacility?.name}
                  </span>
                </div>
                <div className="flex rounded-lg border border-surface-border bg-graphite p-0.5">
                  {facilityTelemetry.map((wh) => (
                    <button
                      key={wh.id}
                      className={`rounded px-2.5 py-0.5 text-xs font-mono font-medium transition-all ${
                        selectedWarehouseId === wh.id
                          ? 'bg-surface text-primary border border-primary/30 shadow-xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                      onClick={() => setSelectedWarehouseId(wh.id)}
                      type="button"
                    >
                      {wh.city}
                    </button>
                  ))}
                </div>
              </div>

              {activeFacility && (
                <WarehouseIsometricVisualizer
                  activeWarehouse={activeFacility}
                  products={products}
                  racks={racks}
                  zones={zones}
                />
              )}
            </div>




            {/* Col 8-12: Movement Velocity & Critical Stockout Exceptions */}
            <div className="lg:col-span-5 space-y-4">
              {/* Top: Stock Movement Velocity AreaChart */}
              <div className="rounded-xl border border-surface-border bg-surface p-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">
                      Movement Velocity
                    </h2>
                    <p className="text-[11px] text-text-muted">
                      Inbound replenishment vs outbound fulfillment
                    </p>
                  </div>

                  {/* Time Range Selector */}
                  <div
                    aria-label="Stock movement range"
                    className="flex rounded-md border border-surface-border bg-surface-2 p-0.5"
                    role="group"
                  >
                    {ranges.map(({ label, value }) => (
                      <button
                        aria-pressed={range === value}
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium transition-all ${
                          range === value
                            ? 'bg-surface text-primary border border-primary/20 shadow-xs'
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

                {/* Velocity Chart */}
                <div className="mt-3 h-36 w-full">
                  <ResponsiveContainer height="100%" width="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ left: -25, right: 5, top: 5, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="tealGradV2"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#43D9E8"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#43D9E8"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="blueGradV2"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#5AA9FF"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#5AA9FF"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#223140"
                        strokeDasharray="2 2"
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="period"
                        tick={{
                          fill: '#8EA0B2',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                        tickLine={false}
                      />
                      <YAxis
                        axisLine={false}
                        tick={{
                          fill: '#8EA0B2',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                        tickLine={false}
                        width={35}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length)
                            return null
                          const inUnits = Number(
                            payload.find((p) => p.dataKey === 'inbound')
                              ?.value || 0,
                          )
                          const outUnits = Number(
                            payload.find((p) => p.dataKey === 'outbound')
                              ?.value || 0,
                          )
                          return (
                            <div className="rounded-lg border border-surface-border bg-graphite p-2.5 shadow-2xl text-[11px] font-mono">
                              <p className="font-semibold text-text-primary pb-1 mb-1 border-b border-surface-border">
                                {label}
                              </p>
                              <p className="text-primary flex justify-between gap-3">
                                <span>Inbound Flow:</span>
                                <span>+{inUnits}</span>
                              </p>
                              <p className="text-secondary flex justify-between gap-3">
                                <span>Outbound Flow:</span>
                                <span>-{outUnits}</span>
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Area
                        dataKey="inbound"
                        fill="url(#tealGradV2)"
                        name="Inbound"
                        stroke="#43D9E8"
                        strokeWidth={2}
                        type="monotone"
                      />
                      <Area
                        dataKey="outbound"
                        fill="url(#blueGradV2)"
                        name="Outbound"
                        stroke="#5AA9FF"
                        strokeWidth={2}
                        type="monotone"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-text-muted">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Inbound Flow
                  </span>
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    Outbound Flow
                  </span>
                </div>
              </div>

              {/* Bottom: Critical Stockout Watchlist (Actionable!) */}
              <div className="rounded-xl border border-surface-border bg-surface p-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-danger" />
                    <h2 className="text-sm font-semibold text-text-primary">
                      Critical Stockouts & Exceptions
                    </h2>
                  </div>
                  <Link
                    to="/app/alerts"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>
                      View All (
                      {outOfStockProducts.length + lowStockProducts.length})
                    </span>
                    <ArrowRight size={11} />
                  </Link>
                </div>

                <div className="mt-2.5 space-y-2">
                  {outOfStockProducts.length === 0 &&
                  lowStockProducts.length === 0 ? (
                    <div className="py-4 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <span>
                        All inventory SKUs currently above safety thresholds.
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Out of stock items */}
                      {outOfStockProducts.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/5 p-2.5 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-danger/20 px-1 py-0.2 font-mono text-[9px] font-bold text-danger">
                                ZERO STOCK
                              </span>
                              <span className="font-mono text-[10px] text-text-muted">
                                {item.sku}
                              </span>
                            </div>
                            <p className="font-medium text-text-primary truncate mt-0.5">
                              {item.name}
                            </p>
                          </div>
                          <Link
                            to="/app/transactions"
                            className="shrink-0 rounded-md bg-surface-2 border border-surface-border hover:border-primary/50 px-2 py-1 font-mono text-[10px] text-primary hover:bg-surface-3 transition-colors"
                          >
                            Restock →
                          </Link>
                        </div>
                      ))}

                      {/* Top Low stock item */}
                      {lowStockProducts.slice(0, 1).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-warning/20 px-1 py-0.2 font-mono text-[9px] font-bold text-warning">
                                LOW BUFFER
                              </span>
                              <span className="font-mono text-[10px] text-text-muted">
                                {item.sku}
                              </span>
                            </div>
                            <p className="font-medium text-text-primary truncate mt-0.5">
                              {item.name}
                            </p>
                          </div>
                          <div className="shrink-0 text-right font-mono text-[11px] text-warning">
                            {item.stock} / {item.reorderThreshold}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Bottom Operational Execution Zone (Ledger & Orders Queue) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Col 1-7: Recent Movement Ledger (Compact Table) */}
            <div className="lg:col-span-7 rounded-xl border border-surface-border bg-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-primary" />
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">
                      Recent Movement Ledger
                    </h2>
                    <p className="text-[11px] text-text-muted">
                      Latest verified transactions across facilities
                    </p>
                  </div>
                </div>
                <Link
                  to="/app/transactions"
                  className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <span>All ({transactions.length})</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

              {hasDataError ? (
                <div className="p-4">
                  <ErrorState
                    description="Preview records refer to missing product or facility IDs."
                    title="Ledger data error"
                  />
                </div>
              ) : stockTransactions.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    description="No stock movements recorded in this session."
                    title="No records"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-surface-border bg-surface-2 font-mono text-[10px] uppercase text-text-muted">
                      <tr>
                        <th className="px-3.5 py-2">Type</th>
                        <th className="px-3.5 py-2">SKU</th>
                        <th className="px-3.5 py-2">Product</th>
                        <th className="px-3.5 py-2 text-right">Units</th>
                        <th className="px-3.5 py-2">Hub</th>
                        <th className="px-3.5 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/50 font-mono">
                      {stockTransactions.slice(0, 5).map((tx) => {
                        const product = productsById.get(tx.productId)
                        const warehouse = warehousesById.get(tx.warehouseId)
                        const isPositive = tx.quantity > 0
                        return (
                          <tr
                            key={tx.id}
                            className="text-text-secondary hover:bg-surface-2/40 transition-colors"
                          >
                            <td className="px-3.5 py-2.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  tx.type === 'Inbound'
                                    ? 'bg-primary/10 text-primary'
                                    : tx.type === 'Outbound'
                                      ? 'bg-rose-500/10 text-rose-400'
                                      : 'bg-secondary/10 text-secondary'
                                }`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-text-primary">
                              {product?.sku ?? tx.productId}
                            </td>
                            <td className="px-3.5 py-2.5 font-sans truncate max-w-[150px] text-text-primary">
                              {product?.name ?? '—'}
                            </td>
                            <td
                              className={`px-3.5 py-2.5 text-right font-bold ${
                                isPositive ? 'text-primary' : 'text-rose-400'
                              }`}
                            >
                              {isPositive ? `+${tx.quantity}` : tx.quantity}
                            </td>
                            <td className="px-3.5 py-2.5 text-text-muted">
                              {warehouse?.city ?? 'Hub'}
                            </td>
                            <td className="px-3.5 py-2.5 text-text-muted">
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

            {/* Col 8-12: High-Priority Dispatch Queue */}
            <div className="lg:col-span-5 rounded-xl border border-surface-border bg-surface overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-secondary" />
                    <div>
                      <h2 className="text-sm font-semibold text-text-primary">
                        Fulfillment Dispatch Queue
                      </h2>
                      <p className="text-[11px] text-text-muted">
                        Pending orders awaiting shipment
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/app/orders"
                    className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Orders ({orders.length})</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>

                <div className="divide-y divide-surface-border/50">
                  {pendingOrders.slice(0, 4).map((order) => {
                    const warehouse = warehousesById.get(order.warehouseId)
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 hover:bg-surface-2/40 transition-colors text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-secondary">
                              {order.id}
                            </span>
                            <span className="text-text-muted font-mono text-[10px]">
                              {warehouse?.city ?? 'Unassigned'}
                            </span>
                          </div>
                          <p className="font-medium text-text-primary mt-0.5 truncate max-w-[200px]">
                            {order.customerName}
                          </p>
                          <span className="text-[10px] text-text-muted">
                            {order.items.length} line item
                            {order.items.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-text-primary block">
                            {formatInr(order.totalAmount)}
                          </span>
                          <StatusBadge size="sm" tone="warning">
                            Pending
                          </StatusBadge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-3 border-t border-surface-border/60 bg-surface-2/30">
                <Link
                  to="/app/orders"
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg border border-surface-border bg-surface text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span>Open Full Order Management Workspace</span>
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
