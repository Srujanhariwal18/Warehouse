import {
  Boxes,
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  Table as TableIcon,
  Warehouse as WarehouseIcon,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Warehouse3DCanvas } from './Warehouse3DCanvas'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatInr } from '@/lib/formatters'
import type { Product, Warehouse } from '@/mocks/inventoryData'
import type { WarehouseRack, WarehouseZone } from '@/mocks/warehouseData'

export type VisualizationMode = 'isometric' | 'topdown' | 'elevation'
export type HeatmapMetric = 'occupancy' | 'type' | 'valuation'

type Props = {
  activeWarehouse: Warehouse
  zones: WarehouseZone[]
  racks: WarehouseRack[]
  products: Product[]
  className?: string
  onSelectZone?: (zoneId: string) => void
  facilities?: Warehouse[]
  selectedFacilityId?: string
  onSelectFacility?: (id: string) => void
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

export function WarehouseIsometricVisualizer({
  activeWarehouse,
  className = '',
  facilities,
  onSelectFacility,
  onSelectZone,
  products,
  racks,
  selectedFacilityId,
  zones,
}: Props) {
  const [viewMode, setViewMode] = useState<VisualizationMode>('isometric')
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('occupancy')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null)
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0)
  const [showTableView, setShowTableView] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isHudExpanded, setIsHudExpanded] = useState<boolean>(false)
  const [webGLAvailable] = useState<boolean>(() =>
    typeof window !== 'undefined' ? checkWebGLSupport() : true,
  )

  const [prevWarehouseId, setPrevWarehouseId] = useState(activeWarehouse.id)
  if (prevWarehouseId !== activeWarehouse.id) {
    setPrevWarehouseId(activeWarehouse.id)
    setSelectedZoneId(null)
    setSelectedRackId(null)
    setHoveredZoneId(null)
  }

  // Filter zones & racks strictly for active warehouse
  const facilityZones = useMemo(
    () => zones.filter((z) => z.warehouseId === activeWarehouse.id),
    [zones, activeWarehouse.id],
  )

  const facilityRacks = useMemo(
    () => racks.filter((r) => r.warehouseId === activeWarehouse.id),
    [racks, activeWarehouse.id],
  )

  // Assigned products in this warehouse
  const facilityProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        p.warehouseStock &&
        p.warehouseStock[activeWarehouse.id] !== undefined
      ) {
        return p.warehouseStock[activeWarehouse.id] > 0
      }
      return p.warehouseId === activeWarehouse.id
    })
  }, [products, activeWarehouse.id])

  // Total facility stock units and valuation
  const facilityStockUnits = useMemo(() => {
    return facilityProducts.reduce((sum, p) => {
      const stock =
        p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined
          ? p.warehouseStock[activeWarehouse.id]
          : p.warehouseId === activeWarehouse.id
            ? p.stock
            : 0
      return sum + stock
    }, 0)
  }, [facilityProducts, activeWarehouse.id])

  const facilityValuation = useMemo(() => {
    return facilityProducts.reduce((sum, p) => {
      const stock =
        p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined
          ? p.warehouseStock[activeWarehouse.id]
          : p.warehouseId === activeWarehouse.id
            ? p.stock
            : 0
      return sum + stock * p.price
    }, 0)
  }, [facilityProducts, activeWarehouse.id])

  // Map of rackId -> parent zoneId for active facility
  const rackToZoneMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of facilityRacks) {
      map.set(r.id, r.zoneId)
    }
    return map
  }, [facilityRacks])

  const facilityZoneIds = useMemo(() => {
    return new Set(facilityZones.map((z) => z.id))
  }, [facilityZones])

  // Partition products strictly into distinct zone buckets and an unassigned bucket
  const {
    productsByZone,
    unassignedProducts,
    unassignedUnits,
    unassignedValuation,
  } = useMemo(() => {
    const byZone = new Map<string, Product[]>()
    const unassigned: Product[] = []

    for (const p of facilityProducts) {
      let targetZoneId: string | undefined
      if (p.rackId && rackToZoneMap.has(p.rackId)) {
        targetZoneId = rackToZoneMap.get(p.rackId)
      } else if (p.zoneId && facilityZoneIds.has(p.zoneId)) {
        targetZoneId = p.zoneId
      }

      if (targetZoneId && facilityZoneIds.has(targetZoneId)) {
        const list = byZone.get(targetZoneId) ?? []
        list.push(p)
        byZone.set(targetZoneId, list)
      } else {
        unassigned.push(p)
      }
    }

    const unassignedUnits = unassigned.reduce((sum, p) => {
      const stock =
        p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined
          ? p.warehouseStock[activeWarehouse.id]
          : p.warehouseId === activeWarehouse.id
            ? p.stock
            : 0
      return sum + stock
    }, 0)

    const unassignedValuation = unassigned.reduce((sum, p) => {
      const stock =
        p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined
          ? p.warehouseStock[activeWarehouse.id]
          : p.warehouseId === activeWarehouse.id
            ? p.stock
            : 0
      return sum + stock * p.price
    }, 0)

    return {
      productsByZone: byZone,
      unassignedProducts: unassigned,
      unassignedUnits,
      unassignedValuation,
    }
  }, [facilityProducts, facilityZoneIds, rackToZoneMap, activeWarehouse.id])

  // Total capacity across all configured facility racks
  const totalFacilityCapacity = useMemo(() => {
    return facilityRacks.reduce((sum, r) => sum + (r.capacity ?? 0), 0)
  }, [facilityRacks])

  const facilityOverallOccupancy = useMemo(() => {
    if (totalFacilityCapacity <= 0) return 0
    return Math.min(
      100,
      Math.max(
        0,
        Math.round((facilityStockUnits / totalFacilityCapacity) * 100),
      ),
    )
  }, [facilityStockUnits, totalFacilityCapacity])

  // Compute exact metrics per zone from partitioned products and actual rack capacities
  const zoneStats = useMemo(() => {
    return facilityZones.map((zone, index) => {
      const zoneRacks = facilityRacks.filter((r) => r.zoneId === zone.id)
      const totalRackCapacity = zoneRacks.reduce(
        (sum, r) => sum + (r.capacity ?? 0),
        0,
      )

      // Direct products assigned strictly to this zone
      const zoneAssignedProducts = productsByZone.get(zone.id) ?? []

      // Exact units stored in this zone
      const actualUnits = zoneAssignedProducts.reduce((sum, p) => {
        const stock =
          p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined
            ? p.warehouseStock[activeWarehouse.id]
            : p.warehouseId === activeWarehouse.id
              ? p.stock
              : 0
        return sum + stock
      }, 0)

      // Exact valuation stored in this zone
      const actualValuation = zoneAssignedProducts.reduce((sum, p) => {
        const stock =
          p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined
            ? p.warehouseStock[activeWarehouse.id]
            : p.warehouseId === activeWarehouse.id
              ? p.stock
              : 0
        return sum + stock * p.price
      }, 0)

      // Exact physical occupancy proxy percentage
      const occupancyPct =
        totalRackCapacity > 0
          ? Math.min(
              100,
              Math.max(0, Math.round((actualUnits / totalRackCapacity) * 100)),
            )
          : 0

      return {
        ...zone,
        gridIndex: index,
        racks: zoneRacks,
        rackCount: zoneRacks.length,
        totalCapacity: totalRackCapacity,
        assignedSkus: zoneAssignedProducts.length,
        actualUnits,
        actualValuation,
        occupancyPct,
        estimatedUnits: actualUnits,
        estimatedValuation: actualValuation,
        zoneAssignedProducts,
      }
    })
  }, [facilityZones, facilityRacks, productsByZone, activeWarehouse.id])

  // Selected or hovered active zone telemetry (null if none selected or hovered)
  const activeZone = useMemo(() => {
    const targetId = selectedZoneId || hoveredZoneId
    if (!targetId) return null
    return zoneStats.find((z) => z.id === targetId) || null
  }, [zoneStats, selectedZoneId, hoveredZoneId])

  const activeRack = useMemo(() => {
    if (!selectedRackId) return null
    return facilityRacks.find((r) => r.id === selectedRackId) || null
  }, [facilityRacks, selectedRackId])

  const activeRackParentZone = useMemo(() => {
    if (!activeRack) return null
    return zoneStats.find((z) => z.id === activeRack.zoneId) || null
  }, [activeRack, zoneStats])

  // Active entity details: specific rack if selected, otherwise selected/hovered zone
  const activeEntity = useMemo(() => {
    if (activeRack) {
      const rackProds = facilityProducts.filter(
        (p) => p.rackId === activeRack.id,
      )
      const units = rackProds.reduce((sum, p) => {
        const stock =
          p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined
            ? p.warehouseStock[activeWarehouse.id]
            : p.warehouseId === activeWarehouse.id
              ? p.stock
              : 0
        return sum + stock
      }, 0)
      const valuation = rackProds.reduce((sum, p) => {
        const stock =
          p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined
            ? p.warehouseStock[activeWarehouse.id]
            : p.warehouseId === activeWarehouse.id
              ? p.stock
              : 0
        return sum + stock * p.price
      }, 0)
      const capacity = activeRack.capacity ?? 50
      const occupancyPct =
        capacity > 0
          ? Math.min(100, Math.max(0, Math.round((units / capacity) * 100)))
          : 0

      return {
        isRack: true,
        id: activeRack.id,
        name: activeRack.name,
        typeLabel: `${activeRack.levels ?? 4} High-Bay Tiers`,
        parentName:
          activeRackParentZone?.name ??
          (activeRack.zoneId
            ? `Zone ${activeRack.zoneId}`
            : 'Independent Rack (Unassigned Zone)'),
        parentZone: activeRackParentZone,
        status: activeRack.status,
        capacity,
        units,
        valuation,
        occupancyPct,
        products: rackProds,
      }
    }

    if (activeZone) {
      return {
        isRack: false,
        id: activeZone.id,
        name: activeZone.name,
        typeLabel: activeZone.type,
        parentName: activeWarehouse.name,
        parentZone: activeZone,
        status: activeZone.status,
        capacity: activeZone.totalCapacity,
        units: activeZone.actualUnits,
        valuation: activeZone.actualValuation,
        occupancyPct: activeZone.occupancyPct,
        products: activeZone.zoneAssignedProducts ?? [],
      }
    }

    return null
  }, [
    activeRack,
    activeRackParentZone,
    activeZone,
    facilityProducts,
    activeWarehouse.id,
    activeWarehouse.name,
  ])

  return (
    <div
      className={`rounded-xl border border-surface-border bg-white shadow-sm relative flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-main' : ''
      } ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border bg-surface-secondary/80 px-4 py-3">
        {/* Left: Facility identity & Hub Switcher Pills */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-surface-blue text-primary">
            <WarehouseIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-text-primary">
                {activeWarehouse.name}
              </span>
              <span className="font-mono text-xs text-text-muted">
                [{activeWarehouse.id}]
              </span>
              <StatusBadge size="sm" tone="success">
                {activeWarehouse.status ?? 'Active'}
              </StatusBadge>

              {facilities && onSelectFacility && (
                <div className="ml-2 hidden sm:flex items-center gap-1 rounded-lg border border-surface-border bg-white p-0.5 shadow-2xs">
                  {facilities.map((fac) => (
                    <button
                      className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
                        (selectedFacilityId ?? activeWarehouse.id) === fac.id
                          ? 'bg-surface-blue text-primary font-semibold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                      key={fac.id}
                      onClick={() => onSelectFacility(fac.id)}
                      type="button"
                    >
                      {fac.city}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="font-mono text-[10px] text-text-muted">
              ARCHITECTURAL DIGITAL TWIN // LIVE 3D TELEMETRY
            </p>
          </div>
        </div>

        {/* Right: Working View Modes, Heatmap Filters & Camera Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Heatmap Metric Selector */}
          <div className="flex items-center rounded-lg border border-surface-border bg-white p-0.5 text-xs shadow-2xs">
            <button
              className={`rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
                heatmapMetric === 'occupancy'
                  ? 'bg-surface-blue text-primary font-semibold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setHeatmapMetric('occupancy')}
              title="Visualize rack fill percentage from live stock"
              type="button"
            >
              Occupancy
            </button>
            <button
              className={`rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
                heatmapMetric === 'type'
                  ? 'bg-surface-blue text-primary font-semibold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setHeatmapMetric('type')}
              title="Color code by zone operational function"
              type="button"
            >
              <span className="sm:hidden">Function</span>
              <span className="hidden sm:inline">Zone Function</span>
            </button>
            <button
              className={`rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
                heatmapMetric === 'valuation'
                  ? 'bg-surface-blue text-primary font-semibold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setHeatmapMetric('valuation')}
              title="Color code by inventory asset value"
              type="button"
            >
              Valuation
            </button>
          </div>

          {/* View Modes Selector */}
          <div className="flex items-center rounded-lg border border-surface-border bg-white p-0.5 text-xs shadow-2xs">
            <button
              className={`rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
                viewMode === 'isometric'
                  ? 'bg-surface-cyan text-secondary font-semibold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setViewMode('isometric')}
              title="Interactive 3D Perspective Warehouse"
              type="button"
            >
              3D Iso
            </button>
            <button
              className={`rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
                viewMode === 'topdown'
                  ? 'bg-surface-cyan text-secondary font-semibold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setViewMode('topdown')}
              title="Top-down 2D floor plan view"
              type="button"
            >
              2D Plan
            </button>
            <button
              className={`rounded px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium transition-colors ${
                viewMode === 'elevation'
                  ? 'bg-surface-cyan text-secondary font-semibold shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setViewMode('elevation')}
              title="Side elevation rack cutaway view"
              type="button"
            >
              Elevation
            </button>
          </div>

          {/* Toolbar Utilities */}
          <div className="flex items-center gap-1">
            <button
              aria-label="Toggle Data Table View"
              className={`rounded-lg border p-1.5 transition-colors shadow-2xs ${
                showTableView
                  ? 'border-primary/40 bg-surface-blue text-primary'
                  : 'border-surface-border bg-white text-text-muted hover:border-surface-3 hover:text-text-primary'
              }`}
              onClick={() => setShowTableView((v) => !v)}
              title="Toggle zone audit table"
              type="button"
            >
              <TableIcon size={14} />
            </button>

            <button
              aria-label="Reset Camera Position"
              className="rounded-lg border border-surface-border bg-white p-1.5 text-text-muted hover:border-surface-3 hover:text-text-primary transition-colors shadow-2xs"
              onClick={() => {
                setCameraResetTrigger((c) => c + 1)
                setSelectedZoneId(null)
                setSelectedRackId(null)
              }}
              title="Reset 3D camera to default orientation"
              type="button"
            >
              <RotateCw size={14} />
            </button>

            <button
              aria-label="Toggle Fullscreen"
              className="rounded-lg border border-surface-border bg-white p-1.5 text-text-muted hover:border-surface-3 hover:text-text-primary transition-colors hidden sm:block shadow-2xs"
              onClick={() => setIsFullscreen((f) => !f)}
              title={isFullscreen ? 'Exit fullscreen' : 'Expand full view'}
              type="button"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive 3D Canvas Stage */}
      <div className="relative w-full flex-1 min-h-[480px] bg-[#0A0E15]">
        {webGLAvailable ? (
          <Warehouse3DCanvas
            activeWarehouse={activeWarehouse}
            cameraResetTrigger={cameraResetTrigger}
            heatmapMetric={heatmapMetric}
            hoveredZoneId={hoveredZoneId}
            onHoverZone={setHoveredZoneId}
            onSelectRack={setSelectedRackId}
            onSelectZone={(zid) => {
              setSelectedZoneId(zid)
              if (zid) onSelectZone?.(zid)
            }}
            products={products}
            racks={racks}
            selectedRackId={selectedRackId}
            selectedZoneId={selectedZoneId}
            viewMode={viewMode}
            zones={zoneStats}
          />
        ) : (
          /* WebGL Graceful Fallback Mode */
          <div className="p-8 text-center flex flex-col items-center justify-center h-full space-y-3">
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle size={20} />
              <span className="text-sm font-semibold">
                WebGL acceleration disabled — running in 2D Architectural
                Schematic Mode
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-4">
              {zoneStats.map((z) => (
                <div
                  className="rounded-xl border border-surface-border bg-surface-2 p-4 text-left"
                  key={z.id}
                >
                  <span className="font-mono text-xs text-primary">{z.id}</span>
                  <p className="font-semibold text-text-primary">{z.name}</p>
                  <p className="text-xs text-text-muted">
                    {z.actualUnits} Units • {z.occupancyPct}% Occupancy
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Indicator Overlay */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-surface-border bg-white/95 px-2.5 py-1 text-[11px] font-mono text-text-secondary backdrop-blur-md shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
          <span className="font-medium text-text-primary">
            {viewMode === 'isometric'
              ? '3D PERSPECTIVE'
              : viewMode === 'topdown'
                ? '2D FLOOR PLAN'
                : 'ELEVATION PROFILE'}
          </span>
          <span className="text-surface-border hidden sm:inline">|</span>
          <span className="text-text-muted text-[10px] hidden sm:inline">
            Drag to Rotate • Scroll to Zoom
          </span>
        </div>

        {/* Floating HUD Guidance Hint (when no entity is active) */}
        {!activeEntity && (
          <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 rounded-lg border border-surface-border/80 bg-white/90 px-3 py-1.5 text-[11px] font-mono text-text-muted backdrop-blur-md shadow-xs pointer-events-none">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary/80 shrink-0" />
            <span>
              Click any zone badge or rack structure to inspect live inventory
              telemetry
            </span>
          </div>
        )}

        {/* Floating HUD Telemetry Card (Active Zone / Rack Details) */}
        {activeEntity && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-96 rounded-xl border border-surface-border bg-white/95 p-3 sm:p-4 shadow-xl shadow-slate-900/10 backdrop-blur-md z-20 transition-all duration-200">
            <div className="flex items-start justify-between gap-2 border-b border-surface-border pb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      activeEntity.isRack
                        ? 'bg-secondary shadow-[0_0_8px_rgba(8,145,178,0.4)]'
                        : 'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                    }`}
                  />
                  <span className="font-semibold text-xs text-text-primary truncate">
                    {activeEntity.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-text-muted truncate">
                  <span>ID: {activeEntity.id}</span>
                  <span>•</span>
                  <span>{activeEntity.typeLabel}</span>
                  {activeEntity.isRack && (
                    <>
                      <span>•</span>
                      <span
                        className="truncate max-w-[120px]"
                        title={activeEntity.parentName}
                      >
                        {activeEntity.parentName}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge
                  size="sm"
                  tone={
                    activeEntity.status === 'Active' ? 'success' : 'neutral'
                  }
                >
                  {activeEntity.status}
                </StatusBadge>
                {/* Mobile Expand / Collapse toggle */}
                <button
                  aria-label={isHudExpanded ? 'Collapse HUD' : 'Expand HUD'}
                  className="sm:hidden p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  onClick={() => setIsHudExpanded((v) => !v)}
                  title={isHudExpanded ? 'Show less' : 'Show details'}
                  type="button"
                >
                  {isHudExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronUp size={14} />
                  )}
                </button>
                {(selectedZoneId || selectedRackId || hoveredZoneId) && (
                  <button
                    aria-label="Deselect"
                    className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                    onClick={() => {
                      setSelectedZoneId(null)
                      setSelectedRackId(null)
                      setHoveredZoneId(null)
                    }}
                    title="Clear selection"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Compact 1-liner when collapsed */}
            <div
              className={`mt-2 flex items-center justify-between text-[11px] font-mono sm:hidden ${isHudExpanded ? 'hidden' : 'flex'}`}
            >
              <span className="text-text-secondary">
                <strong className="text-text-primary">
                  {activeEntity.units}
                </strong>{' '}
                Units ({activeEntity.capacity} plts)
              </span>
              <span
                className={`font-bold ${
                  activeEntity.occupancyPct >= 75
                    ? 'text-emerald-600'
                    : activeEntity.occupancyPct >= 35
                      ? 'text-primary'
                      : activeEntity.occupancyPct > 0
                        ? 'text-amber-600'
                        : 'text-rose-600'
                }`}
              >
                {activeEntity.occupancyPct}% Fill
              </span>
            </div>

            {/* Entity Metrics Grid & SKU Details (always visible on sm:, toggleable on mobile) */}
            <div className={`${isHudExpanded ? 'block' : 'hidden sm:block'}`}>
              {/* Entity Metrics Grid */}
              <div className="mt-2.5 grid grid-cols-4 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-[10px] text-text-muted block">
                    UNITS
                  </span>
                  <span className="font-bold text-text-primary">
                    {activeEntity.units}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">
                    CAPACITY
                  </span>
                  <span className="font-bold text-text-primary">
                    {activeEntity.capacity} plts
                  </span>
                </div>
                <div>
                  <span
                    className="text-[10px] text-text-muted block truncate"
                    title="Rated slot capacity proxy utilization (0-100%)"
                  >
                    OCCUPANCY
                  </span>
                  <span
                    className={`font-bold ${
                      activeEntity.occupancyPct >= 75
                        ? 'text-emerald-600'
                        : activeEntity.occupancyPct >= 35
                          ? 'text-primary'
                          : activeEntity.occupancyPct > 0
                            ? 'text-amber-600'
                            : 'text-rose-600'
                    }`}
                  >
                    {activeEntity.occupancyPct}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">
                    VALUATION
                  </span>
                  <span className="font-bold text-primary">
                    {formatInr(activeEntity.valuation)}
                  </span>
                </div>
              </div>

              {/* Associated Product Inventory List */}
              <div className="mt-3 pt-2.5 border-t border-surface-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold text-text-secondary uppercase tracking-wider">
                    Assigned Inventory ({activeEntity.products.length} SKUs)
                  </span>
                  {unassignedProducts.length > 0 && (
                    <button
                      className="text-[10px] font-mono text-warning hover:underline"
                      onClick={() => setShowTableView(true)}
                      type="button"
                    >
                      {unassignedProducts.length} unassigned
                    </button>
                  )}
                </div>

                {activeEntity.products.length === 0 ? (
                  <div className="py-2 px-2.5 rounded-lg bg-surface-secondary/70 border border-surface-border text-center">
                    <span className="font-mono text-[11px] text-text-muted block">
                      {activeEntity.isRack
                        ? 'Empty Rack — No stock assigned'
                        : 'Empty Zone — No products stored'}
                    </span>
                  </div>
                ) : (
                  <div className="max-h-24 sm:max-h-28 overflow-y-auto divide-y divide-surface-border/50 rounded-lg border border-surface-border bg-surface-secondary/40 px-2 py-1">
                    {activeEntity.products.map((p) => {
                      const stock =
                        p.warehouseStock &&
                        p.warehouseStock[activeWarehouse.id] !== undefined
                          ? p.warehouseStock[activeWarehouse.id]
                          : p.warehouseId === activeWarehouse.id
                            ? p.stock
                            : 0
                      return (
                        <div
                          className="py-1 flex items-center justify-between text-[11px]"
                          key={p.id}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <span className="font-mono text-[10px] text-primary font-semibold shrink-0">
                              {p.sku}
                            </span>
                            <span
                              className="truncate text-text-primary text-[11px]"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                          </div>
                          <div className="font-mono text-[10px] shrink-0 text-right">
                            <span className="font-bold text-text-primary">
                              {stock}
                            </span>
                            <span className="text-text-muted ml-0.5">u</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Quick action link to Warehouses Page */}
              <div className="mt-2.5 pt-2 border-t border-surface-border flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1 font-mono text-[10px]">
                  <Boxes className="text-secondary" size={12} />
                  <span>
                    {activeEntity.parentZone
                      ? `${activeEntity.parentZone.rackCount ?? facilityRacks.filter((r) => r.zoneId === activeEntity.parentZone?.id).length} Racks in Zone`
                      : `${facilityRacks.length} Facility Racks`}
                  </span>
                </span>
                <Link
                  className="text-primary hover:underline font-medium flex items-center gap-1 text-[11px]"
                  to="/app/warehouses"
                >
                  <span>Manage Facility Racks</span>
                  <Sparkles size={11} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Reconciled Metric Strip */}
      <div className="grid grid-cols-2 divide-x divide-surface-border border-t border-surface-border bg-surface-secondary/60 sm:grid-cols-4 text-xs">
        <div className="p-3">
          <span className="text-[10px] font-mono text-text-muted block">
            FACILITY FOOTPRINT
          </span>
          <span className="font-semibold text-text-primary text-xs sm:text-sm">
            {(activeWarehouse.capacitySqFt ?? 75000).toLocaleString('en-IN')} sq
            ft
          </span>
        </div>
        <div className="p-3">
          <span className="text-[10px] font-mono text-text-muted block">
            ZONE UTILIZATION
          </span>
          <span className="font-mono font-bold text-primary text-xs sm:text-sm">
            {facilityZones.filter((z) => z.status === 'Active').length} /{' '}
            {facilityZones.length} Active Zones
          </span>
        </div>
        <div className="p-3">
          <span className="text-[10px] font-mono text-text-muted block">
            FACILITY STOCK
          </span>
          <span className="font-semibold text-text-primary text-xs sm:text-sm">
            {facilityStockUnits.toLocaleString()} Units (
            {facilityProducts.length} SKUs)
          </span>
        </div>
        <div className="p-3">
          <span className="text-[10px] font-mono text-text-muted block">
            FACILITY VALUATION
          </span>
          <span className="font-mono font-bold text-text-primary text-xs sm:text-sm">
            {formatInr(facilityValuation)}
          </span>
        </div>
      </div>

      {/* 4. Table View Modal */}
      {showTableView && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
        >
          <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl border border-surface-border bg-white shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border px-6 py-4 bg-surface-secondary">
              <div className="flex items-center gap-2.5">
                <TableIcon className="text-primary" size={18} />
                <h3 className="font-display font-semibold text-text-primary text-base">
                  {activeWarehouse.name} — Zone & Rack Inventory Ledger
                </h3>
              </div>
              <button
                className="text-text-muted hover:text-text-primary text-xs rounded-lg p-1.5 border border-surface-border bg-white hover:bg-surface-2 transition-colors shadow-2xs"
                onClick={() => setShowTableView(false)}
                type="button"
              >
                Close (ESC)
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-text-muted font-mono text-[10px]">
                    <th className="py-2.5">ZONE ID</th>
                    <th className="py-2.5">ZONE NAME</th>
                    <th className="py-2.5">TYPE</th>
                    <th className="py-2.5 text-right pr-4">RACKS</th>
                    <th className="py-2.5 text-right pr-4">CAPACITY</th>
                    <th className="py-2.5 text-right pr-4">STOCK UNITS</th>
                    <th className="py-2.5 text-right pr-4">OCCUPANCY</th>
                    <th className="py-2.5 text-right">VALUATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {zoneStats.map((z) => (
                    <tr
                      className="hover:bg-surface-secondary/70 cursor-pointer transition-colors"
                      key={z.id}
                      onClick={() => {
                        setSelectedZoneId(z.id)
                        onSelectZone?.(z.id)
                        setShowTableView(false)
                      }}
                    >
                      <td className="py-3 font-mono text-[11px] text-primary font-semibold">
                        {z.id}
                      </td>
                      <td className="py-3 font-medium text-text-primary">
                        {z.name}
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-surface-secondary px-2 py-0.5 font-mono text-[10px] text-text-secondary border border-surface-border">
                          {z.type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-text-secondary pr-4">
                        {z.rackCount}
                      </td>
                      <td className="py-3 text-right font-mono text-text-secondary pr-4">
                        {z.totalCapacity} plts
                      </td>
                      <td className="py-3 text-right font-mono text-text-secondary pr-4">
                        {z.actualUnits}
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-text-primary pr-4">
                        {z.occupancyPct}%
                      </td>
                      <td className="py-3 text-right font-mono text-text-primary font-medium">
                        {formatInr(z.actualValuation)}
                      </td>
                    </tr>
                  ))}
                  {unassignedProducts.length > 0 && (
                    <tr className="bg-amber-50/40 border-t border-dashed border-amber-200 text-text-muted">
                      <td className="py-3 font-mono text-[11px] text-warning font-semibold">
                        [STAGING]
                      </td>
                      <td className="py-3 font-medium text-text-secondary">
                        Unassigned / Staging Buffer
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-[10px] text-warning border border-warning/30 font-semibold">
                          Staging
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-text-muted pr-4">
                        0
                      </td>
                      <td className="py-3 text-right font-mono text-text-muted pr-4">
                        --
                      </td>
                      <td className="py-3 text-right font-mono text-warning font-semibold pr-4">
                        {unassignedUnits}
                      </td>
                      <td className="py-3 text-right font-mono text-text-muted pr-4">
                        N/A
                      </td>
                      <td className="py-3 text-right font-mono text-text-secondary">
                        {formatInr(unassignedValuation)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-surface-border bg-surface-secondary/70 font-mono text-xs">
                  <tr>
                    <td
                      className="py-3 pl-1 font-bold text-text-primary"
                      colSpan={3}
                    >
                      FACILITY RECONCILED TOTAL
                    </td>
                    <td className="py-3 text-right font-bold text-text-secondary pr-4">
                      {facilityRacks.length}
                    </td>
                    <td className="py-3 text-right font-bold text-text-secondary pr-4">
                      {totalFacilityCapacity} plts
                    </td>
                    <td className="py-3 text-right font-bold text-primary pr-4">
                      {facilityStockUnits}
                    </td>
                    <td className="py-3 text-right font-bold text-text-primary pr-4">
                      {facilityOverallOccupancy}%
                    </td>
                    <td className="py-3 text-right font-bold text-primary">
                      {formatInr(facilityValuation)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
