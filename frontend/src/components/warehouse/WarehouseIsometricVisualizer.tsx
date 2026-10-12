import {
  Boxes,
  Layers,
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  Table as TableIcon,
  Warehouse as WarehouseIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
}

export function WarehouseIsometricVisualizer({
  activeWarehouse,
  className = '',
  onSelectZone,
  products,
  racks,
  zones,
}: Props) {
  const [viewMode, setViewMode] = useState<VisualizationMode>('isometric')
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('occupancy')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null)
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [rotationOffset, setRotationOffset] = useState<number>(0)
  const [showTableView, setShowTableView] = useState<boolean>(false)

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
      if (p.warehouseStock && p.warehouseStock[activeWarehouse.id] !== undefined) {
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

  // Compute exact metrics per zone from assigned products and actual rack capacities
  const zoneStats = useMemo(() => {
    return facilityZones.map((zone, index) => {
      const zoneRacks = facilityRacks.filter((r) => r.zoneId === zone.id)
      const zoneRackIds = new Set(zoneRacks.map((r) => r.id))
      const totalRackCapacity = zoneRacks.reduce(
        (sum, r) => sum + (r.capacity ?? 40),
        0,
      )

      // Direct products assigned to this zone or its racks
      const zoneAssignedProducts = facilityProducts.filter((p) => {
        if (p.zoneId === zone.id) return true
        if (p.rackId && zoneRackIds.has(p.rackId)) return true
        return false
      })

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

      // Exact physical occupancy percentage (units / total rack capacity)
      const occupancyPct =
        totalRackCapacity > 0
          ? Math.min(100, Math.round((actualUnits / totalRackCapacity) * 100))
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
        // Backward compatibility aliases
        estimatedUnits: actualUnits,
        estimatedValuation: actualValuation,
      }
    })
  }, [facilityZones, facilityRacks, facilityProducts, activeWarehouse.id])

  // Selected or hovered active zone telemetry
  const activeZone = useMemo(() => {
    const targetId = selectedZoneId || hoveredZoneId || facilityZones[0]?.id
    return zoneStats.find((z) => z.id === targetId) || zoneStats[0] || null
  }, [zoneStats, selectedZoneId, hoveredZoneId, facilityZones])

  const activeRack = useMemo(() => {
    if (!selectedRackId) return null
    return facilityRacks.find((r) => r.id === selectedRackId) || null
  }, [facilityRacks, selectedRackId])

  // Get zone color based on chosen heatmap metric
  function getZoneAccentColor(
    zone: (typeof zoneStats)[number],
    metric: HeatmapMetric,
  ) {
    if (metric === 'type') {
      switch (zone.type) {
        case 'Picking':
          return {
            fill: '#43D9E8',
            stroke: '#43D9E8',
            glow: 'rgba(67, 217, 232, 0.35)',
            text: 'text-primary',
          }
        case 'Cold Storage':
          return {
            fill: '#5AA9FF',
            stroke: '#5AA9FF',
            glow: 'rgba(90, 169, 255, 0.35)',
            text: 'text-secondary',
          }
        case 'Receiving':
          return {
            fill: '#F59E0B',
            stroke: '#F59E0B',
            glow: 'rgba(245, 158, 11, 0.35)',
            text: 'text-warning',
          }
        case 'Quarantine':
          return {
            fill: '#EF4444',
            stroke: '#EF4444',
            glow: 'rgba(239, 68, 68, 0.35)',
            text: 'text-danger',
          }
        case 'Packing':
          return {
            fill: '#8EA0B2',
            stroke: '#8EA0B2',
            glow: 'rgba(142, 160, 178, 0.35)',
            text: 'text-text-secondary',
          }
        default:
          return {
            fill: '#10B981',
            stroke: '#10B981',
            glow: 'rgba(16, 185, 129, 0.35)',
            text: 'text-emerald-400',
          }
      }
    }

    if (metric === 'valuation') {
      if (zone.actualValuation > 100000) {
        return {
          fill: '#43D9E8',
          stroke: '#43D9E8',
          glow: 'rgba(67, 217, 232, 0.4)',
          text: 'text-primary',
        }
      }
      if (zone.actualValuation > 40000) {
        return {
          fill: '#5AA9FF',
          stroke: '#5AA9FF',
          glow: 'rgba(90, 169, 255, 0.3)',
          text: 'text-secondary',
        }
      }
      return {
        fill: '#8EA0B2',
        stroke: '#8EA0B2',
        glow: 'rgba(142, 160, 178, 0.2)',
        text: 'text-text-secondary',
      }
    }

    // Default: occupancy
    if (zone.occupancyPct >= 85) {
      return {
        fill: '#EF4444',
        stroke: '#EF4444',
        glow: 'rgba(239, 68, 68, 0.4)',
        text: 'text-danger',
      }
    }
    if (zone.occupancyPct >= 70) {
      return {
        fill: '#F59E0B',
        stroke: '#F59E0B',
        glow: 'rgba(245, 158, 11, 0.35)',
        text: 'text-warning',
      }
    }
    if (zone.occupancyPct >= 40) {
      return {
        fill: '#43D9E8',
        stroke: '#43D9E8',
        glow: 'rgba(67, 217, 232, 0.35)',
        text: 'text-primary',
      }
    }
    return {
      fill: '#10B981',
      stroke: '#10B981',
      glow: 'rgba(16, 185, 129, 0.35)',
      text: 'text-emerald-400',
    }
  }

  return (
    <div
      className={`rounded-xl border border-surface-border bg-graphite flex flex-col overflow-hidden shadow-2xl shadow-black/70 ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border bg-surface/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
            <WarehouseIcon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold tracking-tight text-text-primary">
                {activeWarehouse.name}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                [{activeWarehouse.id}]
              </span>
              <StatusBadge
                size="sm"
                tone={activeWarehouse.status === 'Active' ? 'success' : 'neutral'}
              >
                {activeWarehouse.status}
              </StatusBadge>
            </div>
            <p className="font-mono text-[10px] text-text-muted mt-0.5">
              ARCHITECTURAL DIGITAL TWIN // LIVE SCHEMATIC
            </p>
          </div>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Heatmap metric switcher */}
          <div className="flex items-center rounded-lg border border-surface-border bg-graphite p-0.5 text-xs">
            <button
              className={`rounded px-2 py-1 font-medium transition-colors ${
                heatmapMetric === 'occupancy'
                  ? 'bg-surface text-primary border border-primary/30 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setHeatmapMetric('occupancy')}
              type="button"
            >
              Occupancy
            </button>
            <button
              className={`rounded px-2 py-1 font-medium transition-colors ${
                heatmapMetric === 'type'
                  ? 'bg-surface text-primary border border-primary/30 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setHeatmapMetric('type')}
              type="button"
            >
              Zone Function
            </button>
            <button
              className={`rounded px-2 py-1 font-medium transition-colors ${
                heatmapMetric === 'valuation'
                  ? 'bg-surface text-primary border border-primary/30 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setHeatmapMetric('valuation')}
              type="button"
            >
              Valuation
            </button>
          </div>

          {/* Perspective mode switcher */}
          <div className="flex items-center rounded-lg border border-surface-border bg-graphite p-0.5 text-xs">
            <button
              aria-label="3D Isometric perspective view"
              className={`rounded px-2 py-1 font-medium transition-colors ${
                viewMode === 'isometric' && !showTableView
                  ? 'bg-surface text-primary border border-primary/30 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => {
                setViewMode('isometric')
                setShowTableView(false)
              }}
              title="3D Isometric Projection"
              type="button"
            >
              3D Iso
            </button>
            <button
              aria-label="Tactical top down floorplan view"
              className={`rounded px-2 py-1 font-medium transition-colors ${
                viewMode === 'topdown' && !showTableView
                  ? 'bg-surface text-primary border border-primary/30 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => {
                setViewMode('topdown')
                setShowTableView(false)
              }}
              title="Top-Down Tactical Grid"
              type="button"
            >
              2D Plan
            </button>
            <button
              aria-label="Elevation cross-section rack view"
              className={`rounded px-2 py-1 font-medium transition-colors ${
                viewMode === 'elevation' && !showTableView
                  ? 'bg-surface text-primary border border-primary/30 shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => {
                setViewMode('elevation')
                setShowTableView(false)
              }}
              title="Vertical Elevation Tiers"
              type="button"
            >
              Elevation
            </button>
          </div>

          {/* Table fallback toggle */}
          <button
            aria-label="Toggle accessible tabular data"
            className={`rounded-lg border p-1.5 transition-colors ${
              showTableView
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-surface-border bg-graphite text-text-muted hover:text-text-primary'
            }`}
            onClick={() => setShowTableView((prev) => !prev)}
            title="Accessible Table Grid"
            type="button"
          >
            <TableIcon size={14} />
          </button>

          {/* Zoom & Reset */}
          {!showTableView && (
            <div className="flex items-center gap-1 border-l border-surface-border pl-2">
              <button
                aria-label="Zoom in"
                className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-primary"
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                title="Zoom In"
                type="button"
              >
                <Maximize2 size={13} />
              </button>
              <button
                aria-label="Zoom out"
                className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-primary"
                onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.1))}
                title="Zoom Out"
                type="button"
              >
                <Minimize2 size={13} />
              </button>
              <button
                aria-label="Rotate isometric angle"
                className="rounded p-1 text-text-muted hover:bg-surface hover:text-text-primary"
                onClick={() =>
                  setRotationOffset((r) => (r === 0 ? 15 : r === 15 ? -15 : 0))
                }
                title="Rotate Angle"
                type="button"
              >
                <RotateCw size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Visual Canvas Area */}
      <div className="relative min-h-[360px] sm:min-h-[420px] flex-1 bg-[#0B1017] p-3 sm:p-5 flex items-center justify-center overflow-hidden">
        {/* Subtle isometric floor blueprint guidelines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(67, 217, 232, 0.05), transparent 70%), linear-gradient(to right, rgba(90, 169, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(90, 169, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 32px 32px, 32px 32px',
          }}
        />

        {showTableView ? (
          /* Accessible Table Fallback */
          <div className="relative z-10 w-full h-full max-h-[380px] overflow-y-auto rounded-lg border border-surface-border bg-graphite p-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5 mb-3">
              <span className="font-mono text-xs font-semibold text-primary uppercase">
                Accessible Facility Ledger // {facilityZones.length} Zones // {facilityRacks.length} Racks
              </span>
              <span className="text-[11px] text-text-muted">
                {activeWarehouse.city} Logistics Node
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-text-muted font-mono text-[10px]">
                  <th className="py-2">ZONE ID</th>
                  <th className="py-2">DESIGNATION</th>
                  <th className="py-2">FUNCTION</th>
                  <th className="py-2 text-right pr-3">RACKS</th>
                  <th className="py-2 text-right pr-3">CAPACITY</th>
                  <th className="py-2 text-right pr-3">STOCK UNITS</th>
                  <th className="py-2 text-right pr-3">OCCUPANCY</th>
                  <th className="py-2 text-right">VALUATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {zoneStats.map((z) => (
                  <tr
                    key={z.id}
                    className="hover:bg-surface/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedZoneId(z.id)
                      onSelectZone?.(z.id)
                    }}
                  >
                    <td className="py-2.5 font-mono text-[11px] text-primary">
                      {z.id}
                    </td>
                    <td className="py-2.5 font-medium text-text-primary">
                      {z.name}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-secondary border border-surface-border">
                        {z.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-text-secondary pr-3">
                      {z.rackCount}
                    </td>
                    <td className="py-2.5 text-right font-mono text-text-secondary pr-3">
                      {z.totalCapacity} plts
                    </td>
                    <td className="py-2.5 text-right font-mono text-text-secondary pr-3">
                      {z.actualUnits}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-text-primary pr-3">
                      {z.occupancyPct}%
                    </td>
                    <td className="py-2.5 text-right font-mono text-text-primary">
                      {formatInr(z.actualValuation)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'elevation' ? (
          /* Elevation Cross-Section Cutaway View */
          <div
            className="relative z-10 w-full max-w-2xl py-4 transition-transform duration-300"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-mono text-primary font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} />
                <span>Multi-Tier Rack Elevation Cutaway</span>
              </span>
              <span className="text-[11px] text-text-muted font-mono">
                5 Standard High-Bay Tiers (T1 - T5)
              </span>
            </div>

            <div className="rounded-xl border border-surface-border bg-graphite/90 p-4 space-y-3">
              {facilityRacks.slice(0, 4).map((rack) => {
                const levels = rack.levels ?? 4
                const capacity = rack.capacity ?? 40
                const currentFill = Math.min(
                  levels,
                  Math.max(1, Math.round((levels * (activeZone?.occupancyPct ?? 65)) / 100)),
                )

                return (
                  <div
                    key={rack.id}
                    className={`rounded-lg border p-3 transition-all cursor-pointer ${
                      selectedRackId === rack.id
                        ? 'border-primary bg-surface shadow-md'
                        : 'border-surface-border bg-surface/40 hover:border-surface-3'
                    }`}
                    onClick={() => setSelectedRackId(rack.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-text-primary">
                          {rack.name}
                        </span>
                        <span className="font-mono text-[10px] text-text-muted">
                          [{rack.id}]
                        </span>
                      </div>
                      <span className="font-mono text-xs text-primary font-medium">
                        {capacity} Pallet Capacity ({levels} Tiers)
                      </span>
                    </div>

                    {/* Tiers vertical bays */}
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: 5 }).map((_, tierIndex) => {
                        const levelNumber = 5 - tierIndex
                        const isAvailableTier = levelNumber <= levels
                        const isOccupied = levelNumber <= currentFill

                        return (
                          <div
                            key={tierIndex}
                            className={`h-9 rounded border flex flex-col justify-between p-1 text-[9px] font-mono transition-colors ${
                              !isAvailableTier
                                ? 'border-surface-border/30 bg-surface/20 opacity-30'
                                : isOccupied
                                  ? 'border-primary/40 bg-primary/15 text-primary shadow-[inset_0_0_8px_rgba(67,217,232,0.15)]'
                                  : 'border-surface-border bg-surface/50 text-text-muted'
                            }`}
                          >
                            <span className="text-[8px] opacity-75">T{levelNumber}</span>
                            <span className="font-bold self-end text-[10px]">
                              {isAvailableTier
                                ? isOccupied
                                  ? 'LOADED'
                                  : 'EMPTY'
                                : 'N/A'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : viewMode === 'topdown' ? (
          /* Tactical 2D Top-Down Floorplan */
          <div
            className="relative z-10 w-full max-w-xl transition-transform duration-300"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-primary font-semibold uppercase tracking-wider">
                Tactical Floorplan Layout // Inbound / Outbound Aisle Array
              </span>
              <span className="text-[11px] font-mono text-text-muted">
                NORTH ORIENTATION
              </span>
            </div>

            {/* Perimeter Building Outline */}
            <div className="rounded-xl border-2 border-secondary/30 bg-graphite/95 p-4 shadow-2xl relative">
              {/* Dock Doors */}
              <div className="absolute -top-2 left-6 flex gap-2">
                <span className="rounded bg-primary/20 border border-primary/50 px-1.5 py-0.5 font-mono text-[9px] text-primary">
                  DOCK 01 (INBOUND)
                </span>
                <span className="rounded bg-primary/20 border border-primary/50 px-1.5 py-0.5 font-mono text-[9px] text-primary">
                  DOCK 02
                </span>
              </div>
              <div className="absolute -bottom-2 right-6 flex gap-2">
                <span className="rounded bg-secondary/20 border border-secondary/50 px-1.5 py-0.5 font-mono text-[9px] text-secondary">
                  DISPATCH BAY 03
                </span>
              </div>

              {/* Grid of zones */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 pb-2">
                {zoneStats.map((zone) => {
                  const style = getZoneAccentColor(zone, heatmapMetric)
                  const isSelected = selectedZoneId === zone.id

                  return (
                    <div
                      key={zone.id}
                      className={`rounded-lg border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 bg-surface shadow-lg'
                          : 'border-surface-border bg-surface/50 hover:border-surface-3'
                      }`}
                      onClick={() => {
                        setSelectedZoneId(zone.id)
                        onSelectZone?.(zone.id)
                      }}
                      onMouseEnter={() => setHoveredZoneId(zone.id)}
                      onMouseLeave={() => setHoveredZoneId(null)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] text-text-muted">
                          [{zone.id}]
                        </span>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: style.fill,
                            boxShadow: `0 0 8px ${style.glow}`,
                          }}
                        />
                      </div>
                      <h4 className="font-semibold text-xs text-text-primary truncate">
                        {zone.name}
                      </h4>
                      <p className="font-mono text-[10px] text-text-muted mt-0.5">
                        {zone.type}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-text-muted">Occ:</span>
                        <span className={`font-bold ${style.text}`}>
                          {zone.occupancyPct}%
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-1 h-1 w-full rounded-full bg-surface-3 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: style.fill,
                            width: `${zone.occupancyPct}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Signature 3D Isometric Facility Visualization (Isometric SVG Vector Engine) */
          <div
            className="relative z-10 w-full flex items-center justify-center transition-transform duration-300"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotationOffset}deg)`,
            }}
          >
            <svg
              className="w-full max-w-2xl h-[330px] sm:h-[370px] overflow-visible"
              viewBox="0 0 800 460"
            >
              <defs>
                {/* 3D Shading Gradients */}
                <linearGradient id="isoFloor" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#141E2A" />
                  <stop offset="100%" stopColor="#0D141C" />
                </linearGradient>

                <linearGradient id="isoSlabEdge" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#223140" />
                  <stop offset="100%" stopColor="#0B1017" />
                </linearGradient>

                <linearGradient id="rackTopCyan" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#5AE5F3" />
                  <stop offset="100%" stopColor="#43D9E8" />
                </linearGradient>

                <linearGradient id="rackLeftCyan" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#2198A6" />
                  <stop offset="100%" stopColor="#1B7E8A" />
                </linearGradient>

                <linearGradient id="rackRightCyan" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#166770" />
                  <stop offset="100%" stopColor="#124E55" />
                </linearGradient>

                {/* Filter for glowing vertex beacon pins */}
                <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Base 3D Isometric Foundation Slab (Extruded Concrete Foundation) */}
              <g transform="translate(400, 215) scale(0.82) translate(-400, -215)">
              {/* Floor Shadow */}
              <polygon
                fill="rgba(0,0,0,0.45)"
                points="400,60 740,240 400,420 60,240"
                transform="translate(0, 16)"
              />

              {/* Slab Side Edges (Depth extrusion) */}
              <polygon
                fill="url(#isoSlabEdge)"
                points="60,240 400,420 400,432 60,252"
                stroke="#243342"
                strokeWidth="1"
              />
              <polygon
                fill="#0A1017"
                points="400,420 740,240 740,252 400,432"
                stroke="#243342"
                strokeWidth="1"
              />

              {/* Slab Top Floor */}
              <polygon
                fill="url(#isoFloor)"
                points="400,60 740,240 400,420 60,240"
                stroke="#2A3C4E"
                strokeWidth="1.5"
              />

              {/* Precision Isometric Floor Grid Lines */}
              <path
                d="
                  M145,285 L485,105
                  M230,330 L570,150
                  M315,375 L655,195
                  M230,150 L570,330
                  M315,105 L655,285
                  M145,195 L485,375
                "
                stroke="#223140"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Inbound / Outbound Bay Markings on Perimeter */}
              <g opacity="0.85">
                <polygon
                  fill="#1C2935"
                  points="160,190 200,170 230,185 190,205"
                  stroke="#43D9E8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  className="font-mono text-[9px] fill-[#43D9E8]"
                  x="172"
                  y="192"
                >
                  BAY 01
                </text>

                <polygon
                  fill="#1C2935"
                  points="610,300 650,280 680,295 640,315"
                  stroke="#5AA9FF"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <text
                  className="font-mono text-[9px] fill-[#5AA9FF]"
                  x="622"
                  y="302"
                >
                  BAY 02
                </text>
              </g>

              {/* 2. Interactive 3D Isometric Zones & Racks */}
              {/* Zone A: Bulk Pallet High-Density (Back Left) */}
              <g
                className="cursor-pointer transition-opacity"
                onClick={() => {
                  const z = zoneStats[0]
                  if (z) {
                    setSelectedZoneId(z.id)
                    onSelectZone?.(z.id)
                  }
                }}
                onMouseEnter={() => zoneStats[0] && setHoveredZoneId(zoneStats[0].id)}
                onMouseLeave={() => setHoveredZoneId(null)}
              >
                {/* Zone Pad Floor Boundary */}
                <polygon
                  className="transition-all duration-200"
                  fill={
                    selectedZoneId === zoneStats[0]?.id
                      ? 'rgba(67, 217, 232, 0.22)'
                      : hoveredZoneId === zoneStats[0]?.id
                        ? 'rgba(67, 217, 232, 0.15)'
                        : 'rgba(28, 41, 53, 0.8)'
                  }
                  points="320,110 440,170 330,230 210,170"
                  stroke={
                    selectedZoneId === zoneStats[0]?.id ? '#43D9E8' : '#2C3E50'
                  }
                  strokeWidth={selectedZoneId === zoneStats[0]?.id ? '2' : '1.2'}
                />

                {/* 3D Extruded Racks in Zone A */}
                {/* Rack 1 */}
                <g transform="translate(255, 135)">
                  {/* Top Face */}
                  <polygon
                    fill={
                      selectedZoneId === zoneStats[0]?.id
                        ? '#5AE5F3'
                        : '#354859'
                    }
                    points="35,0 70,18 35,36 0,18"
                    stroke="#43D9E8"
                    strokeWidth="0.8"
                  />
                  {/* Left Face */}
                  <polygon
                    fill="#1F2E3C"
                    points="0,18 35,36 35,76 0,58"
                    stroke="#223140"
                    strokeWidth="0.8"
                  />
                  {/* Right Face */}
                  <polygon
                    fill="#15212C"
                    points="35,36 70,18 70,58 35,76"
                    stroke="#223140"
                    strokeWidth="0.8"
                  />
                  {/* Shelf tier lines */}
                  <line stroke="#43D9E8" strokeOpacity="0.6" x1="0" x2="35" y1="38" y2="56" />
                  <line stroke="#43D9E8" strokeOpacity="0.6" x1="0" x2="35" y1="48" y2="66" />
                  <line stroke="#43D9E8" strokeOpacity="0.4" x1="35" x2="70" y1="56" y2="38" />
                  <line stroke="#43D9E8" strokeOpacity="0.4" x1="35" x2="70" y1="66" y2="48" />
                </g>

                {/* Rack 2 */}
                <g transform="translate(325, 140)">
                  <polygon
                    fill={
                      selectedZoneId === zoneStats[0]?.id
                        ? '#5AE5F3'
                        : '#354859'
                    }
                    points="30,0 60,15 30,30 0,15"
                    stroke="#43D9E8"
                    strokeWidth="0.8"
                  />
                  <polygon
                    fill="#1F2E3C"
                    points="0,15 30,30 30,65 0,50"
                    stroke="#223140"
                    strokeWidth="0.8"
                  />
                  <polygon
                    fill="#15212C"
                    points="30,30 60,15 60,50 30,65"
                    stroke="#223140"
                    strokeWidth="0.8"
                  />
                </g>

                {/* Beacon Pin */}
                <circle
                  cx="325"
                  cy="170"
                  fill="#43D9E8"
                  filter="url(#cyanGlow)"
                  r="3.5"
                />
                <text
                  className="font-mono text-[10px] font-bold fill-[#E9F0F7]"
                  x="260"
                  y="125"
                >
                  {zoneStats[0]?.name.split(' ')[0] || 'ZONE A'}
                </text>
              </g>

              {/* Zone B: Fast Picking Bay (Center Right) */}
              <g
                className="cursor-pointer transition-opacity"
                onClick={() => {
                  const z = zoneStats[1]
                  if (z) {
                    setSelectedZoneId(z.id)
                    onSelectZone?.(z.id)
                  }
                }}
                onMouseEnter={() => zoneStats[1] && setHoveredZoneId(zoneStats[1].id)}
                onMouseLeave={() => setHoveredZoneId(null)}
              >
                {/* Zone Pad Floor */}
                <polygon
                  fill={
                    selectedZoneId === zoneStats[1]?.id
                      ? 'rgba(90, 169, 255, 0.25)'
                      : hoveredZoneId === zoneStats[1]?.id
                        ? 'rgba(90, 169, 255, 0.16)'
                        : 'rgba(28, 41, 53, 0.8)'
                  }
                  points="450,180 570,240 460,300 340,240"
                  stroke={
                    selectedZoneId === zoneStats[1]?.id ? '#5AA9FF' : '#2C3E50'
                  }
                  strokeWidth={selectedZoneId === zoneStats[1]?.id ? '2' : '1.2'}
                />

                {/* 3D Extruded Picking Flow Racks */}
                <g transform="translate(390, 205)">
                  <polygon
                    fill={
                      selectedZoneId === zoneStats[1]?.id
                        ? '#5AA9FF'
                        : '#354859'
                    }
                    points="40,0 80,20 40,40 0,20"
                    stroke="#5AA9FF"
                    strokeWidth="0.8"
                  />
                  <polygon
                    fill="#1F2E3C"
                    points="0,20 40,40 40,75 0,55"
                    stroke="#223140"
                    strokeWidth="0.8"
                  />
                  <polygon
                    fill="#15212C"
                    points="40,40 80,20 80,55 40,75"
                    stroke="#223140"
                    strokeWidth="0.8"
                  />
                  {/* Pick indicator pallets */}
                  <circle cx="20" cy="30" fill="#43D9E8" r="2.5" />
                  <circle cx="40" cy="20" fill="#F59E0B" r="2.5" />
                  <circle cx="60" cy="30" fill="#10B981" r="2.5" />
                </g>

                <circle
                  cx="455"
                  cy="240"
                  fill="#5AA9FF"
                  filter="url(#cyanGlow)"
                  r="3.5"
                />
                <text
                  className="font-mono text-[10px] font-bold fill-[#E9F0F7]"
                  x="485"
                  y="215"
                >
                  {zoneStats[1]?.name.split(' ')[0] || 'ZONE B'}
                </text>
              </g>

              {/* Zone C: Climate / Receiving Chamber (Front Left) */}
              <g
                className="cursor-pointer transition-opacity"
                onClick={() => {
                  const z = zoneStats[2] || zoneStats[0]
                  if (z) {
                    setSelectedZoneId(z.id)
                    onSelectZone?.(z.id)
                  }
                }}
                onMouseEnter={() => {
                  const z = zoneStats[2] || zoneStats[0]
                  if (z) setHoveredZoneId(z.id)
                }}
                onMouseLeave={() => setHoveredZoneId(null)}
              >
                {/* Zone Pad Floor */}
                <polygon
                  fill={
                    selectedZoneId === (zoneStats[2]?.id || '')
                      ? 'rgba(245, 158, 11, 0.25)'
                      : hoveredZoneId === (zoneStats[2]?.id || '')
                        ? 'rgba(245, 158, 11, 0.16)'
                        : 'rgba(28, 41, 53, 0.8)'
                  }
                  points="220,245 340,305 230,365 110,305"
                  stroke={
                    selectedZoneId === (zoneStats[2]?.id || '')
                      ? '#F59E0B'
                      : '#2C3E50'
                  }
                  strokeWidth="1.2"
                />

                {/* Staging pallets on ground */}
                <g transform="translate(160, 275)">
                  <polygon
                    fill="#F59E0B"
                    opacity="0.8"
                    points="25,0 50,12 25,24 0,12"
                    stroke="#D97706"
                    strokeWidth="0.8"
                  />
                  <polygon
                    fill="#B45309"
                    points="0,12 25,24 25,36 0,24"
                  />
                  <polygon
                    fill="#78350F"
                    points="25,24 50,12 50,24 25,36"
                  />
                </g>

                <g transform="translate(225, 305)">
                  <polygon
                    fill="#10B981"
                    opacity="0.8"
                    points="20,0 40,10 20,20 0,10"
                    stroke="#059669"
                    strokeWidth="0.8"
                  />
                  <polygon
                    fill="#047857"
                    points="0,10 20,20 20,30 0,20"
                  />
                  <polygon
                    fill="#065F46"
                    points="20,20 40,10 40,20 20,30"
                  />
                </g>

                <circle
                  cx="225"
                  cy="305"
                  fill="#F59E0B"
                  filter="url(#cyanGlow)"
                  r="3.5"
                />
                <text
                  className="font-mono text-[10px] font-bold fill-[#E9F0F7]"
                  x="140"
                  y="265"
                >
                  {zoneStats[2]?.name.split(' ')[0] || 'ZONE C'}
                </text>
              </g>

              {/* Central Main Forklift Transit Aisle (Cyan Pulsing Arrow) */}
              <g opacity="0.75">
                <line
                  stroke="#43D9E8"
                  strokeDasharray="6 6"
                  strokeWidth="1.5"
                  x1="280"
                  x2="520"
                  y1="210"
                  y2="330"
                />
                <polygon
                  fill="#43D9E8"
                  points="524,332 512,322 516,334"
                />
              </g>
              </g>
            </svg>
          </div>
        )}

        {/* 3. Floating HUD Telemetry Card (Active Zone Details) */}
        {activeZone && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 rounded-xl border border-surface-border bg-graphite/95 p-3.5 shadow-2xl backdrop-blur-md z-20">
            <div className="flex items-start justify-between gap-2 border-b border-surface-border pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(67,217,232,0.8)]" />
                  <span className="font-semibold text-xs text-text-primary">
                    {activeRack ? activeRack.name : activeZone.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-text-muted">
                  <span>ID: {activeRack ? activeRack.id : activeZone.id}</span>
                  <span>•</span>
                  <span>
                    {activeRack
                      ? `${activeRack.levels ?? 4} High-Bay Tiers`
                      : activeZone.type}
                  </span>
                </div>
              </div>
              <StatusBadge
                size="sm"
                tone={activeZone.status === 'Active' ? 'success' : 'neutral'}
              >
                {activeZone.status}
              </StatusBadge>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-[10px] text-text-muted block">UNITS</span>
                <span className="font-bold text-text-primary">
                  {activeZone.actualUnits}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">CAPACITY</span>
                <span className="font-bold text-text-primary">
                  {activeZone.totalCapacity} plts
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">OCCUPANCY</span>
                <span className="font-bold text-text-primary">
                  {activeZone.occupancyPct}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">VALUATION</span>
                <span className="font-bold text-primary">
                  {formatInr(activeZone.actualValuation)}
                </span>
              </div>
            </div>

            {/* Quick action link to Warehouses Page */}
            <div className="mt-3 pt-2.5 border-t border-surface-border flex items-center justify-between text-[11px]">
              <span className="text-text-muted flex items-center gap-1">
                <Boxes size={12} className="text-secondary" />
                <span>{activeZone.rackCount} Racks • {activeZone.assignedSkus} SKUs</span>
              </span>
              <Link
                to="/app/warehouses"
                className="text-primary hover:underline font-medium flex items-center gap-1"
              >
                <span>Inspect Hub Racks</span>
                <Sparkles size={11} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Metric Strip */}
      <div className="grid grid-cols-2 divide-x divide-surface-border border-t border-surface-border bg-surface/30 sm:grid-cols-4 text-xs">
        <div className="p-3">
          <span className="text-[10px] font-mono text-text-muted block">
            FACILITY FOOTPRINT
          </span>
          <span className="font-semibold text-text-primary text-xs sm:text-sm">
            {(activeWarehouse.capacitySqFt ?? 75000).toLocaleString('en-IN')} sq ft
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
            {facilityStockUnits.toLocaleString()} Units ({facilityProducts.length} SKUs)
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
    </div>
  )
}
