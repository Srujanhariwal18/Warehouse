import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Download,
  Info,
  RotateCcw,
  Search,
  Warehouse,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/formatters'
import { useInventoryStore } from '@/lib/inventoryStore'
import {
  deriveInventoryAlerts,
  downloadCsvFile,
  generateAlertsReportCsv,
} from '@/lib/reportUtils'
import { useTransactionStore } from '@/lib/transactionStore'
import { useWarehouseStore } from '@/lib/warehouseStore'

export function AlertsPage() {
  const { products } = useInventoryStore()
  const { transactions } = useTransactionStore()
  const { warehouses } = useWarehouseStore()

  // Filters State
  const [search, setSearch] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('All')

  // Derive all active alerts dynamically from existing stores (no duplicate state)
  const allAlerts = useMemo(() => {
    return deriveInventoryAlerts(products, transactions, warehouses)
  }, [products, transactions, warehouses])

  // Count summaries
  const alertCounts = useMemo(() => {
    let criticalCount = 0
    let warningCount = 0
    let infoCount = 0
    let oosCount = 0
    let lowStockCount = 0
    let unusualCount = 0
    let adjustmentCount = 0

    for (const a of allAlerts) {
      if (a.severity === 'critical') criticalCount += 1
      if (a.severity === 'warning') warningCount += 1
      if (a.severity === 'info') infoCount += 1

      if (a.type === 'out_of_stock') oosCount += 1
      if (a.type === 'low_stock') lowStockCount += 1
      if (a.type === 'unusual_movement') unusualCount += 1
      if (a.type === 'recent_adjustment') adjustmentCount += 1
    }

    return {
      total: allAlerts.length,
      criticalCount,
      warningCount,
      infoCount,
      oosCount,
      lowStockCount,
      unusualCount,
      adjustmentCount,
    }
  }, [allAlerts])

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return allAlerts.filter((alert) => {
      // 1. Search Query
      if (query) {
        const matchesName = alert.productName.toLowerCase().includes(query)
        const matchesSku = alert.sku.toLowerCase().includes(query)
        const matchesTitle = alert.title.toLowerCase().includes(query)
        const matchesDesc = alert.description.toLowerCase().includes(query)
        if (!matchesName && !matchesSku && !matchesTitle && !matchesDesc) {
          return false
        }
      }

      // 2. Severity Filter
      if (selectedSeverity !== 'All' && alert.severity !== selectedSeverity) {
        return false
      }

      // 3. Alert Type Filter
      if (selectedType !== 'All' && alert.type !== selectedType) {
        return false
      }

      // 4. Warehouse Filter
      if (
        selectedWarehouse !== 'All' &&
        alert.warehouseId !== selectedWarehouse
      ) {
        return false
      }

      return true
    })
  }, [allAlerts, search, selectedSeverity, selectedType, selectedWarehouse])

  // Export CSV
  function handleExportAlertsCsv() {
    const csvContent = generateAlertsReportCsv(filteredAlerts)
    const today = new Date().toISOString().slice(0, 10)
    downloadCsvFile(`invora-inventory-alerts-${today}.csv`, csvContent)
  }

  function handleResetFilters() {
    setSearch('')
    setSelectedSeverity('All')
    setSelectedType('All')
    setSelectedWarehouse('All')
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        action={
          <Button
            aria-label="Export Alerts CSV"
            onClick={handleExportAlertsCsv}
            variant="secondary"
          >
            <Download aria-hidden="true" size={16} />
            Export Alerts CSV
          </Button>
        }
        description="Real-time threshold alerts, critical stockouts, inventory discrepancies, and high-velocity movement warnings derived from live inventory."
        eyebrow="Monitoring & Exceptions"
        title="Inventory Alerts"
      />

      {/* Mock Data Information Notice Banner */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-surface-border bg-surface-secondary/70 px-4 py-3 text-xs text-text-secondary shadow-2xs">
        <span className="h-2 w-2 rounded-full bg-secondary" />
        <span>
          <strong>Rule-based monitoring preview:</strong> Alerts are calculated
          dynamically from in-memory catalog thresholds and recorded transaction
          logs. Unusual movement warnings flag single dispatches exceeding 50
          units or 50% of available stock.
        </span>
      </div>

      {/* Incident Command Telemetry Strip */}
      <div className="overflow-hidden rounded-xl border border-surface-border bg-white shadow-2xs">
        <div className="grid grid-cols-2 divide-y divide-surface-3 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Active Exceptions
              </span>
              <AlertCircle className="text-primary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {alertCounts.total}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Across monitored facilities
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Critical Stockouts
              </span>
              <XCircle className="text-danger" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-danger sm:text-3xl">
              {alertCounts.oosCount}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Zero available inventory
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Low Stock Warnings
              </span>
              <AlertTriangle className="text-warning" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-warning sm:text-3xl">
              {alertCounts.lowStockCount}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              At or below reorder level
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Velocity & Audit Flags
              </span>
              <Info className="text-secondary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-secondary sm:text-3xl">
              {alertCounts.unusualCount + alertCounts.adjustmentCount}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Audits & velocity spikes
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 lg:max-w-md">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              aria-label="Search alerts"
              className="h-10 w-full rounded-xl border border-surface-3 bg-sidebar pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, or keyword..."
              type="text"
              value={search}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Severity Filter */}
            <select
              aria-label="Filter by severity"
              className="h-9 rounded-xl border border-surface-3 bg-surface-2 px-3 text-xs text-text-primary focus:border-primary focus:outline-none"
              onChange={(e) => setSelectedSeverity(e.target.value)}
              value={selectedSeverity}
            >
              <option value="All">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            {/* Alert Type Filter */}
            <select
              aria-label="Filter by alert type"
              className="h-9 rounded-xl border border-surface-3 bg-surface-2 px-3 text-xs text-text-primary focus:border-primary focus:outline-none"
              onChange={(e) => setSelectedType(e.target.value)}
              value={selectedType}
            >
              <option value="All">All Alert Types</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="unusual_movement">Unusual Movement</option>
              <option value="recent_adjustment">Recent Adjustment</option>
            </select>

            {/* Warehouse Filter */}
            <select
              aria-label="Filter by warehouse"
              className="h-9 rounded-xl border border-surface-3 bg-surface-2 px-3 text-xs text-text-primary focus:border-primary focus:outline-none"
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              value={selectedWarehouse}
            >
              <option value="All">All Facilities</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            <Button
              aria-label="Reset filters"
              className="h-9 text-xs"
              onClick={handleResetFilters}
              variant="ghost"
            >
              <RotateCcw aria-hidden="true" size={14} />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Alerts Table / Feed */}
      <Card className="overflow-hidden">
        <div className="border-b border-surface-3/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-text-primary">
                Active Exception Log
              </h3>
              <p className="mt-0.5 text-xs text-text-secondary">
                Showing {filteredAlerts.length} of {allAlerts.length} active
                alerts based on selected criteria
              </p>
            </div>
            <span className="font-mono text-xs text-text-muted">
              Auto-refreshed with inventory
            </span>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-12">
            <EmptyState
              description={
                search || selectedSeverity !== 'All' || selectedType !== 'All'
                  ? 'No alerts match your current filter and search query. Try clearing filters.'
                  : 'All monitored inventory thresholds are currently healthy with no recorded exceptions.'
              }
              title="No alerts found"
            />
          </div>
        ) : (
          <div className="divide-y divide-surface-3/60">
            {filteredAlerts.map((alert) => (
              <div
                className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-surface-2/30 sm:flex-row sm:items-center"
                key={alert.id}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Severity Badge */}
                    <StatusBadge
                      tone={
                        alert.severity === 'critical'
                          ? 'danger'
                          : alert.severity === 'warning'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {alert.severity.toUpperCase()}
                    </StatusBadge>

                    {/* Alert Type Badge */}
                    <span className="rounded-md bg-surface-3 px-2 py-0.5 font-mono text-[11px] font-medium text-text-secondary">
                      {alert.type === 'out_of_stock'
                        ? 'Stockout'
                        : alert.type === 'low_stock'
                          ? 'Low Stock'
                          : alert.type === 'unusual_movement'
                            ? 'Movement Flag'
                            : 'Stock Audit'}
                    </span>

                    {/* Location */}
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Warehouse aria-hidden="true" size={13} />
                      {alert.warehouseName}
                    </span>

                    {/* Date */}
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock aria-hidden="true" size={13} />
                      {formatDate(alert.date)}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-text-primary">
                      {alert.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                      {alert.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span>
                      SKU:{' '}
                      <strong className="font-mono text-text-primary">
                        {alert.sku}
                      </strong>
                    </span>
                    <span>
                      Current Stock:{' '}
                      <strong className="font-mono text-text-primary">
                        {alert.currentStock} units
                      </strong>
                    </span>
                    {alert.reorderThreshold > 0 && (
                      <span>
                        Reorder Threshold:{' '}
                        <strong className="font-mono text-text-primary">
                          {alert.reorderThreshold} units
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:self-center">
                  <Link
                    aria-label={`Action for ${alert.productName}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-surface-3 bg-surface-2 px-3.5 py-2 text-xs font-medium text-text-primary transition-colors hover:border-primary/50 hover:bg-surface-3"
                    to={alert.actionUrl}
                  >
                    <span>
                      {alert.type === 'out_of_stock' ||
                      alert.type === 'low_stock'
                        ? 'Receive Stock'
                        : 'View Transaction'}
                    </span>
                    <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
