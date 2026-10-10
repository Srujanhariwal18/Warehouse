import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit2,
  Eye,
  Layers,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Server,
  Warehouse as WarehouseIcon,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TextInput } from '@/components/ui/TextInput'
import { formatDate } from '@/lib/formatters'
import { useInventoryStore } from '@/lib/inventoryStore'
import {
  useWarehouseStore,
  type CreateRackInput,
  type CreateWarehouseInput,
  type CreateZoneInput,
} from '@/lib/warehouseStore'
import type { Product, Warehouse, WarehouseStatus } from '@/mocks/inventoryData'
import type {
  RackStatus,
  WarehouseRack,
  WarehouseZone,
  ZoneStatus,
} from '@/mocks/warehouseData'

type StatusFilterOption = 'All' | 'Active' | 'Inactive'
type WarehouseSortField = 'name' | 'id' | 'city' | 'status' | 'zones' | 'racks'
type ZoneSortField = 'name' | 'id' | 'type' | 'status' | 'racks'
type RackSortField = 'name' | 'id' | 'capacity' | 'levels' | 'status'
type SortOrder = 'asc' | 'desc'

const pageSizes = [10, 20, 40]

export function WarehousesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeWarehouseId = searchParams.get('warehouseId')
  const activeZoneId = searchParams.get('zoneId')

  const {
    warehouses,
    zones,
    racks,
    addWarehouse,
    updateWarehouse,
    deactivateWarehouse,
    reactivateWarehouse,
    addZone,
    updateZone,
    deactivateZone,
    reactivateZone,
    addRack,
    updateRack,
    deactivateRack,
    reactivateRack,
  } = useWarehouseStore()

  const { products } = useInventoryStore()

  // Selected warehouse and zone from URL parameters
  const currentWarehouse = useMemo(() => {
    if (!activeWarehouseId) return null
    return warehouses.find((w) => w.id === activeWarehouseId) ?? null
  }, [warehouses, activeWarehouseId])

  const currentZone = useMemo(() => {
    if (!activeZoneId || !currentWarehouse) return null
    return (
      zones.find(
        (z) => z.id === activeZoneId && z.warehouseId === currentWarehouse.id,
      ) ?? null
    )
  }, [zones, activeZoneId, currentWarehouse])

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

  // Count active zones and racks per warehouse
  const warehouseZoneCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const z of zones) {
      map.set(z.warehouseId, (map.get(z.warehouseId) ?? 0) + 1)
    }
    return map
  }, [zones])

  const warehouseRackCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of racks) {
      map.set(r.warehouseId, (map.get(r.warehouseId) ?? 0) + 1)
    }
    return map
  }, [racks])

  const warehouseProductCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      if (p.warehouseId) {
        map.set(p.warehouseId, (map.get(p.warehouseId) ?? 0) + 1)
      }
    }
    return map
  }, [products])

  const zoneRackCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of racks) {
      map.set(r.zoneId, (map.get(r.zoneId) ?? 0) + 1)
    }
    return map
  }, [racks])

  const zoneProductCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      if (p.zoneId) {
        map.set(p.zoneId, (map.get(p.zoneId) ?? 0) + 1)
      }
    }
    return map
  }, [products])

  const rackProductCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of products) {
      if (p.rackId) {
        map.set(p.rackId, (map.get(p.rackId) ?? 0) + 1)
      }
    }
    return map
  }, [products])

  // Overall KPI statistics
  const overallStats = useMemo(() => {
    const totalWarehouses = warehouses.length
    const activeWarehouses = warehouses.filter(
      (w) => w.status === 'Active',
    ).length
    const totalZones = zones.length
    const totalRacks = racks.length
    return { totalWarehouses, activeWarehouses, totalZones, totalRacks }
  }, [warehouses, zones, racks])

  // Navigation helpers
  const navigateToRoot = () => setSearchParams({})
  const navigateToWarehouse = (warehouseId: string) =>
    setSearchParams({ warehouseId })
  const navigateToZone = (warehouseId: string, zoneId: string) =>
    setSearchParams({ warehouseId, zoneId })

  // Render current level
  if (currentWarehouse && currentZone) {
    return (
      <ZoneRacksView
        currentWarehouse={currentWarehouse}
        currentZone={currentZone}
        deactivateRack={deactivateRack}
        notice={notice}
        onAddRack={addRack}
        onBack={() => navigateToWarehouse(currentWarehouse.id)}
        onNavigateRoot={navigateToRoot}
        onUpdateRack={updateRack}
        rackProductCounts={rackProductCounts}
        racks={racks.filter((r) => r.zoneId === currentZone.id)}
        reactivateRack={reactivateRack}
        setNotice={setNotice}
      />
    )
  }

  if (currentWarehouse) {
    return (
      <WarehouseZonesView
        allRacks={racks}
        currentWarehouse={currentWarehouse}
        deactivateZone={deactivateZone}
        notice={notice}
        onAddZone={addZone}
        onBack={navigateToRoot}
        onNavigateZone={(zoneId) => navigateToZone(currentWarehouse.id, zoneId)}
        onUpdateZone={updateZone}
        reactivateZone={reactivateZone}
        setNotice={setNotice}
        warehouseProductCount={
          warehouseProductCounts.get(currentWarehouse.id) ?? 0
        }
        warehouseRackCount={warehouseRackCounts.get(currentWarehouse.id) ?? 0}
        zoneProductCounts={zoneProductCounts}
        zoneRackCounts={zoneRackCounts}
        zones={zones.filter((z) => z.warehouseId === currentWarehouse.id)}
      />
    )
  }

  return (
    <WarehousesRootView
      addWarehouse={addWarehouse}
      deactivateWarehouse={deactivateWarehouse}
      notice={notice}
      onNavigateWarehouse={navigateToWarehouse}
      overallStats={overallStats}
      products={products}
      reactivateWarehouse={reactivateWarehouse}
      setNotice={setNotice}
      updateWarehouse={updateWarehouse}
      warehouseProductCounts={warehouseProductCounts}
      warehouseRackCounts={warehouseRackCounts}
      warehouses={warehouses}
      warehouseZoneCounts={warehouseZoneCounts}
      zones={zones}
    />
  )
}

// =============================================================================
// LEVEL 1: WAREHOUSES ROOT VIEW
// =============================================================================

