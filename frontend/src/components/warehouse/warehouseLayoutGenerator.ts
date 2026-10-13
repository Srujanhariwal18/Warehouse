import type { Product, Warehouse } from '@/mocks/inventoryData'
import type { WarehouseRack, WarehouseZone } from '@/mocks/warehouseData'

export type Vector3Tuple = [number, number, number]
export type Vector2Tuple = [number, number]

export interface PlacedRack {
  rack: WarehouseRack
  zone: WarehouseZone
  position: Vector3Tuple
  rotationY: number
  width: number
  depth: number
  height: number
  levels: number
  occupiedUnits: number
  capacity: number
  occupancyPct: number
  assignedProducts: Product[]
}

export interface PlacedZone {
  zone: WarehouseZone
  position: Vector3Tuple
  size: Vector2Tuple
  racks: PlacedRack[]
  assignedProducts: Product[]
  actualUnits: number
  actualValuation: number
  totalCapacity: number
  occupancyPct: number
}

export interface WorkstationFixture {
  id: string
  zoneId: string
  name: string
  position: Vector3Tuple
  rotationY: number
}

export interface EquipmentFixture {
  id: string
  type: 'forklift' | 'pallet_jack' | 'conveyor' | 'charging_station'
  name: string
  position: Vector3Tuple
  rotationY: number
}

export interface SafetyFixture {
  id: string
  type: 'safety_cabinet' | 'bollard' | 'eyewash_station' | 'hazard_cage'
  name: string
  position: Vector3Tuple
  rotationY: number
}

export interface Warehouse3DLayout {
  warehouse: Warehouse
  dimensions: {
    width: number
    length: number
    height: number
  }
  columns: Vector3Tuple[]
  zones: PlacedZone[]
  workstations: WorkstationFixture[]
  equipment: EquipmentFixture[]
  safetyFixtures: SafetyFixture[]
  aisles: {
    mainAisleZ: number
    crossAisleX: number
    width: number
  }
}

/**
 * Deterministically generates physical spatial coordinates and fixtures for any warehouse.
 *
 * Assumptions & Methodology:
 * 1. Physical Footprint: Scaled from `capacitySqFt` or defaulted to a standard 32m x 24m structural grid.
 * 2. Zones: Placed symmetrically along the central transport corridor based on functional type:
 *    - Inbound/Receiving: Near front loading docks (+Z)
 *    - Storage & High-Bay: Centered in main hall (-Z to center)
 *    - Picking: Along primary outbound access lanes
 *    - Packing: Adjacent to outbound sorting buffer
 *    - Quarantine/Cold Storage: Segregated lateral bays
 * 3. Category Fixtures:
 *    - Storage: High-density pallet racking, wire-decked tiers, pallets, cartons.
 *    - Packing: Ergonomic workstations, tape dispensers, parcel flow tables.
 *    - Equipment: Dedicated staging bays with forklift, pallet jacks, and charging ports.
 *    - Safety: Yellow hazardous cabinets, rack end-frame safety bollards, eyewash stations.
 */
