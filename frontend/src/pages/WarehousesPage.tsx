import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Box,
  AlertTriangle,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  X,
  Layers,
  Thermometer,
  PackagePlus,
  PackageMinus,
} from 'lucide-react'

export interface RackItem {
  id: string
  code: string
  warehouseId: 'A' | 'B' | 'C'
  zone: string
  aisle: string
  capacity: number
  current: number
  status: 'NORMAL' | 'LOW' | 'WARNING' | 'CRITICAL'
  dominantProduct: string
  sku: string
  temperature: string
  tiers: {
    tierNumber: number
    name: string
    palletCount: number
    maxPallets: number
    status: 'OPTIMAL' | 'LOW' | 'FULL'
  }[]
}

interface WarehouseMetadata {
  id: 'A' | 'B' | 'C'
  name: string
  facilityCode: string
  description: string
  totalCapacity: number
  occupiedUnits: number
  activeBays: number
  totalBays: number
  warningCount: number
  image: string
}

export function WarehousesPage() {
  const navigate = useNavigate()
  const [selectedWarehouse, setSelectedWarehouse] = useState<'A' | 'B' | 'C'>('A')
  const [viewMode, setViewMode] = useState<'visual' | 'grid'>('visual')
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'ZONE_A' | 'ZONE_B'>('ALL')
  const [selectedRack, setSelectedRack] = useState<RackItem | null>(null)
  const [hoveredBay, setHoveredBay] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'ATTENTION'>('ALL')

  const warehouseProfiles: Record<'A' | 'B' | 'C', WarehouseMetadata> = {
    A: {
      id: 'A',
      name: 'Central Automated Hub',
      facilityCode: 'WH-CENTRAL-01',
      description:
        'High-density vertical lift racking facility engineered for automated guided vehicle (AGV) slotting and high-velocity picking.',
      totalCapacity: 24000,
      occupiedUnits: 18240,
      activeBays: 18,
      totalBays: 24,
      warningCount: 1,
      image: '/assets/smart-racking.jpg',
    },
    B: {
      id: 'B',
      name: 'North Logistics Terminal',
      facilityCode: 'WH-NORTH-02',
      description:
        'Fast-moving transit and consolidation warehouse with multi-dock cross-docking lanes and heavy mechanical payload bays.',
      totalCapacity: 16000,
      occupiedUnits: 10240,
      activeBays: 14,
      totalBays: 20,
      warningCount: 1,
      image: '/assets/dispatch-dock.jpg',
    },
    C: {
      id: 'C',
      name: 'Cold & Secure Annex',
      facilityCode: 'WH-ANNEX-03',
      description:
        'Climate-controlled precision facility dedicated to temperature-sensitive sub-assemblies, pharmaceutical lots, and sealed components.',
      totalCapacity: 12000,
      occupiedUnits: 10920,
      activeBays: 12,
      totalBays: 12,
      warningCount: 2,
      image: '/assets/hero-warehouse.jpg',
    },
  }

  const allRacks: RackItem[] = [
    // Warehouse A Racks
    {
      id: 'r-a01',
      code: 'Rack A-01',
      warehouseId: 'A',
      zone: 'Zone A',
      aisle: 'Aisle 01-Left',
      capacity: 1500,
      current: 1350,
      status: 'NORMAL',
      dominantProduct: 'Precision Bearings (SKU-8820)',
      sku: 'SKU-8820',
      temperature: '21.4°C',
      tiers: [
        { tierNumber: 4, name: 'Top High-Bay Reserve', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 3, name: 'Active Buffer Tier', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Primary Pick Face', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Ground Intake Slot', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-a02',
      code: 'Rack A-02',
      warehouseId: 'A',
      zone: 'Zone A',
      aisle: 'Aisle 01-Right',
      capacity: 1500,
      current: 1410,
      status: 'NORMAL',
      dominantProduct: 'Brushless DC Motors (SKU-1029)',
      sku: 'SKU-1029',
      temperature: '20.8°C',
      tiers: [
        { tierNumber: 4, name: 'Top High-Bay Reserve', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 3, name: 'Active Buffer Tier', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 2, name: 'Primary Pick Face', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 1, name: 'Ground Intake Slot', palletCount: 4, maxPallets: 4, status: 'FULL' },
      ],
    },
    {
      id: 'r-a03',
      code: 'Rack A-03',
      warehouseId: 'A',
      zone: 'Zone A',
      aisle: 'Aisle 02-Left',
      capacity: 1200,
      current: 420,
      status: 'LOW',
      dominantProduct: 'Industrial Optical Sensors (SKU-4912)',
      sku: 'SKU-4912',
      temperature: '22.1°C',
      tiers: [
        { tierNumber: 4, name: 'Top High-Bay Reserve', palletCount: 1, maxPallets: 4, status: 'LOW' },
        { tierNumber: 3, name: 'Active Buffer Tier', palletCount: 1, maxPallets: 4, status: 'LOW' },
        { tierNumber: 2, name: 'Primary Pick Face', palletCount: 1, maxPallets: 4, status: 'LOW' },
        { tierNumber: 1, name: 'Ground Intake Slot', palletCount: 1, maxPallets: 4, status: 'LOW' },
      ],
    },
    {
      id: 'r-a04',
      code: 'Rack A-04',
      warehouseId: 'A',
      zone: 'Zone A',
      aisle: 'Aisle 02-Right',
      capacity: 1500,
      current: 1284,
      status: 'WARNING',
      dominantProduct: 'Micro-controller Assemblies (SKU-3104)',
      sku: 'SKU-3104',
      temperature: '23.0°C',
      tiers: [
        { tierNumber: 4, name: 'Top High-Bay Reserve', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 3, name: 'Active Buffer Tier', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Primary Pick Face', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 1, name: 'Ground Intake Slot', palletCount: 4, maxPallets: 4, status: 'FULL' },
      ],
    },
    {
      id: 'r-a05',
      code: 'Rack A-05',
      warehouseId: 'A',
      zone: 'Zone B',
      aisle: 'Aisle 03-Left',
      capacity: 1000,
      current: 880,
      status: 'NORMAL',
      dominantProduct: 'Pneumatic Actuators (SKU-7721)',
      sku: 'SKU-7721',
      temperature: '21.0°C',
      tiers: [
        { tierNumber: 4, name: 'Top High-Bay Reserve', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 3, name: 'Active Buffer Tier', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 2, name: 'Primary Pick Face', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 1, name: 'Ground Intake Slot', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-a06',
      code: 'Rack A-06',
      warehouseId: 'A',
      zone: 'Zone B',
      aisle: 'Aisle 03-Right',
      capacity: 1000,
      current: 920,
      status: 'NORMAL',
      dominantProduct: 'Thermal Relay Brackets (SKU-2094)',
      sku: 'SKU-2094',
      temperature: '21.2°C',
      tiers: [
        { tierNumber: 4, name: 'Top High-Bay Reserve', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 3, name: 'Active Buffer Tier', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Primary Pick Face', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Ground Intake Slot', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },

    // Warehouse B Racks
    {
      id: 'r-b01',
      code: 'Rack B-01',
      warehouseId: 'B',
      zone: 'Zone A',
      aisle: 'Transit Bay 01',
      capacity: 1200,
      current: 960,
      status: 'NORMAL',
      dominantProduct: 'Hydraulic Couplers (SKU-6120)',
      sku: 'SKU-6120',
      temperature: '19.5°C',
      tiers: [
        { tierNumber: 4, name: 'Top Buffer', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 3, name: 'Intermediate Bay', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Fast Pick Level', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Dock Pallet Staging', palletCount: 2, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-b02',
      code: 'Rack B-02',
      warehouseId: 'B',
      zone: 'Zone A',
      aisle: 'Transit Bay 02',
      capacity: 1200,
      current: 840,
      status: 'NORMAL',
      dominantProduct: 'Steel Structural Flanges (SKU-5521)',
      sku: 'SKU-5521',
      temperature: '19.8°C',
      tiers: [
        { tierNumber: 4, name: 'Top Buffer', palletCount: 2, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 3, name: 'Intermediate Bay', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Fast Pick Level', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 1, name: 'Dock Pallet Staging', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-b03',
      code: 'Rack B-03',
      warehouseId: 'B',
      zone: 'Zone A',
      aisle: 'Transit Bay 03',
      capacity: 1000,
      current: 240,
      status: 'LOW',
      dominantProduct: 'Heavy-Duty Roller Chains (SKU-4402)',
      sku: 'SKU-4402',
      temperature: '20.1°C',
      tiers: [
        { tierNumber: 4, name: 'Top Buffer', palletCount: 0, maxPallets: 4, status: 'LOW' },
        { tierNumber: 3, name: 'Intermediate Bay', palletCount: 1, maxPallets: 4, status: 'LOW' },
        { tierNumber: 2, name: 'Fast Pick Level', palletCount: 1, maxPallets: 4, status: 'LOW' },
        { tierNumber: 1, name: 'Dock Pallet Staging', palletCount: 1, maxPallets: 4, status: 'LOW' },
      ],
    },
    {
      id: 'r-b04',
      code: 'Rack B-04',
      warehouseId: 'B',
      zone: 'Zone B',
      aisle: 'Consolidation 01',
      capacity: 1200,
      current: 980,
      status: 'NORMAL',
      dominantProduct: 'Tapered Roller Sets (SKU-1190)',
      sku: 'SKU-1190',
      temperature: '19.2°C',
      tiers: [
        { tierNumber: 4, name: 'Top Buffer', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 3, name: 'Intermediate Bay', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Fast Pick Level', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Dock Pallet Staging', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-b05',
      code: 'Rack B-05',
      warehouseId: 'B',
      zone: 'Zone B',
      aisle: 'Consolidation 02',
      capacity: 1000,
      current: 820,
      status: 'NORMAL',
      dominantProduct: 'Cast Iron Flange Nuts (SKU-9901)',
      sku: 'SKU-9901',
      temperature: '19.4°C',
      tiers: [
        { tierNumber: 4, name: 'Top Buffer', palletCount: 2, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 3, name: 'Intermediate Bay', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Fast Pick Level', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Dock Pallet Staging', palletCount: 2, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-b06',
      code: 'Rack B-06',
      warehouseId: 'B',
      zone: 'Zone B',
      aisle: 'Consolidation 03',
      capacity: 800,
      current: 740,
      status: 'NORMAL',
      dominantProduct: 'Linear Guide Rails (SKU-3829)',
      sku: 'SKU-3829',
      temperature: '19.6°C',
      tiers: [
        { tierNumber: 4, name: 'Top Buffer', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 3, name: 'Intermediate Bay', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 2, name: 'Fast Pick Level', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 1, name: 'Dock Pallet Staging', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },

    // Warehouse C Racks
    {
      id: 'r-c01',
      code: 'Rack C-01',
      warehouseId: 'C',
      zone: 'Zone A',
      aisle: 'Cold Quad 01',
      capacity: 1000,
      current: 940,
      status: 'NORMAL',
      dominantProduct: 'Sealed Servo Motors (SKU-9022)',
      sku: 'SKU-9022',
      temperature: '4.2°C',
      tiers: [
        { tierNumber: 4, name: 'Cold Ceiling Tier', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 3, name: 'Hermetic Rack Deck', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Insulated Pick Slot', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Base Thermal Plate', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-c02',
      code: 'Rack C-02',
      warehouseId: 'C',
      zone: 'Zone A',
      aisle: 'Cold Quad 02',
      capacity: 1000,
      current: 980,
      status: 'CRITICAL',
      dominantProduct: 'Cryogenic Solenoid Valves (SKU-7704)',
      sku: 'SKU-7704',
      temperature: '3.9°C',
      tiers: [
        { tierNumber: 4, name: 'Cold Ceiling Tier', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 3, name: 'Hermetic Rack Deck', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 2, name: 'Insulated Pick Slot', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Base Thermal Plate', palletCount: 4, maxPallets: 4, status: 'FULL' },
      ],
    },
    {
      id: 'r-c03',
      code: 'Rack C-03',
      warehouseId: 'C',
      zone: 'Zone A',
      aisle: 'Cold Quad 03',
      capacity: 800,
      current: 710,
      status: 'NORMAL',
      dominantProduct: 'Precision Piezo Transducers (SKU-2311)',
      sku: 'SKU-2311',
      temperature: '4.0°C',
      tiers: [
        { tierNumber: 4, name: 'Cold Ceiling Tier', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 3, name: 'Hermetic Rack Deck', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Insulated Pick Slot', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Base Thermal Plate', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-c04',
      code: 'Rack C-04',
      warehouseId: 'C',
      zone: 'Zone B',
      aisle: 'Vault Quad 01',
      capacity: 1000,
      current: 920,
      status: 'WARNING',
      dominantProduct: 'High-Purity Silicon Encoders (SKU-8819)',
      sku: 'SKU-8819',
      temperature: '5.1°C',
      tiers: [
        { tierNumber: 4, name: 'Vault Upper Lock', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 3, name: 'Vault Mid Shelf', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 2, name: 'Vault Lower Shelf', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 1, name: 'Base Vault Floor', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-c05',
      code: 'Rack C-05',
      warehouseId: 'C',
      zone: 'Zone B',
      aisle: 'Vault Quad 02',
      capacity: 800,
      current: 730,
      status: 'NORMAL',
      dominantProduct: 'Gold-Plated Contact Pins (SKU-1492)',
      sku: 'SKU-1492',
      temperature: '4.8°C',
      tiers: [
        { tierNumber: 4, name: 'Vault Upper Lock', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 3, name: 'Vault Mid Shelf', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 2, name: 'Vault Lower Shelf', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 1, name: 'Base Vault Floor', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
    {
      id: 'r-c06',
      code: 'Rack C-06',
      warehouseId: 'C',
      zone: 'Zone B',
      aisle: 'Vault Quad 03',
      capacity: 800,
      current: 760,
      status: 'NORMAL',
      dominantProduct: 'Optoelectronic Emitters (SKU-6602)',
      sku: 'SKU-6602',
      temperature: '4.9°C',
      tiers: [
        { tierNumber: 4, name: 'Vault Upper Lock', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 3, name: 'Vault Mid Shelf', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
        { tierNumber: 2, name: 'Vault Lower Shelf', palletCount: 4, maxPallets: 4, status: 'FULL' },
        { tierNumber: 1, name: 'Base Vault Floor', palletCount: 3, maxPallets: 4, status: 'OPTIMAL' },
      ],
    },
  ]

  const currentWarehouse = warehouseProfiles[selectedWarehouse]
  const currentRacks = allRacks
    .filter((r) => r.warehouseId === selectedWarehouse)
    .filter((r) => {
      if (zoneFilter === 'ZONE_A') return r.zone === 'Zone A'
      if (zoneFilter === 'ZONE_B') return r.zone === 'Zone B'
      return true
    })
    .filter((r) => {
      if (statusFilter === 'NORMAL') return r.status === 'NORMAL'
      if (statusFilter === 'ATTENTION') return r.status !== 'NORMAL'
      return true
    })

  const getStatusBadge = (status: RackItem['status']) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            NORMAL
          </span>
        )
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            LOW STOCK
          </span>
        )
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-md">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            WARNING
          </span>
        )
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md animate-pulse">
            <ShieldAlert className="w-3 h-3 text-red-500" />
            CRITICAL
          </span>
        )
    }
  }

  const overallUtilPct = Math.round((currentWarehouse.occupiedUnits / currentWarehouse.totalCapacity) * 100)

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
      {/* Breadcrumb Back Link */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5E6282] hover:text-[#DF6951] transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Landing Overview</span>
        </Link>
      </div>

      {/* Page Title & Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-8 border-b border-gray-100">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#DF6951] uppercase mb-2 block">
            FACILITY TOPOLOGY &amp; SPATIAL MAPPING
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-[#181E4B]">
            Warehouse Architecture &amp; Racks
          </h1>
          <p className="text-sm sm:text-base text-[#5E6282] mt-3 max-w-2xl leading-relaxed">
            Real-time multi-zone occupancy and rack utilization gauges. Every bay reflects capacity limits,
            live batch allocations, and worst-case inventory health thresholds.
          </p>
        </div>

        {/* View Mode & Facility Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse A / B / C Selector */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-semibold text-[#5E6282]">
            <button
              type="button"
              onClick={() => setSelectedWarehouse('A')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedWarehouse === 'A'
                  ? 'bg-white text-[#181E4B] shadow-xs font-bold'
                  : 'hover:text-[#181E4B]'
              }`}
            >
              Warehouse A
            </button>
            <button
              type="button"
              onClick={() => setSelectedWarehouse('B')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedWarehouse === 'B'
                  ? 'bg-white text-[#181E4B] shadow-xs font-bold'
                  : 'hover:text-[#181E4B]'
              }`}
            >
              Warehouse B
            </button>
            <button
              type="button"
              onClick={() => setSelectedWarehouse('C')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedWarehouse === 'C'
                  ? 'bg-white text-[#181E4B] shadow-xs font-bold'
                  : 'hover:text-[#181E4B]'
              }`}
            >
              Warehouse C
            </button>
          </div>

          {/* 3D Twin vs 2D Grid View Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center text-xs font-semibold text-[#5E6282]">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'visual'
                  ? 'bg-white text-[#181E4B] shadow-xs font-bold'
                  : 'hover:text-[#181E4B]'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>3D Twin</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#181E4B] shadow-xs font-bold'
                  : 'hover:text-[#181E4B]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#DF6951]" />
              <span>2D Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Facility KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-[11px] font-mono text-[#5E6282] uppercase tracking-wider block">Facility Code</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#181E4B] mt-1 block">
            {currentWarehouse.facilityCode}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block truncate">{currentWarehouse.name}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-[11px] font-mono text-[#5E6282] uppercase tracking-wider block">Total Occupancy</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#181E4B] mt-1 block">
            {currentWarehouse.occupiedUnits.toLocaleString()} / {currentWarehouse.totalCapacity.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">{overallUtilPct}% Capacity</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-[11px] font-mono text-[#5E6282] uppercase tracking-wider block">Active Bays</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#181E4B] mt-1 block">
            {currentWarehouse.activeBays} / {currentWarehouse.totalBays} Bays
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Automated Lift Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs">
          <span className="text-[11px] font-mono text-[#5E6282] uppercase tracking-wider block">Alert Status</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#DF6951] mt-1 block">
            {currentWarehouse.warningCount > 0 ? `${currentWarehouse.warningCount} Warnings` : 'All Optimal'}
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5 block">Rolling Telemetry Stream</span>
        </div>
      </div>

      {/* Main Facility Visualization Stage */}
      {viewMode === 'visual' ? (
        /* 3D Spatial Digital Twin Mode */
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-[#0A0E17] mb-12 group">
          {/* Background Ambient Warehouse Imagery */}
          <div className="relative aspect-16/8 sm:aspect-16/7 w-full overflow-hidden">
            <img
              src={currentWarehouse.image}
              alt={`${currentWarehouse.name} High-Bay Racks`}
              className="w-full h-full object-cover opacity-45 group-hover:scale-[1.01] transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-[#0A0E17]/60 to-transparent" />

            {/* Interactive Vector Overlay Representing 3D Bay Coordinates */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              {/* Top Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-2 bg-[#181E4B]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                  <span className="font-semibold text-gray-200">
                    Spatial Digital Twin · {currentWarehouse.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoneFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      zoneFilter === 'ALL' ? 'bg-white text-[#181E4B] font-bold' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    All Zones
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoneFilter('ZONE_A')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      zoneFilter === 'ZONE_A' ? 'bg-white text-[#181E4B] font-bold' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Zone A
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoneFilter('ZONE_B')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      zoneFilter === 'ZONE_B' ? 'bg-white text-[#181E4B] font-bold' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Zone B
                  </button>
                </div>
              </div>

              {/* Interactive SVG Isometric Rack Nodes Grid */}
              <div className="my-auto py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {currentRacks.map((rack) => {
                  const util = Math.round((rack.current / rack.capacity) * 100)
                  const isHovered = hoveredBay === rack.id

                  return (
                    <div
                      key={rack.id}
                      onMouseEnter={() => setHoveredBay(rack.id)}
                      onMouseLeave={() => setHoveredBay(null)}
                      onClick={() => setSelectedRack(rack)}
                      className={`relative p-3.5 sm:p-4 rounded-2xl backdrop-blur-md border transition-all duration-300 cursor-pointer ${
                        isHovered
                          ? 'bg-white/20 border-white/50 scale-105 shadow-xl -translate-y-1'
                          : 'bg-white/10 border-white/10 hover:bg-white/15'
                      }`}
                    >
                      {/* Bay Indicator Beacon */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-white tracking-wider">
                          {rack.code}
                        </span>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            rack.status === 'CRITICAL'
                              ? 'bg-red-500 animate-ping'
                              : rack.status === 'WARNING'
                              ? 'bg-orange-500'
                              : rack.status === 'LOW'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                      </div>

                      {/* Isometric Mini Shelf Tiers Display */}
                      <div className="space-y-1 my-2">
                        {rack.tiers.map((t) => (
                          <div key={t.tierNumber} className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-gray-300 w-3">T{t.tierNumber}</span>
                            <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  t.status === 'FULL'
                                    ? 'bg-[#14B8A6]'
                                    : t.status === 'LOW'
                                    ? 'bg-amber-400'
                                    : 'bg-white/70'
                                }`}
                                style={{ width: `${(t.palletCount / t.maxPallets) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Metric */}
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-300">
                        <span>{util}% Full</span>
                        <span className="text-[#14B8A6] font-semibold">{rack.temperature}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bottom HUD Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="font-mono text-gray-400">
                    Click any bay coordinate above to open live telemetry inspection
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Normal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Low Stock
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" /> Warning
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> Critical
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2D Topological Grid & Floor Plan Mode */
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FAFAFC] border border-gray-200 mb-12 shadow-inner">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-[#DF6951] uppercase">
                TOPOLOGICAL OVERHEAD SCHEMATIC
              </span>
              <h3 className="font-sans font-bold text-xl text-[#181E4B]">
                {currentWarehouse.name} · Floor Matrix
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-[#181E4B] text-white font-bold' : 'bg-white border border-gray-200 text-[#5E6282]'
                }`}
              >
                All Bays ({currentRacks.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('NORMAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  statusFilter === 'NORMAL' ? 'bg-[#181E4B] text-white font-bold' : 'bg-white border border-gray-200 text-[#5E6282]'
                }`}
              >
                Normal Only
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ATTENTION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
                  statusFilter === 'ATTENTION' ? 'bg-[#181E4B] text-white font-bold' : 'bg-white border border-gray-200 text-[#5E6282]'
                }`}
              >
                Attention Needed
              </button>
            </div>
          </div>

          {/* 2D Grid Representation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentRacks.map((rack) => {
              const utilPct = Math.round((rack.current / rack.capacity) * 100)
              return (
                <div
                  key={rack.id}
                  onClick={() => setSelectedRack(rack)}
                  className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-[#14B8A6] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-[#DF6951]" />
                        <span className="font-bold text-sm text-[#181E4B]">{rack.code}</span>
                      </div>
                      {getStatusBadge(rack.status)}
                    </div>
                    <div className="text-xs text-[#5E6282] mb-3">
                      <span>{rack.zone}</span> · <span className="font-mono text-gray-500">{rack.aisle}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 line-clamp-1 mb-3">
                      {rack.dominantProduct}
                    </p>

                    {/* Fill Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-gray-500">
                        <span>Fill Rate</span>
                        <span className="font-bold text-[#181E4B]">{utilPct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            rack.status === 'CRITICAL'
                              ? 'bg-[#DF6951]'
                              : rack.status === 'WARNING'
                              ? 'bg-[#F1A501]'
                              : rack.status === 'LOW'
                              ? 'bg-amber-400'
                              : 'bg-[#14B8A6]'
                          }`}
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-[#5E6282]">
                    <span>Occupied: {rack.current}/{rack.capacity}</span>
                    <span className="text-[#DF6951] font-semibold flex items-center gap-1">
                      Inspect &rarr;
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Individual Rack Cards Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#181E4B]">
            Active High-Bay Rack Inventory
          </h2>
          <p className="text-xs sm:text-sm text-[#5E6282] mt-1">
            Displaying monitored bays for {currentWarehouse.name} ({currentRacks.length} bays configured)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {currentRacks.map((rack) => {
          const utilPct = Math.round((rack.current / rack.capacity) * 100)
          return (
            <div
              key={rack.id}
              onClick={() => setSelectedRack(rack)}
              className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#DF6951]" />
                    <span className="font-sans font-bold text-base text-[#181E4B]">
                      {rack.code}
                    </span>
                  </div>
                  {getStatusBadge(rack.status)}
                </div>

                <div className="text-xs text-[#5E6282] mb-3">
                  <span className="font-semibold text-gray-700">{rack.zone}</span> ·{' '}
                  <span className="font-mono text-gray-500">{rack.aisle}</span>
                </div>

                <div className="text-xs text-gray-800 mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block mb-0.5">Primary SKU</span>
                  <span className="font-semibold text-gray-900">{rack.dominantProduct}</span>
                </div>

                {/* Utilization Progress Bar */}
                <div className="space-y-1.5 mb-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-500">Utilization</span>
                    <span className="font-bold text-[#181E4B]">{utilPct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        rack.status === 'CRITICAL'
                          ? 'bg-[#DF6951]'
                          : rack.status === 'WARNING'
                          ? 'bg-[#F1A501]'
                          : rack.status === 'LOW'
                          ? 'bg-amber-400'
                          : 'bg-[#14B8A6]'
                      }`}
                      style={{ width: `${utilPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-[#5E6282]">
                <span>
                  Occupied: <strong className="text-[#181E4B]">{rack.current}</strong> / {rack.capacity}
                </span>
                <span className="text-[#DF6951] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Rack Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Rack Inspection Modal */}
      {selectedRack && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRack(null)
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#181E4B]/50 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rack-modal-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform animate-panel-expand"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#FAFAFC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1EE] text-[#DF6951] flex items-center justify-center font-bold">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="rack-modal-title" className="font-serif font-bold text-xl text-[#181E4B]">
                      {selectedRack.code}
                    </h3>
                    {getStatusBadge(selectedRack.status)}
                  </div>
                  <span className="text-xs font-mono text-[#5E6282]">
                    {selectedRack.zone} · {selectedRack.aisle} · {currentWarehouse.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRack(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer"
                aria-label="Close rack inspection dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Telemetry Metrics Bar */}
              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <div>
                  <span className="text-[11px] font-mono text-gray-500 uppercase">Capacity</span>
                  <div className="font-bold text-base text-[#181E4B] mt-0.5">
                    {selectedRack.current} / {selectedRack.capacity}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-gray-500 uppercase">Temperature</span>
                  <div className="font-bold text-base text-[#14B8A6] mt-0.5 flex items-center justify-center gap-1">
                    <Thermometer className="w-4 h-4" />
                    <span>{selectedRack.temperature}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-gray-500 uppercase">Fill Pct</span>
                  <div className="font-bold text-base text-[#DF6951] mt-0.5">
                    {Math.round((selectedRack.current / selectedRack.capacity) * 100)}%
                  </div>
                </div>
              </div>

              {/* Dominant SKU Lot Detail */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200">
                <span className="text-xs font-mono font-bold tracking-wider text-[#DF6951] uppercase mb-1 block">
                  ACTIVE BATCH ALLOCATION
                </span>
                <div className="text-sm font-bold text-[#181E4B]">{selectedRack.dominantProduct}</div>
                <div className="mt-2 text-xs text-[#5E6282] grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">SKU Code: </span>
                    <strong className="font-mono text-gray-800">{selectedRack.sku}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Verification: </span>
                    <strong className="text-emerald-600">Dock Verified</strong>
                  </div>
                </div>
              </div>

              {/* Shelf Tiers Breakdown */}
              <div>
                <h4 className="text-xs font-mono font-bold tracking-widest text-gray-600 uppercase mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#181E4B]" />
                  <span>Vertical Tier Slot Configuration (4 Levels)</span>
                </h4>

                <div className="space-y-2">
                  {selectedRack.tiers.map((tier) => (
                    <div
                      key={tier.tierNumber}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center font-mono font-bold text-[#181E4B]">
                          T{tier.tierNumber}
                        </span>
                        <span className="font-medium text-gray-800">{tier.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[#5E6282]">
                          {tier.palletCount} / {tier.maxPallets} Pallets
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            tier.status === 'FULL'
                              ? 'bg-emerald-50 text-emerald-700'
                              : tier.status === 'LOW'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {tier.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons to Operations */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRack(null)
                    navigate('/operations')
                  }}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#DF6951] hover:bg-[#c94f38] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-coral-button cursor-pointer transition"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>Log Stock IN to this Bay</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRack(null)
                    navigate('/operations')
                  }}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#181E4B] hover:bg-[#283272] text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <PackageMinus className="w-4 h-4" />
                  <span>Log Stock OUT from this Bay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
