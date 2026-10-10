import { warehouses, type Warehouse } from './inventoryData'

export type ZoneStatus = 'Active' | 'Inactive'
export type RackStatus = 'Active' | 'Inactive'

export type WarehouseZone = {
  id: string
  warehouseId: string
  name: string
  type: string
  description?: string
  status: ZoneStatus
  createdAt: string
  updatedAt: string
}

export type WarehouseRack = {
  id: string
  zoneId: string
  warehouseId: string
  name: string
  capacity?: number
  levels?: number
  status: RackStatus
  createdAt: string
  updatedAt: string
}

export const zoneTypes = [
  'Storage',
  'Receiving',
  'Picking',
  'Cold Storage',
  'Quarantine',
  'Packing',
] as const

export const initialWarehousesSeed: Warehouse[] = warehouses.map((w) => ({
  ...w,
  status: w.status ?? 'Active',
}))

export const initialZones: WarehouseZone[] = [
  {
    id: 'zon-mum-a',
    warehouseId: 'wh-mum',
    name: 'Bulk Pallet Storage A',
    type: 'Storage',
    description: 'Heavy duty pallet racking for high-volume raw materials',
    status: 'Active',
    createdAt: '2026-01-15',
    updatedAt: '2026-08-10',
  },
  {
    id: 'zon-mum-b',
    warehouseId: 'wh-mum',
    name: 'Fast-Moving Picking Bay',
    type: 'Picking',
    description: 'Gravity-fed carton flow and ergonomic pick bins',
    status: 'Active',
    createdAt: '2026-01-18',
    updatedAt: '2026-09-01',
  },
  {
    id: 'zon-mum-c',
    warehouseId: 'wh-mum',
    name: 'Climate Controlled Chamber',
    type: 'Cold Storage',
    description: 'Chilled facility for temperature-sensitive adhesives',
    status: 'Inactive',
    createdAt: '2026-02-01',
    updatedAt: '2026-07-20',
  },
  {
    id: 'zon-del-a',
    warehouseId: 'wh-del',
    name: 'Inbound Staging Area',
    type: 'Receiving',
    description: 'Cross-dock inspection and container de-stuffing bays',
    status: 'Active',
    createdAt: '2026-01-22',
    updatedAt: '2026-08-15',
  },
  {
    id: 'zon-del-b',
    warehouseId: 'wh-del',
    name: 'High-Density Storage North',
    type: 'Storage',
    description: 'Very Narrow Aisle (VNA) racking with wire guidance',
    status: 'Active',
    createdAt: '2026-01-25',
    updatedAt: '2026-09-12',
  },
  {
    id: 'zon-blr-a',
    warehouseId: 'wh-blr',
    name: 'Automated Packing Hub',
    type: 'Packing',
    description: 'Automated shrink wrapping and dispatch sorting',
    status: 'Active',
    createdAt: '2026-02-10',
    updatedAt: '2026-09-18',
  },
  {
    id: 'zon-blr-b',
    warehouseId: 'wh-blr',
    name: 'Quality Quarantine Enclosure',
    type: 'Quarantine',
    description: 'Segregated cage for rejected parts and QA audits',
    status: 'Active',
    createdAt: '2026-02-15',
    updatedAt: '2026-08-25',
  },
]

export const initialRacks: WarehouseRack[] = [
  {
    id: 'rck-mum-a1',
    zoneId: 'zon-mum-a',
    warehouseId: 'wh-mum',
    name: 'Aisle 1 - Pallet Rack 01',
    capacity: 60,
    levels: 4,
    status: 'Active',
    createdAt: '2026-01-16',
    updatedAt: '2026-08-10',
  },
  {
    id: 'rck-mum-a2',
    zoneId: 'zon-mum-a',
    warehouseId: 'wh-mum',
    name: 'Aisle 1 - Pallet Rack 02',
    capacity: 60,
    levels: 4,
    status: 'Active',
    createdAt: '2026-01-16',
    updatedAt: '2026-08-10',
  },
  {
    id: 'rck-mum-b1',
    zoneId: 'zon-mum-b',
    warehouseId: 'wh-mum',
    name: 'Pick Line Flow Rack 01',
    capacity: 35,
    levels: 3,
    status: 'Active',
    createdAt: '2026-01-19',
    updatedAt: '2026-09-01',
  },
  {
    id: 'rck-mum-b2',
    zoneId: 'zon-mum-b',
    warehouseId: 'wh-mum',
    name: 'Pick Line Flow Rack 02',
    capacity: 35,
    levels: 3,
    status: 'Active',
    createdAt: '2026-01-19',
    updatedAt: '2026-09-01',
  },
  {
    id: 'rck-mum-c1',
    zoneId: 'zon-mum-c',
    warehouseId: 'wh-mum',
    name: 'Insulated Cold Rack 01',
    capacity: 25,
    levels: 2,
    status: 'Inactive',
    createdAt: '2026-02-02',
    updatedAt: '2026-07-20',
  },
  {
    id: 'rck-del-a1',
    zoneId: 'zon-del-a',
    warehouseId: 'wh-del',
    name: 'Dock Staging Rack 01',
    capacity: 45,
    levels: 3,
    status: 'Active',
    createdAt: '2026-01-23',
    updatedAt: '2026-08-15',
  },
  {
    id: 'rck-del-b1',
    zoneId: 'zon-del-b',
    warehouseId: 'wh-del',
    name: 'High-Bay Rack North 01',
    capacity: 80,
    levels: 5,
    status: 'Active',
    createdAt: '2026-01-26',
    updatedAt: '2026-09-12',
  },
  {
    id: 'rck-del-b2',
    zoneId: 'zon-del-b',
    warehouseId: 'wh-del',
    name: 'High-Bay Rack North 02',
    capacity: 80,
    levels: 5,
    status: 'Active',
    createdAt: '2026-01-26',
    updatedAt: '2026-09-12',
  },
  {
    id: 'rck-blr-a1',
    zoneId: 'zon-blr-a',
    warehouseId: 'wh-blr',
    name: 'Conveyor Buffer Rack 01',
    capacity: 40,
    levels: 3,
    status: 'Active',
    createdAt: '2026-02-11',
    updatedAt: '2026-09-18',
  },
  {
    id: 'rck-blr-b1',
    zoneId: 'zon-blr-b',
    warehouseId: 'wh-blr',
    name: 'Quarantine Lock-Rack 01',
    capacity: 20,
    levels: 2,
    status: 'Active',
    createdAt: '2026-02-16',
    updatedAt: '2026-08-25',
  },
]