export function generateWarehouse3DLayout(
  warehouse: Warehouse,
  zones: WarehouseZone[],
  racks: WarehouseRack[],
  products: Product[],
): Warehouse3DLayout {
  // 1. Structural Dimensions based on facility footprint
  const sqFt = warehouse.capacitySqFt ?? 45000
  const scale = Math.sqrt(sqFt / 45000)
  const hallWidth = Math.round(32 * Math.min(1.4, Math.max(0.85, scale)))
  const hallLength = Math.round(24 * Math.min(1.4, Math.max(0.85, scale)))
  const hallHeight = 7.5

  // 2. Structural Column Grid (4x3 matrix)
  const columns: Vector3Tuple[] = []
  const colXSpacing = hallWidth / 3
  const colZSpacing = hallLength / 3
  for (
    let x = -hallWidth / 2 + colXSpacing / 2;
    x <= hallWidth / 2;
    x += colXSpacing
  ) {
    for (
      let z = -hallLength / 2 + colZSpacing / 2;
      z <= hallLength / 2;
      z += colZSpacing
    ) {
      // Don't place columns directly in center aisle
      if (Math.abs(x) > 2.5 && Math.abs(z) > 2.5) {
        columns.push([
          Number(x.toFixed(2)),
          hallHeight / 2,
          Number(z.toFixed(2)),
        ])
      }
    }
  }

  // 3. Partition Products by Rack & Zone
  const rackMap = new Map(racks.map((r) => [r.id, r]))
  const zoneMap = new Map(zones.map((z) => [z.id, z]))

  const productsByRack = new Map<string, Product[]>()
  const productsByZone = new Map<string, Product[]>()

  for (const product of products) {
    const units =
      product.warehouseStock &&
      product.warehouseStock[warehouse.id] !== undefined
        ? product.warehouseStock[warehouse.id]
        : product.warehouseId === warehouse.id
          ? product.stock
          : 0

    if (product.warehouseId !== warehouse.id && units <= 0) continue

    let targetZoneId: string | undefined
    if (product.rackId && rackMap.has(product.rackId)) {
      targetZoneId = rackMap.get(product.rackId)!.zoneId
      const rList = productsByRack.get(product.rackId) ?? []
      rList.push(product)
      productsByRack.set(product.rackId, rList)
    } else if (product.zoneId && zoneMap.has(product.zoneId)) {
      targetZoneId = product.zoneId
    }

    if (targetZoneId && zoneMap.has(targetZoneId)) {
      const zList = productsByZone.get(targetZoneId) ?? []
      zList.push(product)
      productsByZone.set(targetZoneId, zList)
    }
  }

  // 4. Place Zones Deterministically
  const placedZones: PlacedZone[] = []
  const activeZones = zones.filter((z) => z.warehouseId === warehouse.id)
  const zoneCount = activeZones.length

  // Calculate layout coordinates for each zone based on its index and functional type
  activeZones.forEach((zone, idx) => {
    const isLeft = idx % 2 === 0
    const row = Math.floor(idx / 2)
    const totalRows = Math.ceil(zoneCount / 2) || 1

    const zoneWidth = Number((hallWidth * 0.38).toFixed(1))
    const zoneLength = Number(((hallLength * 0.72) / totalRows).toFixed(1))

    // Position zones symmetrically with clear central aisle (X = 0) and front dock buffer (Z > 6)
    const posX = isLeft ? -hallWidth * 0.24 : hallWidth * 0.24
    const startZ = -hallLength * 0.38
    const posZ = startZ + row * (zoneLength + 1.2) + zoneLength / 2

    const zoneRacks = racks.filter((r) => r.zoneId === zone.id)
    const assignedProducts = productsByZone.get(zone.id) ?? []

    const actualUnits = assignedProducts.reduce((sum, p) => {
      const stock =
        p.warehouseStock && p.warehouseStock[warehouse.id] !== undefined
          ? p.warehouseStock[warehouse.id]
          : p.warehouseId === warehouse.id
            ? p.stock
            : 0
      return sum + stock
    }, 0)

    const actualValuation = assignedProducts.reduce((sum, p) => {
      const stock =
        p.warehouseStock && p.warehouseStock[warehouse.id] !== undefined
          ? p.warehouseStock[warehouse.id]
          : p.warehouseId === warehouse.id
            ? p.stock
            : 0
      return sum + stock * p.price
    }, 0)

    const totalCapacity = zoneRacks.reduce(
      (sum, r) => sum + (r.capacity ?? 0),
      0,
    )
    const occupancyPct =
      totalCapacity > 0
        ? Math.min(
            100,
            Math.max(0, Math.round((actualUnits / totalCapacity) * 100)),
          )
        : 0

    // Place racks inside this zone
    const placedRacks: PlacedRack[] = []
    const rackCount = zoneRacks.length
    const rackWidth = 4.4
    const rackDepth = 1.3
    const rackLevels = 4

    zoneRacks.forEach((rack, rIdx) => {
      const levels = rack.levels ?? rackLevels
      const height = levels * 1.05 + 0.3
      const rackProds = productsByRack.get(rack.id) ?? []

      const rackUnits = rackProds.reduce((sum, p) => {
        const stock =
          p.warehouseStock && p.warehouseStock[warehouse.id] !== undefined
            ? p.warehouseStock[warehouse.id]
            : p.warehouseId === warehouse.id
              ? p.stock
              : 0
        return sum + stock
      }, 0)

      const rackCap = rack.capacity ?? 50
      const rackOcc =
        rackCap > 0
          ? Math.min(100, Math.max(0, Math.round((rackUnits / rackCap) * 100)))
          : 0

      // Offset racks inside zone boundary
      let offsetZ = 0
      if (rackCount > 1) {
        const rackSpacing = Math.min(2.8, (zoneLength - 1.5) / rackCount)
        offsetZ = (rIdx - (rackCount - 1) / 2) * rackSpacing
      }

      placedRacks.push({
        rack,
        zone,
        position: [
          Number(posX.toFixed(2)),
          0,
          Number((posZ + offsetZ).toFixed(2)),
        ],
        rotationY: 0,
        width: rackWidth,
        depth: rackDepth,
        height,
        levels,
        occupiedUnits: rackUnits,
        capacity: rackCap,
        occupancyPct: rackOcc,
        assignedProducts: rackProds,
      })
    })

    placedZones.push({
      zone,
      position: [Number(posX.toFixed(2)), 0, Number(posZ.toFixed(2))],
      size: [zoneWidth, zoneLength],
      racks: placedRacks,
      assignedProducts,
      actualUnits,
      actualValuation,
      totalCapacity,
      occupancyPct,
    })
  })

  // 5. Category-Specific Fixtures Placement:
  // Workstations for Packing / Staging
  const workstations: WorkstationFixture[] = []
  const packingZone = placedZones.find((z) => z.zone.type === 'Packing')
  if (packingZone) {
    workstations.push(
      {
        id: `ws-${packingZone.zone.id}-1`,
        zoneId: packingZone.zone.id,
        name: 'Packing Station Alpha (Auto-Pack)',
        position: [
          packingZone.position[0] - 2.8,
          0,
          packingZone.position[2] + 1.8,
        ],
        rotationY: Math.PI / 2,
      },
      {
        id: `ws-${packingZone.zone.id}-2`,
        zoneId: packingZone.zone.id,
        name: 'Packing Station Beta (Quality Check)',
        position: [
          packingZone.position[0] + 2.8,
          0,
          packingZone.position[2] + 1.8,
        ],
        rotationY: -Math.PI / 2,
      },
    )
  } else {
    // Standard dispatch workstation at front dock
    workstations.push({
      id: `ws-${warehouse.id}-dispatch`,
      zoneId: placedZones[0]?.zone.id ?? 'dispatch',
      name: 'Manifest & Outbound QC Station',
      position: [6.5, 0, hallLength / 2 - 4.2],
      rotationY: Math.PI,
    })
  }

  // Equipment Fixtures (Forklift, Pallet Jacks, Dock plates)
  const equipment: EquipmentFixture[] = [
    {
      id: `eq-${warehouse.id}-forklift-1`,
      type: 'forklift',
      name: 'Toyota 8FBE15 Electric Reach Forklift',
      position: [-2.2, 0, hallLength / 2 - 3.8],
      rotationY: -Math.PI / 6,
    },
    {
      id: `eq-${warehouse.id}-jack-1`,
      type: 'pallet_jack',
      name: 'Hydraulic Pallet Jack #01',
      position: [1.8, 0, hallLength / 2 - 4.0],
      rotationY: Math.PI / 4,
    },
    {
      id: `eq-${warehouse.id}-charging`,
      type: 'charging_station',
      name: 'Industrial Li-Ion Fast-Charging Station',
      position: [-hallWidth / 2 + 1.2, 0, hallLength / 2 - 3.5],
      rotationY: Math.PI / 2,
    },
  ]

  // Safety Fixtures (Flammable cabinets, safety bollards, eyewash, hazard enclosures)
  const safetyFixtures: SafetyFixture[] = [
    {
      id: `safe-${warehouse.id}-cab-1`,
      type: 'safety_cabinet',
      name: 'Flammable & Chemical Safety Cabinet (OSHA Standard)',
      position: [hallWidth / 2 - 1.2, 0, -hallLength / 2 + 2.5],
      rotationY: -Math.PI / 2,
    },
    {
      id: `safe-${warehouse.id}-eyewash`,
      type: 'eyewash_station',
      name: 'Emergency Eyewash & Safety Decontamination Point',
      position: [hallWidth / 2 - 1.2, 0, 0],
      rotationY: -Math.PI / 2,
    },
  ]

  // Add safety bollards at rack row ends
  placedZones.forEach((pz) => {
    pz.racks.forEach((pr) => {
      safetyFixtures.push(
        {
          id: `bollard-${pr.rack.id}-left`,
          type: 'bollard',
          name: 'Heavy Duty Steel Bollard',
          position: [pr.position[0] - pr.width / 2 - 0.4, 0, pr.position[2]],
          rotationY: 0,
        },
        {
          id: `bollard-${pr.rack.id}-right`,
          type: 'bollard',
          name: 'Heavy Duty Steel Bollard',
          position: [pr.position[0] + pr.width / 2 + 0.4, 0, pr.position[2]],
          rotationY: 0,
        },
      )
    })
  })

  // If quarantine zone exists, demarcate safety hazard cage
  const quarantineZone = placedZones.find((z) => z.zone.type === 'Quarantine')
  if (quarantineZone) {
    safetyFixtures.push({
      id: `safe-cage-${quarantineZone.zone.id}`,
      type: 'hazard_cage',
      name: 'Segregated QA Quarantine Perimeter Enclosure',
      position: quarantineZone.position,
      rotationY: 0,
    })
  }

  return {
    warehouse,
    dimensions: {
      width: hallWidth,
      length: hallLength,
      height: hallHeight,
    },
    columns,
    zones: placedZones,
    workstations,
    equipment,
    safetyFixtures,
    aisles: {
      mainAisleZ: 0,
      crossAisleX: 0,
      width: 2.8,
    },
  }
}
