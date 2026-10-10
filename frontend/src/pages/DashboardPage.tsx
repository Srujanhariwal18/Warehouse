import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Clock3,
  IndianRupee,
  Package,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  lowStockProducts,
  orders,
  products,
  stockHistory,
  stockTransactions,
  warehouses,
} from '@/mocks/inventoryData'
import { formatDate, formatInr } from '@/lib/formatters'

type ChartRange = '7D' | '30D' | '12M'

const ranges: { label: string; value: ChartRange }[] = [
  { label: '7 days', value: '7D' },
  { label: '30 days', value: '30D' },
  { label: '12 months', value: '12M' },
]

const rangeMultipliers: Record<ChartRange, number> = {
  '7D': 0.16,
  '30D': 0.48,
  '12M': 1,
}

export function DashboardPage() {
  const [range, setRange] = useState<ChartRange>('12M')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState(new Date())

  useEffect(() => {
    if (!refreshing) return
    const timer = window.setTimeout(() => {
      setRefreshedAt(new Date())
      setRefreshing(false)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [refreshing])

  const inventoryValue = products.reduce(
    (total, product) => total + product.stock * product.price,
    0,
  )
  const pendingOrders = orders.filter(
    (order) => order.status === 'Pending',
  ).length
  const chartData = stockHistory.map((point) => ({
    ...point,
    inbound: Math.round(point.inbound * rangeMultipliers[range]),
    outbound: Math.round(point.outbound * rangeMultipliers[range]),
  }))
  const productsById = new Map(products.map((product) => [product.id, product]))
  const warehousesById = new Map(
    warehouses.map((warehouse) => [warehouse.id, warehouse]),
  )
  const hasDataError = stockTransactions.some(
    (transaction) =>
      !productsById.has(transaction.productId) ||
      !warehousesById.has(transaction.warehouseId),
  )
  const cards = [
    {
      label: 'Total products',
      value: products.length.toLocaleString('en-IN'),
      detail: 'Across 3 warehouse locations',
      icon: Boxes,
    },
    {
      label: 'Total inventory value',
      value: formatInr(inventoryValue),
      detail: 'Based on current unit prices',
      icon: IndianRupee,
    },
    {
      label: 'Low-stock products',
      value: lowStockProducts.length.toLocaleString('en-IN'),
      detail: 'At or below reorder threshold',
      icon: AlertTriangle,
    },
    {
      label: 'Pending orders',
      value: pendingOrders.toLocaleString('en-IN'),
      detail: 'Awaiting fulfillment action',
      icon: Clock3,
    },
  ]

  return (
    <div className="grid gap-8">
      <PageHeader
        action={
          <Button
            disabled={refreshing}
            onClick={() => setRefreshing(true)}
            variant="secondary"
          >
            <RefreshCw
              aria-hidden="true"
              className={refreshing ? 'animate-spin' : ''}
              size={16}
            />
            {refreshing ? 'Refreshing' : 'Refresh data'}
          </Button>
        }
        description="A clear view of inventory health and warehouse movement, powered by a stable local preview dataset."
        eyebrow="Operations overview"
        title="Dashboard"
      />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-xs text-text-secondary">
        <span className="h-2 w-2 rounded-full bg-secondary" />
        Mock data preview — figures are illustrative and not connected to live
        warehouse systems.
        <span className="ml-auto text-text-muted">
          Updated{' '}
          {refreshedAt.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      {refreshing ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ detail, icon: Icon, label, value }) => (
              <Card className="p-5" key={label}>
                <div className="flex items-center justify-between text-text-muted">
                  <span className="text-sm">{label}</span>
                  <span className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon aria-hidden="true" size={17} />
                  </span>
                </div>
                <p className="mt-6 font-display text-2xl font-semibold tracking-tight text-text-primary">
                  {value}
                </p>
                <p className="mt-2 text-xs text-text-muted">{detail}</p>
              </Card>
            ))}
          </div>
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  Stock movement
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Inbound and outbound units across the preview period.
                </p>
              </div>
              <div
                aria-label="Stock movement range"
                className="flex rounded-xl border border-surface-3 bg-sidebar p-1"
                role="group"
              >
                {ranges.map(({ label, value }) => (
                  <button
                    aria-pressed={range === value}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${range === value ? 'bg-surface-3 text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                    key={value}
                    onClick={() => setRange(value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart
                  data={chartData}
                  margin={{ left: 0, right: 8, top: 8 }}
                >
                  <CartesianGrid
                    stroke="#2c3734"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    tick={{ fill: '#8a9b95', fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fill: '#8a9b95', fontSize: 11 }}
                    tickLine={false}
                    width={36}
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
                  <Line
                    dataKey="inbound"
                    dot={false}
                    name="Inbound"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                  />
                  <Line
                    dataKey="outbound"
                    dot={false}
                    name="Outbound"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-5 text-xs text-text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Inbound
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                Outbound
              </span>
            </div>
          </Card>
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-surface-3/70 px-5 py-5">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">
                    Recent stock activity
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Latest movements across warehouses.
                  </p>
                </div>
                <TrendingUp
                  aria-hidden="true"
                  className="text-primary"
                  size={18}
                />
              </div>
              {hasDataError ? (
                <div className="p-5">
                  <ErrorState
                    action={
                      <Button
                        onClick={() => setRefreshing(true)}
                        variant="secondary"
                      >
                        <RefreshCw aria-hidden="true" size={16} />
                        Retry preview
                      </Button>
                    }
                    description="Some preview records refer to missing products or warehouses."
                    title="Stock activity is unavailable"
                  />
                </div>
              ) : stockTransactions.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    description="There are no stock movements in the current preview period."
                    title="No stock activity"
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-sidebar/60 text-xs uppercase tracking-wide text-text-muted">
                      <tr>
                        {[
                          'Product',
                          'Movement',
                          'Qty',
                          'Warehouse',
                          'Date',
                        ].map((heading) => (
                          <th
                            className="px-4 py-3 font-medium first:pl-5 last:pr-5"
                            key={heading}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-3/60">
                      {stockTransactions.map((transaction) => {
                        const product = productsById.get(transaction.productId)
                        const warehouse = warehousesById.get(
                          transaction.warehouseId,
                        )
                        return (
                          <tr
                            className="text-text-secondary"
                            key={transaction.id}
                          >
                            <td className="px-5 py-4">
                              <p className="font-medium text-text-primary">
                                {product?.name}
                              </p>
                              <p className="mt-1 font-mono text-[11px] text-text-muted">
                                {product?.sku}
                              </p>
                            </td>
                            <td className="px-4 py-4">{transaction.type}</td>
                            <td className="px-4 py-4 font-medium text-text-primary">
                              {transaction.quantity > 0 ? '+' : ''}
                              {transaction.quantity}
                            </td>
                            <td className="px-4 py-4">{warehouse?.name}</td>
                            <td className="whitespace-nowrap px-5 py-4">
                              {formatDate(transaction.date)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-primary">
                    Low-stock alerts
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Items needing a closer look.
                  </p>
                </div>
                <TrendingDown
                  aria-hidden="true"
                  className="text-warning"
                  size={18}
                />
              </div>
              {lowStockProducts.length === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    description="Every product is currently above its reorder threshold."
                    title="No low-stock alerts"
                  />
                </div>
              ) : (
                <div className="mt-5 grid gap-3">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div
                      className="rounded-xl border border-surface-3/70 bg-sidebar/50 p-3"
                      key={product.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {product.name}
                        </p>
                        <span className="whitespace-nowrap text-sm font-semibold text-warning">
                          {product.stock} left
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-text-muted">
                        Reorder at {product.reorderThreshold} units
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                to="/app/inventory"
              >
                View inventory <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </Card>
          </div>
          <Card className="flex flex-col gap-3 border-secondary/20 bg-secondary/5 p-4 text-sm text-text-secondary sm:flex-row sm:items-center">
            <Package aria-hidden="true" className="text-secondary" size={18} />
            <span>
              {pendingOrders} pending orders in the preview dataset. Order
              workflows are intentionally not implemented yet.
            </span>
          </Card>
        </>
      )}
    </div>
  )
}