function WarehousesRootView({
  warehouses,
  zones,
  overallStats,
  warehouseZoneCounts,
  warehouseRackCounts,
  warehouseProductCounts,
  onNavigateWarehouse,
  addWarehouse,
  updateWarehouse,
  deactivateWarehouse,
  reactivateWarehouse,
  notice,
  setNotice,
  products,
}: {
  warehouses: Warehouse[]
  zones: WarehouseZone[]
  overallStats: {
    totalWarehouses: number
    activeWarehouses: number
    totalZones: number
    totalRacks: number
  }
  warehouseZoneCounts: Map<string, number>
  warehouseRackCounts: Map<string, number>
  warehouseProductCounts: Map<string, number>
  onNavigateWarehouse: (id: string) => void
  addWarehouse: (input: CreateWarehouseInput) => {
    ok: boolean
    message?: string
  }
  updateWarehouse: (
    id: string,
    input: Partial<CreateWarehouseInput> & { status?: WarehouseStatus },
  ) => { ok: boolean; message?: string }
  deactivateWarehouse: (
    id: string,
    options?: { activeProductCount?: number },
  ) => { ok: boolean; message?: string }
  reactivateWarehouse: (id: string) => { ok: boolean; message?: string }
  notice: { type: 'success' | 'error'; message: string } | null
  setNotice: (n: { type: 'success' | 'error'; message: string } | null) => void
  products: Product[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('All')
  const [sortField, setSortField] = useState<WarehouseSortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog & Drawer states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  )
  const [detailWarehouse, setDetailWarehouse] = useState<Warehouse | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Warehouse | null>(
    null,
  )

  // Filtered and sorted warehouses
  const filteredWarehouses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return warehouses
      .filter((w) => {
        if (statusFilter !== 'All' && w.status !== statusFilter) return false
        if (!q) return true
        const matchName = w.name.toLowerCase().includes(q)
        const matchId = w.id.toLowerCase().includes(q)
        const matchCity = w.city.toLowerCase().includes(q)
        const matchAddress = w.address?.toLowerCase().includes(q) ?? false
        return matchName || matchId || matchCity || matchAddress
      })
      .sort((a, b) => {
        let diff = 0
        if (sortField === 'name') {
          diff = a.name.localeCompare(b.name)
        } else if (sortField === 'id') {
          diff = a.id.localeCompare(b.id)
        } else if (sortField === 'city') {
          diff = a.city.localeCompare(b.city)
        } else if (sortField === 'status') {
          diff = (a.status ?? 'Active').localeCompare(b.status ?? 'Active')
        } else if (sortField === 'zones') {
          diff =
            (warehouseZoneCounts.get(a.id) ?? 0) -
            (warehouseZoneCounts.get(b.id) ?? 0)
        } else if (sortField === 'racks') {
          diff =
            (warehouseRackCounts.get(a.id) ?? 0) -
            (warehouseRackCounts.get(b.id) ?? 0)
        }
        return sortOrder === 'asc' ? diff : -diff
      })
  }, [
    warehouses,
    search,
    statusFilter,
    sortField,
    sortOrder,
    warehouseZoneCounts,
    warehouseRackCounts,
  ])

  const pageCount = Math.max(1, Math.ceil(filteredWarehouses.length / pageSize))
  const paginatedWarehouses = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredWarehouses.slice(start, start + pageSize)
  }, [filteredWarehouses, page, pageSize])

  const toggleSort = (field: WarehouseSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const hasActiveFilters = Boolean(search || statusFilter !== 'All')
  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        action={
          <Button
            className="flex items-center gap-2"
            onClick={() => setAddDialogOpen(true)}
            variant="primary"
          >
            <Plus size={16} />
            Add Warehouse
          </Button>
        }
        description="Oversee physical distribution facilities, manage storage zones, and optimize bin and rack allocations across your supply network."
        title="Warehouse Management"
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

      {/* Logistics Facility Network Telemetry Strip */}
      <div className="overflow-hidden rounded-xl border border-surface-3 bg-surface-1 shadow-sm">
        <div className="grid grid-cols-2 divide-y divide-surface-3 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Facilities
              </span>
              <WarehouseIcon className="text-primary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {overallStats.totalWarehouses}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Registered logistics facilities
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Operational
              </span>
              <Building2 className="text-success" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {overallStats.activeWarehouses}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              {overallStats.totalWarehouses > 0
                ? `${Math.round(
                    (overallStats.activeWarehouses /
                      overallStats.totalWarehouses) *
                      100,
                  )}% operational readiness`
                : 'No facilities active'}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Storage Zones
              </span>
              <Layers className="text-secondary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {overallStats.totalZones}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Segregated inventory areas
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Rack Structures
              </span>
              <Server className="text-warning" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {overallStats.totalRacks}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Configured storage structures
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                size={16}
              />
              <input
                aria-label="Search warehouses"
                className="h-10 w-full rounded-xl border border-surface-3 bg-sidebar pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by facility name, identifier, city, or address..."
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

            {/* Status Filter Buttons */}
            <div className="flex rounded-xl border border-surface-3 bg-sidebar p-1">
              {(['All', 'Active', 'Inactive'] as StatusFilterOption[]).map(
                (status) => (
                  <button
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-surface text-text-primary shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                    key={status}
                    onClick={() => {
                      setStatusFilter(status)
                      setPage(1)
                    }}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <Button
                className="text-xs text-text-muted hover:text-text-primary"
                onClick={resetFilters}
                variant="ghost"
              >
                Reset filters
              </Button>
            )}
            <div className="text-xs text-text-muted">
              {filteredWarehouses.length}{' '}
              {filteredWarehouses.length === 1 ? 'warehouse' : 'warehouses'}
            </div>
          </div>
        </div>
      </Card>

      {/* Warehouse Table / Cards */}
      <Card className="overflow-hidden">
        {paginatedWarehouses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="border-b border-surface-3 bg-sidebar text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      Warehouse Facility
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('id')}
                  >
                    <div className="flex items-center gap-1.5">
                      Identifier
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('city')}
                  >
                    <div className="flex items-center gap-1.5">
                      Location
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('zones')}
                  >
                    <div className="flex items-center gap-1.5">
                      Zones
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('racks')}
                  >
                    <div className="flex items-center gap-1.5">
                      Racks
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-5 py-3.5">Floor Capacity</th>
                  <th className="px-5 py-3.5">Assigned SKUs</th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/60">
                {paginatedWarehouses.map((warehouse) => {
                  const zoneCount = warehouseZoneCounts.get(warehouse.id) ?? 0
                  const rackCount = warehouseRackCounts.get(warehouse.id) ?? 0
                  const productCount =
                    warehouseProductCounts.get(warehouse.id) ?? 0

                  return (
                    <tr
                      className="group transition-colors hover:bg-surface-3/30"
                      key={warehouse.id}
                    >
                      {/* Facility Name & Address */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-text-primary">
                          {warehouse.name}
                        </div>
                        {warehouse.address && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-text-muted">
                            {warehouse.address}
                          </div>
                        )}
                      </td>

                      {/* Identifier */}
                      <td className="px-5 py-4 font-mono text-xs text-text-secondary whitespace-nowrap">
                        <span className="rounded-md border border-surface-3 bg-sidebar px-2 py-1">
                          {warehouse.id}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-text-primary">
                          <MapPin className="text-text-muted" size={14} />
                          {warehouse.city}
                        </div>
                        <div className="text-xs text-text-muted">
                          {[warehouse.state, warehouse.country]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </td>

                      {/* Zone Count */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-medium text-text-primary">
                          {zoneCount}
                        </span>{' '}
                        <span className="text-xs text-text-muted">
                          {zoneCount === 1 ? 'zone' : 'zones'}
                        </span>
                      </td>

                      {/* Rack Count */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-medium text-text-primary">
                          {rackCount}
                        </span>{' '}
                        <span className="text-xs text-text-muted">
                          {rackCount === 1 ? 'rack' : 'racks'}
                        </span>
                      </td>

                      {/* Floor Capacity */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-text-secondary">
                        {warehouse.capacitySqFt ? (
                          <span className="font-mono text-text-primary">
                            {warehouse.capacitySqFt.toLocaleString()} sq ft
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>

                      {/* Inventory Count */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Boxes className="text-text-muted" size={14} />
                          <span className="font-mono text-text-primary">
                            {productCount}
                          </span>
                          <span className="text-xs text-text-muted">SKUs</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge
                          tone={
                            warehouse.status === 'Active'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {warehouse.status ?? 'Active'}
                        </StatusBadge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Explore Zones Drill-down */}
                          <Button
                            aria-label={`Explore zones in ${warehouse.name}`}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs"
                            onClick={() => onNavigateWarehouse(warehouse.id)}
                            variant="secondary"
                          >
                            <Layers size={13} />
                            <span>Zones ({zoneCount})</span>
                            <ArrowRight size={12} />
                          </Button>

                          {/* View Warehouse Details */}
                          <Button
                            aria-label={`View details for ${warehouse.name}`}
                            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                            onClick={() => setDetailWarehouse(warehouse)}
                            variant="ghost"
                          >
                            <Eye size={15} />
                          </Button>

                          {/* Edit Warehouse */}
                          <Button
                            aria-label={`Edit ${warehouse.name}`}
                            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                            onClick={() => setEditingWarehouse(warehouse)}
                            variant="ghost"
                          >
                            <Edit2 size={15} />
                          </Button>

                          {/* Deactivate / Reactivate */}
                          {warehouse.status === 'Active' ? (
                            <Button
                              aria-label={`Deactivate ${warehouse.name}`}
                              className="h-8 w-8 p-0 text-text-muted hover:text-danger"
                              onClick={() => setDeactivateTarget(warehouse)}
                              variant="ghost"
                            >
                              <XCircle size={15} />
                            </Button>
                          ) : (
                            <Button
                              aria-label={`Reactivate ${warehouse.name}`}
                              className="h-8 w-8 p-0 text-text-muted hover:text-success"
                              onClick={() => {
                                const res = reactivateWarehouse(warehouse.id)
                                if (res.ok) {
                                  setNotice({
                                    type: 'success',
                                    message: `Warehouse "${warehouse.name}" was reactivated.`,
                                  })
                                } else {
                                  setNotice({
                                    type: 'error',
                                    message:
                                      res.message ?? 'Failed to reactivate.',
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
                    Add first warehouse
                  </Button>
                )
              }
              description={
                hasActiveFilters
                  ? 'No warehouses match your current search or filter criteria. Try clearing filters.'
                  : 'Your warehouse network is empty. Register your first physical facility to begin allocating inventory.'
              }
              title={
                hasActiveFilters
                  ? 'No matching warehouses'
                  : 'No warehouses configured'
              }
            />
          </div>
        )}

        {/* Pagination Toolbar */}
        {filteredWarehouses.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-3/80 px-5 py-4 text-xs text-text-muted sm:flex-row">
            <div>
              Showing{' '}
              <span className="font-medium text-text-primary">
                {(page - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-text-primary">
                {Math.min(page * pageSize, filteredWarehouses.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-text-primary">
                {filteredWarehouses.length}
              </span>{' '}
              warehouses
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

      {/* Warehouse Details Drawer */}
      {detailWarehouse && (
        <WarehouseDetailsDrawer
          onClose={() => setDetailWarehouse(null)}
          onDeactivate={(w) => {
            setDetailWarehouse(null)
            setDeactivateTarget(w)
          }}
          onEdit={(w) => {
            setDetailWarehouse(null)
            setEditingWarehouse(w)
          }}
          onExploreZones={(w) => {
            setDetailWarehouse(null)
            onNavigateWarehouse(w.id)
          }}
          products={products.filter(
            (p) => p.warehouseId === detailWarehouse.id,
          )}
          warehouse={detailWarehouse}
          zones={zones.filter((z) => z.warehouseId === detailWarehouse.id)}
        />
      )}

      {/* Add Warehouse Dialog */}
      {addDialogOpen && (
        <WarehouseFormDialog
          mode="create"
          onClose={() => setAddDialogOpen(false)}
          onSubmit={(input) => {
            const res = addWarehouse(input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Warehouse "${input.name}" was successfully registered.`,
              })
              setAddDialogOpen(false)
            }
            return res
          }}
        />
      )}

      {/* Edit Warehouse Dialog */}
      {editingWarehouse && (
        <WarehouseFormDialog
          initialWarehouse={editingWarehouse}
          mode="edit"
          onClose={() => setEditingWarehouse(null)}
          onSubmit={(input) => {
            const res = updateWarehouse(editingWarehouse.id, input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Warehouse "${input.name}" was successfully updated.`,
              })
              setEditingWarehouse(null)
            }
            return res
          }}
        />
      )}

      {/* Deactivate Warehouse Confirmation Dialog */}
      {deactivateTarget && (
        <DeactivateWarehouseConfirmDialog
          activeZonesCount={
            zones.filter(
              (z) =>
                z.warehouseId === deactivateTarget.id && z.status === 'Active',
            ).length
          }
          assignedProductsCount={
            warehouseProductCounts.get(deactivateTarget.id) ?? 0
          }
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={() => {
            const activeCount =
              warehouseProductCounts.get(deactivateTarget.id) ?? 0
            const res = deactivateWarehouse(deactivateTarget.id, {
              activeProductCount: activeCount,
            })
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Warehouse "${deactivateTarget.name}" has been deactivated.`,
              })
              setDeactivateTarget(null)
            } else {
              setNotice({
                type: 'error',
                message: res.message ?? 'Cannot deactivate warehouse.',
              })
              setDeactivateTarget(null)
            }
          }}
          warehouse={deactivateTarget}
        />
      )}
    </div>
  )
}

// =============================================================================
// LEVEL 2: WAREHOUSE ZONES VIEW
// =============================================================================

function WarehouseZonesView({
  currentWarehouse,
  zones,
  allRacks,
  warehouseRackCount,
  warehouseProductCount,
  zoneRackCounts,
  zoneProductCounts,
  onBack,
  onNavigateZone,
  onAddZone,
  onUpdateZone,
  deactivateZone,
  reactivateZone,
  notice,
  setNotice,
}: {
  currentWarehouse: Warehouse
  zones: WarehouseZone[]
  allRacks: WarehouseRack[]
  warehouseRackCount: number
  warehouseProductCount: number
  zoneRackCounts: Map<string, number>
  zoneProductCounts: Map<string, number>
  onBack: () => void
  onNavigateZone: (zoneId: string) => void
  onAddZone: (input: CreateZoneInput) => { ok: boolean; message?: string }
  onUpdateZone: (
    id: string,
    input: Partial<CreateZoneInput> & { status?: ZoneStatus },
  ) => { ok: boolean; message?: string }
  deactivateZone: (
    id: string,
    options?: { activeProductCount?: number },
  ) => { ok: boolean; message?: string }
  reactivateZone: (id: string) => { ok: boolean; message?: string }
  notice: { type: 'success' | 'error'; message: string } | null
  setNotice: (n: { type: 'success' | 'error'; message: string } | null) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('All')
  const [sortField, setSortField] = useState<ZoneSortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<WarehouseZone | null>(null)
  const [deactivateTarget, setDeactivateTarget] =
    useState<WarehouseZone | null>(null)

  const activeZonesCount = zones.filter((z) => z.status === 'Active').length

  const filteredZones = useMemo(() => {
    const q = search.trim().toLowerCase()
    return zones
      .filter((z) => {
        if (statusFilter !== 'All' && z.status !== statusFilter) return false
        if (!q) return true
        const matchName = z.name.toLowerCase().includes(q)
        const matchId = z.id.toLowerCase().includes(q)
        const matchType = z.type?.toLowerCase().includes(q) ?? false
        const matchDesc = z.description?.toLowerCase().includes(q) ?? false
        return matchName || matchId || matchType || matchDesc
      })
      .sort((a, b) => {
        let diff = 0
        if (sortField === 'name') {
          diff = a.name.localeCompare(b.name)
        } else if (sortField === 'id') {
          diff = a.id.localeCompare(b.id)
        } else if (sortField === 'type') {
          diff = (a.type ?? '').localeCompare(b.type ?? '')
        } else if (sortField === 'status') {
          diff = (a.status ?? 'Active').localeCompare(b.status ?? 'Active')
        } else if (sortField === 'racks') {
          diff =
            (zoneRackCounts.get(a.id) ?? 0) - (zoneRackCounts.get(b.id) ?? 0)
        }
        return sortOrder === 'asc' ? diff : -diff
      })
  }, [zones, search, statusFilter, sortField, sortOrder, zoneRackCounts])

  const pageCount = Math.max(1, Math.ceil(filteredZones.length / pageSize))
  const paginatedZones = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredZones.slice(start, start + pageSize)
  }, [filteredZones, page, pageSize])

  const toggleSort = (field: ZoneSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const hasActiveFilters = Boolean(search || statusFilter !== 'All')
  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
        <button
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          onClick={onBack}
        >
          Warehouses
        </button>
        <span className="text-text-muted/60">/</span>
        <span className="font-medium text-text-primary">
          {currentWarehouse.name} ({currentWarehouse.id})
        </span>
      </nav>

      {/* Page Header */}
      <PageHeader
        action={
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center gap-1.5"
              onClick={onBack}
              variant="secondary"
            >
              <ChevronLeft size={16} />
              Back to Warehouses
            </Button>
            <Button
              className="flex items-center gap-1.5"
              onClick={() => setAddDialogOpen(true)}
              variant="primary"
            >
              <Plus size={16} />
              Add Zone
            </Button>
          </div>
        }
        description={`Facility: ${currentWarehouse.name} (${currentWarehouse.city}). Manage localized storage sections, cold rooms, staging areas, and bin allocations.`}
        title={`${currentWarehouse.name} — Zones`}
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

      {/* Warehouse Summary Banner */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <WarehouseIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-text-primary">
                  {currentWarehouse.name}
                </h2>
                <StatusBadge
                  tone={
                    currentWarehouse.status === 'Active' ? 'success' : 'neutral'
                  }
                >
                  {currentWarehouse.status ?? 'Active'}
                </StatusBadge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1">
                <span className="font-mono">{currentWarehouse.id}</span>
                <span>•</span>
                <span>{currentWarehouse.city}</span>
                {currentWarehouse.capacitySqFt && (
                  <>
                    <span>•</span>
                    <span>
                      {currentWarehouse.capacitySqFt.toLocaleString()} sq ft
                      floor
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{warehouseProductCount} SKUs assigned</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted sm:border-l sm:border-surface-3 sm:pl-6">
            <div>
              <div className="font-mono text-xl font-bold text-text-primary">
                {zones.length}
              </div>
              <div>Total Zones</div>
            </div>
            <div>
              <div className="font-mono text-xl font-bold text-text-primary">
                {warehouseRackCount}
              </div>
              <div>Total Racks</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Zone Level Telemetry Strip */}
      <div className="overflow-hidden rounded-xl border border-surface-3 bg-surface-1 shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-surface-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Facility Zones
              </span>
              <Layers className="text-primary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {zones.length}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Configured functional areas
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Active Zones
              </span>
              <CheckCircle2 className="text-success" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {activeZonesCount}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Operational receiving & storage
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Racks in Facility
              </span>
              <Server className="text-secondary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {warehouseRackCount}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Distributed across functional zones
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                size={16}
              />
              <input
                aria-label="Search zones"
                className="h-10 w-full rounded-xl border border-surface-3 bg-sidebar pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search zones by name, code, type, or description..."
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

            {/* Status Filter */}
            <div className="flex rounded-xl border border-surface-3 bg-sidebar p-1">
              {(['All', 'Active', 'Inactive'] as StatusFilterOption[]).map(
                (status) => (
                  <button
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-surface text-text-primary shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                    key={status}
                    onClick={() => {
                      setStatusFilter(status)
                      setPage(1)
                    }}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <Button
                className="text-xs text-text-muted hover:text-text-primary"
                onClick={resetFilters}
                variant="ghost"
              >
                Reset filters
              </Button>
            )}
            <div className="text-xs text-text-muted">
              {filteredZones.length}{' '}
              {filteredZones.length === 1 ? 'zone' : 'zones'}
            </div>
          </div>
        </div>
      </Card>

      {/* Zones Table */}
      <Card className="overflow-hidden">
        {paginatedZones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="border-b border-surface-3 bg-sidebar text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      Zone Name
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('id')}
                  >
                    <div className="flex items-center gap-1.5">
                      Identifier
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('type')}
                  >
                    <div className="flex items-center gap-1.5">
                      Zone Type
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-5 py-3.5">Description</th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('racks')}
                  >
                    <div className="flex items-center gap-1.5">
                      Racks
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-5 py-3.5">Assigned SKUs</th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/60">
                {paginatedZones.map((zone) => {
                  const rackCount = zoneRackCounts.get(zone.id) ?? 0
                  const productCount = zoneProductCounts.get(zone.id) ?? 0

                  return (
                    <tr
                      className="group transition-colors hover:bg-surface-3/30"
                      key={zone.id}
                    >
                      {/* Zone Name */}
                      <td className="px-5 py-4 font-medium text-text-primary">
                        {zone.name}
                      </td>

                      {/* Identifier */}
                      <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                        <span className="rounded-md border border-surface-3 bg-sidebar px-2 py-1">
                          {zone.id}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="rounded-md bg-surface-3 px-2 py-1 text-xs text-text-primary">
                          {zone.type ?? 'Storage'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-xs text-text-muted max-w-xs truncate">
                        {zone.description ?? '—'}
                      </td>

                      {/* Racks */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-medium text-text-primary">
                          {rackCount}
                        </span>{' '}
                        <span className="text-xs text-text-muted">
                          {rackCount === 1 ? 'rack' : 'racks'}
                        </span>
                      </td>

                      {/* SKUs */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        <span className="font-mono text-text-primary">
                          {productCount}
                        </span>{' '}
                        <span className="text-text-muted">SKUs</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge
                          tone={
                            zone.status === 'Active' ? 'success' : 'neutral'
                          }
                        >
                          {zone.status ?? 'Active'}
                        </StatusBadge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Manage Racks Drill-down */}
                          <Button
                            aria-label={`Manage racks in ${zone.name}`}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs"
                            onClick={() => onNavigateZone(zone.id)}
                            variant="secondary"
                          >
                            <Server size={13} />
                            <span>Racks ({rackCount})</span>
                            <ArrowRight size={12} />
                          </Button>

                          {/* Edit Zone */}
                          <Button
                            aria-label={`Edit ${zone.name}`}
                            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                            onClick={() => setEditingZone(zone)}
                            variant="ghost"
                          >
                            <Edit2 size={15} />
                          </Button>

                          {/* Deactivate / Reactivate */}
                          {zone.status === 'Active' ? (
                            <Button
                              aria-label={`Deactivate ${zone.name}`}
                              className="h-8 w-8 p-0 text-text-muted hover:text-danger"
                              onClick={() => setDeactivateTarget(zone)}
                              variant="ghost"
                            >
                              <XCircle size={15} />
                            </Button>
                          ) : (
                            <Button
                              aria-label={`Reactivate ${zone.name}`}
                              className="h-8 w-8 p-0 text-text-muted hover:text-success"
                              onClick={() => {
                                const res = reactivateZone(zone.id)
                                if (res.ok) {
                                  setNotice({
                                    type: 'success',
                                    message: `Zone "${zone.name}" was reactivated.`,
                                  })
                                } else {
                                  setNotice({
                                    type: 'error',
                                    message:
                                      res.message ??
                                      'Failed to reactivate zone.',
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
                    Add first zone
                  </Button>
                )
              }
              description={
                hasActiveFilters
                  ? 'No zones match your search or filter. Try clearing filters.'
                  : `No storage zones configured for ${currentWarehouse.name}. Add a zone to organize storage aisles and racks.`
              }
              title={
                hasActiveFilters ? 'No matching zones' : 'No zones registered'
              }
            />
          </div>
        )}

        {/* Pagination Toolbar */}
        {filteredZones.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-3/80 px-5 py-4 text-xs text-text-muted sm:flex-row">
            <div>
              Showing{' '}
              <span className="font-medium text-text-primary">
                {(page - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-text-primary">
                {Math.min(page * pageSize, filteredZones.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-text-primary">
                {filteredZones.length}
              </span>{' '}
              zones
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

      {/* Add Zone Dialog */}
      {addDialogOpen && (
        <ZoneFormDialog
          currentWarehouse={currentWarehouse}
          mode="create"
          onClose={() => setAddDialogOpen(false)}
          onSubmit={(input) => {
            const res = onAddZone(input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Zone "${input.name}" was successfully added to ${currentWarehouse.name}.`,
              })
              setAddDialogOpen(false)
            }
            return res
          }}
        />
      )}

      {/* Edit Zone Dialog */}
      {editingZone && (
        <ZoneFormDialog
          currentWarehouse={currentWarehouse}
          initialZone={editingZone}
          mode="edit"
          onClose={() => setEditingZone(null)}
          onSubmit={(input) => {
            const res = onUpdateZone(editingZone.id, input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Zone "${input.name}" was successfully updated.`,
              })
              setEditingZone(null)
            }
            return res
          }}
        />
      )}

      {/* Deactivate Zone Confirmation Dialog */}
      {deactivateTarget && (
        <DeactivateZoneConfirmDialog
          activeRacksCount={
            allRacks.filter(
              (r) => r.zoneId === deactivateTarget.id && r.status === 'Active',
            ).length
          }
          assignedProductsCount={
            zoneProductCounts.get(deactivateTarget.id) ?? 0
          }
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={() => {
            const activeProductCount =
              zoneProductCounts.get(deactivateTarget.id) ?? 0
            const res = deactivateZone(deactivateTarget.id, {
              activeProductCount,
            })
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Zone "${deactivateTarget.name}" has been deactivated.`,
              })
              setDeactivateTarget(null)
            } else {
              setNotice({
                type: 'error',
                message: res.message ?? 'Cannot deactivate zone.',
              })
              setDeactivateTarget(null)
            }
          }}
          zone={deactivateTarget}
        />
      )}
    </div>
  )
}

// =============================================================================
// LEVEL 3: ZONE RACKS VIEW
// =============================================================================

function ZoneRacksView({
  currentWarehouse,
  currentZone,
  racks,
  rackProductCounts,
  onBack,
  onNavigateRoot,
  onAddRack,
  onUpdateRack,
  deactivateRack,
  reactivateRack,
  notice,
  setNotice,
}: {
  currentWarehouse: Warehouse
  currentZone: WarehouseZone
  racks: WarehouseRack[]
  rackProductCounts: Map<string, number>
  onBack: () => void
  onNavigateRoot: () => void
  onAddRack: (input: CreateRackInput) => { ok: boolean; message?: string }
  onUpdateRack: (
    id: string,
    input: Partial<CreateRackInput> & { status?: RackStatus },
  ) => { ok: boolean; message?: string }
  deactivateRack: (
    id: string,
    options?: { activeProductCount?: number },
  ) => { ok: boolean; message?: string }
  reactivateRack: (id: string) => { ok: boolean; message?: string }
  notice: { type: 'success' | 'error'; message: string } | null
  setNotice: (n: { type: 'success' | 'error'; message: string } | null) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('All')
  const [sortField, setSortField] = useState<RackSortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingRack, setEditingRack] = useState<WarehouseRack | null>(null)
  const [deactivateTarget, setDeactivateTarget] =
    useState<WarehouseRack | null>(null)

  const activeRacksCount = racks.filter((r) => r.status === 'Active').length
  const totalBinCapacity = racks.reduce((acc, r) => acc + (r.capacity ?? 0), 0)

  const filteredRacks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return racks
      .filter((r) => {
        if (statusFilter !== 'All' && r.status !== statusFilter) return false
        if (!q) return true
        const matchName = r.name.toLowerCase().includes(q)
        const matchId = r.id.toLowerCase().includes(q)
        return matchName || matchId
      })
      .sort((a, b) => {
        let diff = 0
        if (sortField === 'name') {
          diff = a.name.localeCompare(b.name)
        } else if (sortField === 'id') {
          diff = a.id.localeCompare(b.id)
        } else if (sortField === 'levels') {
          diff = (a.levels ?? 0) - (b.levels ?? 0)
        } else if (sortField === 'capacity') {
          diff = (a.capacity ?? 0) - (b.capacity ?? 0)
        } else if (sortField === 'status') {
          diff = (a.status ?? 'Active').localeCompare(b.status ?? 'Active')
        }
        return sortOrder === 'asc' ? diff : -diff
      })
  }, [racks, search, statusFilter, sortField, sortOrder])

  const pageCount = Math.max(1, Math.ceil(filteredRacks.length / pageSize))
  const paginatedRacks = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRacks.slice(start, start + pageSize)
  }, [filteredRacks, page, pageSize])

  const toggleSort = (field: RackSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const hasActiveFilters = Boolean(search || statusFilter !== 'All')
  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
        <button
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          onClick={onNavigateRoot}
        >
          Warehouses
        </button>
        <span className="text-text-muted/60">/</span>
        <button
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          onClick={onBack}
        >
          {currentWarehouse.name}
        </button>
        <span className="text-text-muted/60">/</span>
        <span className="font-medium text-text-primary">
          {currentZone.name} ({currentZone.id})
        </span>
      </nav>

      {/* Page Header */}
      <PageHeader
        action={
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center gap-1.5"
              onClick={onBack}
              variant="secondary"
            >
              <ChevronLeft size={16} />
              Back to Zones
            </Button>
            <Button
              className="flex items-center gap-1.5"
              onClick={() => setAddDialogOpen(true)}
              variant="primary"
            >
              <Plus size={16} />
              Add Rack
            </Button>
          </div>
        }
        description={`Zone: ${currentZone.name} (${currentZone.id}) in ${currentWarehouse.name}. Manage pallet racks, bin locations, and shelf tiers.`}
        title={`${currentZone.name} — Racks`}
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

      {/* Zone Overview Banner */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary/10 text-secondary">
              <Server size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-text-primary">
                  {currentZone.name}
                </h2>
                <StatusBadge
                  tone={currentZone.status === 'Active' ? 'success' : 'neutral'}
                >
                  {currentZone.status ?? 'Active'}
                </StatusBadge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1">
                <span className="font-mono">{currentZone.id}</span>
                <span>•</span>
                <span>Type: {currentZone.type ?? 'Storage'}</span>
                <span>•</span>
                <span>Warehouse: {currentWarehouse.name}</span>
                {currentZone.description && (
                  <>
                    <span>•</span>
                    <span className="italic">{currentZone.description}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted sm:border-l sm:border-surface-3 sm:pl-6">
            <div>
              <div className="font-mono text-xl font-bold text-text-primary">
                {racks.length}
              </div>
              <div>Racks in Zone</div>
            </div>
            <div>
              <div className="font-mono text-xl font-bold text-text-primary">
                {totalBinCapacity > 0 ? totalBinCapacity.toLocaleString() : '—'}
              </div>
              <div>Rated Capacity</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Rack Level Telemetry Strip */}
      <div className="overflow-hidden rounded-xl border border-surface-3 bg-surface-1 shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-surface-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Racks in Zone
              </span>
              <Server className="text-primary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {racks.length}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Configured shelving structures
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Active Racks
              </span>
              <CheckCircle2 className="text-success" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {activeRacksCount}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Available for bin placement
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-medium text-text-secondary">
                Bin Capacity
              </span>
              <Database className="text-secondary" size={16} />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              {totalBinCapacity > 0 ? totalBinCapacity.toLocaleString() : '—'}
            </div>
            <div className="mt-1 text-xs text-text-muted">
              Storage bin slots rated
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                size={16}
              />
              <input
                aria-label="Search racks"
                className="h-10 w-full rounded-xl border border-surface-3 bg-sidebar pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search racks by identifier or label..."
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

            {/* Status Filter */}
            <div className="flex rounded-xl border border-surface-3 bg-sidebar p-1">
              {(['All', 'Active', 'Inactive'] as StatusFilterOption[]).map(
                (status) => (
                  <button
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-surface text-text-primary shadow-xs'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                    key={status}
                    onClick={() => {
                      setStatusFilter(status)
                      setPage(1)
                    }}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <Button
                className="text-xs text-text-muted hover:text-text-primary"
                onClick={resetFilters}
                variant="ghost"
              >
                Reset filters
              </Button>
            )}
            <div className="text-xs text-text-muted">
              {filteredRacks.length}{' '}
              {filteredRacks.length === 1 ? 'rack' : 'racks'}
            </div>
          </div>
        </div>
      </Card>

      {/* Racks Table */}
      <Card className="overflow-hidden">
        {paginatedRacks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="border-b border-surface-3 bg-sidebar text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      Rack Label / Name
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('id')}
                  >
                    <div className="flex items-center gap-1.5">
                      Identifier
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('levels')}
                  >
                    <div className="flex items-center gap-1.5">
                      Shelf Levels
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('capacity')}
                  >
                    <div className="flex items-center gap-1.5">
                      Rated Capacity
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-5 py-3.5">Assigned SKUs</th>
                  <th
                    className="cursor-pointer px-5 py-3.5 hover:text-text-primary"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <ArrowUpDown size={13} />
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/60">
                {paginatedRacks.map((rack) => {
                  const productCount = rackProductCounts.get(rack.id) ?? 0

                  return (
                    <tr
                      className="group transition-colors hover:bg-surface-3/30"
                      key={rack.id}
                    >
                      {/* Name */}
                      <td className="px-5 py-4 font-medium text-text-primary">
                        {rack.name}
                      </td>

                      {/* Identifier */}
                      <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                        <span className="rounded-md border border-surface-3 bg-sidebar px-2 py-1">
                          {rack.id}
                        </span>
                      </td>

                      {/* Levels */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-text-primary">
                          {rack.levels ?? 3}
                        </span>{' '}
                        <span className="text-xs text-text-muted">tiers</span>
                      </td>

                      {/* Capacity */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {rack.capacity ? (
                          <>
                            <span className="font-mono text-text-primary">
                              {rack.capacity.toLocaleString()}
                            </span>{' '}
                            <span className="text-xs text-text-muted">
                              units
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-text-muted">
                            Unspecified
                          </span>
                        )}
                      </td>

                      {/* SKUs */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        <span className="font-mono text-text-primary">
                          {productCount}
                        </span>{' '}
                        <span className="text-text-muted">SKUs</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge
                          tone={
                            rack.status === 'Active' ? 'success' : 'neutral'
                          }
                        >
                          {rack.status ?? 'Active'}
                        </StatusBadge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Rack */}
                          <Button
                            aria-label={`Edit ${rack.name}`}
                            className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                            onClick={() => setEditingRack(rack)}
                            variant="ghost"
                          >
                            <Edit2 size={15} />
                          </Button>

                          {/* Deactivate / Reactivate */}
                          {rack.status === 'Active' ? (
                            <Button
                              aria-label={`Deactivate ${rack.name}`}
                              className="h-8 w-8 p-0 text-text-muted hover:text-danger"
                              onClick={() => setDeactivateTarget(rack)}
                              variant="ghost"
                            >
                              <XCircle size={15} />
                            </Button>
                          ) : (
                            <Button
                              aria-label={`Reactivate ${rack.name}`}
                              className="h-8 w-8 p-0 text-text-muted hover:text-success"
                              onClick={() => {
                                const res = reactivateRack(rack.id)
                                if (res.ok) {
                                  setNotice({
                                    type: 'success',
                                    message: `Rack "${rack.name}" was reactivated.`,
                                  })
                                } else {
                                  setNotice({
                                    type: 'error',
                                    message:
                                      res.message ??
                                      'Failed to reactivate rack.',
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
                    Add first rack
                  </Button>
                )
              }
              description={
                hasActiveFilters
                  ? 'No racks match your search or filter. Try clearing filters.'
                  : `No racks configured in zone ${currentZone.name}. Add your first rack structure.`
              }
              title={
                hasActiveFilters ? 'No matching racks' : 'No racks registered'
              }
            />
          </div>
        )}

        {/* Pagination Toolbar */}
        {filteredRacks.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-3/80 px-5 py-4 text-xs text-text-muted sm:flex-row">
            <div>
              Showing{' '}
              <span className="font-medium text-text-primary">
                {(page - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-text-primary">
                {Math.min(page * pageSize, filteredRacks.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-text-primary">
                {filteredRacks.length}
              </span>{' '}
              racks
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

      {/* Add Rack Dialog */}
      {addDialogOpen && (
        <RackFormDialog
          currentZone={currentZone}
          mode="create"
          onClose={() => setAddDialogOpen(false)}
          onSubmit={(input) => {
            const res = onAddRack(input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Rack "${input.name}" was successfully added to ${currentZone.name}.`,
              })
              setAddDialogOpen(false)
            }
            return res
          }}
        />
      )}

      {/* Edit Rack Dialog */}
      {editingRack && (
        <RackFormDialog
          currentZone={currentZone}
          initialRack={editingRack}
          mode="edit"
          onClose={() => setEditingRack(null)}
          onSubmit={(input) => {
            const res = onUpdateRack(editingRack.id, input)
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Rack "${input.name}" was successfully updated.`,
              })
              setEditingRack(null)
            }
            return res
          }}
        />
      )}

      {/* Deactivate Rack Confirmation Dialog */}
      {deactivateTarget && (
        <DeactivateRackConfirmDialog
          assignedProductsCount={
            rackProductCounts.get(deactivateTarget.id) ?? 0
          }
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={() => {
            const activeProductCount =
              rackProductCounts.get(deactivateTarget.id) ?? 0
            const res = deactivateRack(deactivateTarget.id, {
              activeProductCount,
            })
            if (res.ok) {
              setNotice({
                type: 'success',
                message: `Rack "${deactivateTarget.name}" has been deactivated.`,
              })
              setDeactivateTarget(null)
            } else {
              setNotice({
                type: 'error',
                message: res.message ?? 'Cannot deactivate rack.',
              })
              setDeactivateTarget(null)
            }
          }}
          rack={deactivateTarget}
        />
      )}
    </div>
  )
}

// =============================================================================
// MODALS & DRAWERS
// =============================================================================

// -----------------------------------------------------------------------------
// 1. Warehouse Form Dialog (Create / Edit)
// -----------------------------------------------------------------------------

function WarehouseFormDialog({
  initialWarehouse,
  mode,
  onClose,
  onSubmit,
}: {
  initialWarehouse?: Warehouse
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (input: CreateWarehouseInput) => { ok: boolean; message?: string }
}) {
  const [id, setId] = useState(initialWarehouse?.id ?? '')
  const [name, setName] = useState(initialWarehouse?.name ?? '')
  const [city, setCity] = useState(initialWarehouse?.city ?? '')
  const [address, setAddress] = useState(initialWarehouse?.address ?? '')
  const [state, setState] = useState(initialWarehouse?.state ?? '')
  const [postalCode, setPostalCode] = useState(
    initialWarehouse?.postalCode ?? '',
  )
  const [country, setCountry] = useState(initialWarehouse?.country ?? 'India')
  const [capacitySqFt, setCapacitySqFt] = useState<string>(
    initialWarehouse?.capacitySqFt ? String(initialWarehouse.capacitySqFt) : '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Warehouse name is required.')
      return
    }

    const trimmedCity = city.trim()
    if (!trimmedCity) {
      setError('City is required.')
      return
    }

    let parsedCapacity: number | undefined
    if (capacitySqFt.trim()) {
      const num = Number(capacitySqFt.trim())
      if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
        setError('Floor capacity must be a positive whole number in sq ft.')
        return
      }
      parsedCapacity = num
    }

    setIsSubmitting(true)
    const payload: CreateWarehouseInput = {
      id: mode === 'create' ? id.trim() || undefined : undefined,
      name: trimmedName,
      city: trimmedCity,
      address: address.trim() || undefined,
      state: state.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      country: country.trim() || 'India',
      capacitySqFt: parsedCapacity,
    }

    const res = onSubmit(payload)
    if (!res.ok) {
      setError(res.message ?? 'An error occurred.')
      setIsSubmitting(false)
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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {mode === 'create'
              ? 'Register Warehouse Facility'
              : `Edit ${initialWarehouse?.name}`}
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
            ? 'Add a new physical distribution center or logistics depot to the network.'
            : 'Update facility details and operational parameters.'}
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
              disabled={mode === 'edit'}
              label={
                mode === 'create'
                  ? 'Identifier (Code, optional)'
                  : 'Identifier (Immutable)'
              }
              onChange={(e) => {
                setError(null)
                setId(e.target.value)
              }}
              placeholder="e.g. wh-mum or leave blank to auto-generate"
              value={id}
            />

            <TextInput
              label="Warehouse Name *"
              onChange={(e) => {
                setError(null)
                setName(e.target.value)
              }}
              placeholder="e.g. Mumbai Central Depot"
              required
              value={name}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="City *"
              onChange={(e) => {
                setError(null)
                setCity(e.target.value)
              }}
              placeholder="e.g. Mumbai"
              required
              value={city}
            />

            <TextInput
              label="State / Province"
              onChange={(e) => {
                setError(null)
                setState(e.target.value)
              }}
              placeholder="e.g. Maharashtra"
              value={state}
            />
          </div>

          <TextInput
            label="Street Address / Facility Location"
            onChange={(e) => {
              setError(null)
              setAddress(e.target.value)
            }}
            placeholder="e.g. Plot 14, MIDC Logistics Hub, Kurla West"
            value={address}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextInput
              label="Postal Code"
              onChange={(e) => {
                setError(null)
                setPostalCode(e.target.value)
              }}
              placeholder="400070"
              value={postalCode}
            />

            <TextInput
              label="Country"
              onChange={(e) => {
                setError(null)
                setCountry(e.target.value)
              }}
              placeholder="India"
              value={country}
            />

            <TextInput
              label="Floor Capacity (sq ft)"
              min={1}
              onChange={(e) => {
                setError(null)
                setCapacitySqFt(e.target.value)
              }}
              placeholder="e.g. 50000"
              type="number"
              value={capacitySqFt}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-3/80">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {mode === 'create' ? 'Register warehouse' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 2. Zone Form Dialog (Create / Edit)
// -----------------------------------------------------------------------------

function ZoneFormDialog({
  currentWarehouse,
  initialZone,
  mode,
  onClose,
  onSubmit,
}: {
  currentWarehouse: Warehouse
  initialZone?: WarehouseZone
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (input: CreateZoneInput) => { ok: boolean; message?: string }
}) {
  const [id, setId] = useState(initialZone?.id ?? '')
  const [name, setName] = useState(initialZone?.name ?? '')
  const [type, setType] = useState(initialZone?.type ?? 'Storage')
  const [description, setDescription] = useState(initialZone?.description ?? '')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Zone name is required.')
      return
    }

    setIsSubmitting(true)
    const payload: CreateZoneInput = {
      id: mode === 'create' ? id.trim() || undefined : undefined,
      warehouseId: currentWarehouse.id,
      name: trimmedName,
      type: type.trim() || 'Storage',
      description: description.trim() || undefined,
    }

    const res = onSubmit(payload)
    if (!res.ok) {
      setError(res.message ?? 'An error occurred.')
      setIsSubmitting(false)
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {mode === 'create'
              ? 'Add Storage Zone'
              : `Edit ${initialZone?.name}`}
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
          Parent facility:{' '}
          <strong className="text-text-primary">
            {currentWarehouse.name} ({currentWarehouse.id})
          </strong>
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
          <TextInput
            disabled={mode === 'edit'}
            label={
              mode === 'create'
                ? 'Zone Identifier (optional)'
                : 'Zone Identifier (Immutable)'
            }
            onChange={(e) => {
              setError(null)
              setId(e.target.value)
            }}
            placeholder="e.g. zon-mum-a or leave blank to auto-generate"
            value={id}
          />

          <TextInput
            label="Zone Name *"
            onChange={(e) => {
              setError(null)
              setName(e.target.value)
            }}
            placeholder="e.g. Bulk Pallet Storage A"
            required
            value={name}
          />

          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Zone Type / Purpose
            <select
              className="h-11 rounded-xl border border-surface-3 bg-sidebar px-3 text-sm text-text-primary focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onChange={(e) => setType(e.target.value)}
              value={type}
            >
              <option value="Storage">General Storage</option>
              <option value="Cold Storage">
                Cold Storage / Temperature Controlled
              </option>
              <option value="High Density">High Density Bulk Pallet</option>
              <option value="Staging">Staging & Inbound Dock</option>
              <option value="Picking">Fast-Moving Picking Line</option>
              <option value="Returns">Returns & Quarantine</option>
              <option value="Hazardous">Hazardous Materials</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-text-secondary">
            Description / Operational Notes
            <textarea
              className="h-20 rounded-xl border border-surface-3 bg-sidebar p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. North wing heavy duty pallet racking area"
              value={description}
            />
          </label>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-3/80">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {mode === 'create' ? 'Add zone' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 3. Rack Form Dialog (Create / Edit)
// -----------------------------------------------------------------------------

function RackFormDialog({
  currentZone,
  initialRack,
  mode,
  onClose,
  onSubmit,
}: {
  currentZone: WarehouseZone
  initialRack?: WarehouseRack
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (input: CreateRackInput) => { ok: boolean; message?: string }
}) {
  const [id, setId] = useState(initialRack?.id ?? '')
  const [name, setName] = useState(initialRack?.name ?? '')
  const [capacity, setCapacity] = useState<string>(
    initialRack?.capacity ? String(initialRack.capacity) : '',
  )
  const [levels, setLevels] = useState<string>(
    initialRack?.levels ? String(initialRack.levels) : '3',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Rack label is required.')
      return
    }

    let parsedCapacity: number | undefined
    if (capacity.trim()) {
      const num = Number(capacity.trim())
      if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
        setError('Capacity must be a positive whole number.')
        return
      }
      parsedCapacity = num
    }

    let parsedLevels: number | undefined
    if (levels.trim()) {
      const num = Number(levels.trim())
      if (!Number.isFinite(num) || num <= 0 || !Number.isInteger(num)) {
        setError('Shelf levels must be a positive whole number.')
        return
      }
      parsedLevels = num
    }

    setIsSubmitting(true)
    const payload: CreateRackInput = {
      id: mode === 'create' ? id.trim() || undefined : undefined,
      zoneId: currentZone.id,
      name: trimmedName,
      capacity: parsedCapacity,
      levels: parsedLevels ?? 3,
    }

    const res = onSubmit(payload)
    if (!res.ok) {
      setError(res.message ?? 'An error occurred.')
      setIsSubmitting(false)
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            {mode === 'create'
              ? 'Add Bin/Pallet Rack'
              : `Edit ${initialRack?.name}`}
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
          Parent zone:{' '}
          <strong className="text-text-primary">
            {currentZone.name} ({currentZone.id})
          </strong>
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
          <TextInput
            disabled={mode === 'edit'}
            label={
              mode === 'create'
                ? 'Rack Identifier (optional)'
                : 'Rack Identifier (Immutable)'
            }
            onChange={(e) => {
              setError(null)
              setId(e.target.value)
            }}
            placeholder="e.g. rck-mum-a1 or leave blank to auto-generate"
            value={id}
          />

          <TextInput
            label="Rack Label / Description *"
            onChange={(e) => {
              setError(null)
              setName(e.target.value)
            }}
            placeholder="e.g. Rack A1 - Heavy Pallets"
            required
            value={name}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Shelf Levels (Tiers)"
              min={1}
              onChange={(e) => {
                setError(null)
                setLevels(e.target.value)
              }}
              placeholder="3"
              type="number"
              value={levels}
            />

            <TextInput
              label="Rated Unit Capacity (Optional)"
              min={1}
              onChange={(e) => {
                setError(null)
                setCapacity(e.target.value)
              }}
              placeholder="e.g. 120"
              type="number"
              value={capacity}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-3/80">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {mode === 'create' ? 'Add rack' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 4. Deactivate Warehouse Confirmation Dialog (With Protection)
// -----------------------------------------------------------------------------

function DeactivateWarehouseConfirmDialog({
  warehouse,
  activeZonesCount,
  assignedProductsCount,
  onConfirm,
  onCancel,
}: {
  warehouse: Warehouse
  activeZonesCount: number
  assignedProductsCount: number
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

  const hasBlockers = activeZonesCount > 0 || assignedProductsCount > 0

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-danger">
          <AlertTriangle size={22} />
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Deactivate {warehouse.name}?
          </h2>
        </div>

        {hasBlockers ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
              <strong className="block font-semibold">
                Operation Blocked: Active Dependencies Detected
              </strong>
              <p className="mt-1 leading-relaxed">
                To prevent accidental loss and protect inventory consistency,
                this facility cannot be deactivated while it contains active
                dependent records:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {activeZonesCount > 0 && (
                  <li>
                    <strong>{activeZonesCount} active zone(s)</strong> must be
                    deactivated first.
                  </li>
                )}
                {assignedProductsCount > 0 && (
                  <li>
                    <strong>{assignedProductsCount} product record(s)</strong>{' '}
                    are currently assigned to this facility in inventory. Please
                    reassign or clear stock first.
                  </li>
                )}
              </ul>
            </div>
            <p className="text-xs text-text-muted">
              Deactivating a facility does not delete records, but requires
              prior deactivation of its components.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to mark{' '}
              <strong className="text-text-primary">{warehouse.name}</strong> as
              inactive?
            </p>
            <p className="text-xs text-text-muted">
              No active zones or stock items are currently associated with this
              warehouse. You can reactivate this warehouse at any time.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-3/80">
          <Button onClick={onCancel} type="button" variant="ghost">
            {hasBlockers ? 'Close' : 'Keep active'}
          </Button>
          {!hasBlockers && (
            <Button
              className="bg-danger hover:bg-danger/90 text-white"
              onClick={onConfirm}
              type="button"
            >
              Confirm deactivation
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 5. Deactivate Zone Confirmation Dialog (With Protection)
// -----------------------------------------------------------------------------

function DeactivateZoneConfirmDialog({
  zone,
  activeRacksCount,
  assignedProductsCount,
  onConfirm,
  onCancel,
}: {
  zone: WarehouseZone
  activeRacksCount: number
  assignedProductsCount: number
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

  const hasBlockers = activeRacksCount > 0 || assignedProductsCount > 0

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-danger">
          <AlertTriangle size={22} />
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Deactivate Zone {zone.name}?
          </h2>
        </div>

        {hasBlockers ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
              <strong className="block font-semibold">
                Operation Blocked: Active Dependencies Detected
              </strong>
              <p className="mt-1 leading-relaxed">
                This zone cannot be deactivated while it contains active
                dependent records:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {activeRacksCount > 0 && (
                  <li>
                    <strong>{activeRacksCount} active rack(s)</strong> must be
                    deactivated first.
                  </li>
                )}
                {assignedProductsCount > 0 && (
                  <li>
                    <strong>{assignedProductsCount} product record(s)</strong>{' '}
                    are assigned to this zone in inventory.
                  </li>
                )}
              </ul>
            </div>
            <p className="text-xs text-text-muted">
              Deactivating a zone protects your racks and stock from accidental
              loss.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to mark{' '}
              <strong className="text-text-primary">{zone.name}</strong> as
              inactive?
            </p>
            <p className="text-xs text-text-muted">
              You can reactivate this zone at any time when needed.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-3/80">
          <Button onClick={onCancel} type="button" variant="ghost">
            {hasBlockers ? 'Close' : 'Keep active'}
          </Button>
          {!hasBlockers && (
            <Button
              className="bg-danger hover:bg-danger/90 text-white"
              onClick={onConfirm}
              type="button"
            >
              Confirm deactivation
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 6. Deactivate Rack Confirmation Dialog
// -----------------------------------------------------------------------------

function DeactivateRackConfirmDialog({
  rack,
  assignedProductsCount,
  onConfirm,
  onCancel,
}: {
  rack: WarehouseRack
  assignedProductsCount: number
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

  const hasBlockers = assignedProductsCount > 0

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-danger">
          <AlertTriangle size={22} />
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Deactivate Rack {rack.name}?
          </h2>
        </div>

        {hasBlockers ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
              <strong className="block font-semibold">
                Operation Blocked: Stock Items Present
              </strong>
              <p className="mt-1 leading-relaxed">
                This rack cannot be deactivated because it currently has{' '}
                <strong>
                  {assignedProductsCount} active product record(s)
                </strong>{' '}
                stored on its tiers. Please reassign items in Inventory first.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-text-secondary leading-relaxed">
              Are you sure you want to mark{' '}
              <strong className="text-text-primary">{rack.name}</strong> as
              inactive?
            </p>
            <p className="text-xs text-text-muted">
              You can reactivate this rack at any time.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-surface-3/80">
          <Button onClick={onCancel} type="button" variant="ghost">
            {hasBlockers ? 'Close' : 'Keep active'}
          </Button>
          {!hasBlockers && (
            <Button
              className="bg-danger hover:bg-danger/90 text-white"
              onClick={onConfirm}
              type="button"
            >
              Confirm deactivation
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 7. Warehouse Details Drawer
// -----------------------------------------------------------------------------

function WarehouseDetailsDrawer({
  warehouse,
  zones,
  products,
  onClose,
  onEdit,
  onDeactivate,
  onExploreZones,
}: {
  warehouse: Warehouse
  zones: WarehouseZone[]
  products: Product[]
  onClose: () => void
  onEdit: (w: Warehouse) => void
  onDeactivate: (w: Warehouse) => void
  onExploreZones: (w: Warehouse) => void
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
            <WarehouseIcon className="text-primary" size={20} />
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Warehouse Profile
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

        {/* Facility Overview */}
        <div className="mt-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-text-primary">
                {warehouse.name}
              </h3>
              <div className="font-mono text-xs text-text-muted mt-0.5">
                ID: {warehouse.id}
              </div>
            </div>
            <StatusBadge
              tone={warehouse.status === 'Active' ? 'success' : 'neutral'}
            >
              {warehouse.status ?? 'Active'}
            </StatusBadge>
          </div>

          {/* Location info */}
          <div className="rounded-xl border border-surface-3 bg-sidebar p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <MapPin className="text-text-muted shrink-0" size={14} />
              <span>
                {[
                  warehouse.address,
                  warehouse.city,
                  warehouse.state,
                  warehouse.postalCode,
                  warehouse.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
            {warehouse.capacitySqFt && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Building2 className="text-text-muted shrink-0" size={14} />
                <span>
                  Floor Area: {warehouse.capacitySqFt.toLocaleString()} sq ft
                </span>
              </div>
            )}
            {warehouse.createdAt && (
              <div className="text-text-muted pt-1 border-t border-surface-3/60">
                Created: {formatDate(warehouse.createdAt)}
              </div>
            )}
          </div>

          {/* Zones Summary */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-text-secondary mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Layers size={14} />
                Storage Zones ({zones.length})
              </span>
              <button
                className="text-primary hover:underline cursor-pointer"
                onClick={() => onExploreZones(warehouse)}
              >
                Manage all
              </button>
            </div>
            {zones.length > 0 ? (
              <div className="space-y-2">
                {zones.slice(0, 4).map((zone) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-surface-3 bg-sidebar/60 p-2.5 text-xs"
                    key={zone.id}
                  >
                    <div>
                      <span className="font-medium text-text-primary">
                        {zone.name}
                      </span>
                      <span className="ml-2 font-mono text-[11px] text-text-muted">
                        ({zone.id})
                      </span>
                    </div>
                    <span className="rounded bg-surface-3 px-2 py-0.5 text-[11px] text-text-secondary">
                      {zone.type ?? 'Storage'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">
                No zones created in this facility yet.
              </p>
            )}
          </div>

          {/* Live Inventory Products */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-text-secondary mb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Boxes size={14} />
                Assigned Inventory ({products.length} SKUs)
              </span>
            </div>
            {products.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {products.map((product) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-surface-3 bg-sidebar/60 p-2.5 text-xs"
                    key={product.id}
                  >
                    <div>
                      <div className="font-medium text-text-primary">
                        {product.name}
                      </div>
                      <div className="font-mono text-[11px] text-text-muted">
                        {product.sku}
                      </div>
                    </div>
                    <div className="font-mono text-text-primary">
                      {product.stock}{' '}
                      <span className="text-[11px] text-text-muted">
                        in stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">
                No active inventory products mapped to this facility.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-6 border-t border-surface-3/80 flex flex-col gap-2">
          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={() => onExploreZones(warehouse)}
            variant="primary"
          >
            <Layers size={15} />
            Explore Zones & Racks
          </Button>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => onEdit(warehouse)}
              variant="secondary"
            >
              Edit Facility
            </Button>
            {warehouse.status === 'Active' && (
              <Button
                className="flex-1 text-danger hover:bg-danger/10"
                onClick={() => onDeactivate(warehouse)}
                variant="ghost"
              >
                Deactivate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
