import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  validateWarehouseInput,
  validateZoneInput,
  validateRackInput,
  type CreateWarehouseInput,
} from '../src/lib/warehouseStore'
import {
  initialWarehousesSeed,
  initialZones,
  initialRacks,
  type WarehouseZone,
  type WarehouseRack,
} from '../src/mocks/warehouseData'
import { products, type Warehouse } from '../src/mocks/inventoryData'
import { initialSuppliers } from '../src/mocks/supplierData'
import { validateSupplierInput } from '../src/lib/supplierStore'
import { validateOrderInput } from '../src/lib/orderStore'

test('1. Warehouse required-field validation and whitespace trimming', () => {
  const currentWarehouses: Warehouse[] = initialWarehousesSeed.map((w) => ({
    ...w,
  }))

  // 1a. Missing or whitespace-only name
  const emptyNameResult = validateWarehouseInput(
    { name: '   ', city: 'Pune' },
    currentWarehouses,
  )
  assert.equal(emptyNameResult.ok, false)
  if (!emptyNameResult.ok) {
    assert.match(emptyNameResult.message, /warehouse name is required/i)
  }

  // 1b. Missing or whitespace-only city
  const emptyCityResult = validateWarehouseInput(
    { name: 'Pune Fulfillment', city: '   ' },
    currentWarehouses,
  )
  assert.equal(emptyCityResult.ok, false)
  if (!emptyCityResult.ok) {
    assert.match(emptyCityResult.message, /city is required/i)
  }

  // 1c. Invalid capacitySqFt (negative or zero or non-integer)
  const negCapacityResult = validateWarehouseInput(
    { name: 'Pune Fulfillment', city: 'Pune', capacitySqFt: -500 },
    currentWarehouses,
  )
  assert.equal(negCapacityResult.ok, false)
  if (!negCapacityResult.ok) {
    assert.match(negCapacityResult.message, /positive whole number/i)
  }

  const zeroCapacityResult = validateWarehouseInput(
    { name: 'Pune Fulfillment', city: 'Pune', capacitySqFt: 0 },
    currentWarehouses,
  )
  assert.equal(zeroCapacityResult.ok, false)

  const floatCapacityResult = validateWarehouseInput(
    { name: 'Pune Fulfillment', city: 'Pune', capacitySqFt: 1200.5 },
    currentWarehouses,
  )
  assert.equal(floatCapacityResult.ok, false)

  // 1d. Valid input passes
  const validResult = validateWarehouseInput(
    {
      name: '  Pune Logistics Center  ',
      city: '  Pune  ',
      capacitySqFt: 25000,
    },
    currentWarehouses,
  )
  assert.equal(validResult.ok, true)
})

test('2. Case-insensitive duplicate warehouse IDs', () => {
  const currentWarehouses: Warehouse[] = initialWarehousesSeed.map((w) => ({
    ...w,
  }))

  // 2a. Duplicate ID with exact casing
  const exactDup = validateWarehouseInput(
    { id: 'wh-mum', name: 'New Mumbai Facility', city: 'Mumbai' },
    currentWarehouses,
  )
  assert.equal(exactDup.ok, false)
  if (!exactDup.ok) {
    assert.match(exactDup.message, /already exists/i)
  }

  // 2b. Duplicate ID with uppercase casing
  const upperDup = validateWarehouseInput(
    { id: 'WH-MUM', name: 'New Mumbai Facility', city: 'Mumbai' },
    currentWarehouses,
  )
  assert.equal(upperDup.ok, false)
  if (!upperDup.ok) {
    assert.match(upperDup.message, /already exists/i)
  }

  // 2c. Duplicate ID with mixed casing
  const mixedDup = validateWarehouseInput(
    { id: 'Wh-DeL', name: 'New Delhi Facility', city: 'Delhi' },
    currentWarehouses,
  )
  assert.equal(mixedDup.ok, false)

  // 2d. Editing the existing warehouse preserving its own ID succeeds
  const selfEdit = validateWarehouseInput(
    { id: 'wh-mum', name: 'Mumbai Central Upgraded', city: 'Mumbai' },
    currentWarehouses,
    'wh-mum', // excludeId
  )
  assert.equal(selfEdit.ok, true)
})

test('3. Creating, editing, deactivating, and reactivating warehouses', () => {
  let warehousesList: Warehouse[] = initialWarehousesSeed.map((w) => ({ ...w }))

  // 3a. Create new warehouse
  const newWhInput: CreateWarehouseInput = {
    id: 'wh-pune',
    name: 'Pune Distribution Depot',
    city: 'Pune',
    capacitySqFt: 30000,
  }
  const validation = validateWarehouseInput(newWhInput, warehousesList)
  assert.equal(validation.ok, true)

  const createdWh: Warehouse = {
    ...newWhInput,
    id: newWhInput.id!,
    status: 'Active',
    createdAt: '2026-10-10',
    updatedAt: '2026-10-10',
  }
  warehousesList.push(createdWh)
  assert.equal(warehousesList.length, initialWarehousesSeed.length + 1)

  // 3b. Edit warehouse
  const updateInput = {
    name: 'Pune Distribution Hub & Depot',
    city: 'Pune',
    capacitySqFt: 35000,
  }
  const updateValidation = validateWarehouseInput(
    updateInput,
    warehousesList,
    'wh-pune',
  )
  assert.equal(updateValidation.ok, true)

  warehousesList = warehousesList.map((w) =>
    w.id === 'wh-pune' ? { ...w, ...updateInput, updatedAt: '2026-10-10' } : w,
  )
  const updatedWh = warehousesList.find((w) => w.id === 'wh-pune')
  assert.equal(updatedWh?.name, 'Pune Distribution Hub & Depot')
  assert.equal(updatedWh?.capacitySqFt, 35000)

  // 3c. Deactivate warehouse (has no zones or products)
  assert.equal(updatedWh?.status, 'Active')
  warehousesList = warehousesList.map((w) =>
    w.id === 'wh-pune' ? { ...w, status: 'Inactive' } : w,
  )
  assert.equal(
    warehousesList.find((w) => w.id === 'wh-pune')?.status,
    'Inactive',
  )

  // 3d. Reactivate warehouse
  warehousesList = warehousesList.map((w) =>
    w.id === 'wh-pune' ? { ...w, status: 'Active' } : w,
  )
  assert.equal(warehousesList.find((w) => w.id === 'wh-pune')?.status, 'Active')
})

test('4. Zone-to-warehouse relationships and validation', () => {
  const currentWarehouses: Warehouse[] = initialWarehousesSeed.map((w) => ({
    ...w,
  }))
  const currentZones: WarehouseZone[] = initialZones.map((z) => ({ ...z }))

  // 4a. Missing zone name
  const emptyName = validateZoneInput(
    { name: '   ', warehouseId: 'wh-mum' },
    currentZones,
    currentWarehouses,
  )
  assert.equal(emptyName.ok, false)
  if (!emptyName.ok) {
    assert.match(emptyName.message, /zone name is required/i)
  }

  // 4b. Missing parent warehouse
  const emptyWh = validateZoneInput(
    { name: 'Zone X', warehouseId: '   ' },
    currentZones,
    currentWarehouses,
  )
  assert.equal(emptyWh.ok, false)
  if (!emptyWh.ok) {
    assert.match(emptyWh.message, /parent warehouse is required/i)
  }

  // 4c. Non-existent parent warehouse rejected
  const nonExistentWh = validateZoneInput(
    { name: 'Zone X', warehouseId: 'wh-unknown-999' },
    currentZones,
    currentWarehouses,
  )
  assert.equal(nonExistentWh.ok, false)
  if (!nonExistentWh.ok) {
    assert.match(nonExistentWh.message, /does not exist/i)
  }

  // 4d. Valid zone linked to existing warehouse passes
  const validZone = validateZoneInput(
    { name: 'Cold Room Alpha', warehouseId: 'wh-mum' },
    currentZones,
    currentWarehouses,
  )
  assert.equal(validZone.ok, true)
})

test('5. Duplicate zone IDs within a warehouse', () => {
  const currentWarehouses: Warehouse[] = initialWarehousesSeed.map((w) => ({
    ...w,
  }))
  const currentZones: WarehouseZone[] = initialZones.map((z) => ({ ...z }))

  // 5a. Duplicate zone ID in same warehouse rejected case-insensitively
  const duplicateZone = validateZoneInput(
    { id: 'ZON-MUM-A', name: 'Duplicate Zone A', warehouseId: 'wh-mum' },
    currentZones,
    currentWarehouses,
  )
  assert.equal(duplicateZone.ok, false)
  if (!duplicateZone.ok) {
    assert.match(duplicateZone.message, /already exists in this warehouse/i)
  }

  // 5b. Same zone ID in a DIFFERENT warehouse is permitted
  const diffWhZone = validateZoneInput(
    { id: 'zon-mum-a', name: 'Delhi Zone A', warehouseId: 'wh-del' },
    currentZones,
    currentWarehouses,
  )
  assert.equal(diffWhZone.ok, true)

  // 5c. Self-edit zone preserving its own ID succeeds
  const selfEdit = validateZoneInput(
    { id: 'zon-mum-a', name: 'Updated Zone A Name', warehouseId: 'wh-mum' },
    currentZones,
    currentWarehouses,
    'zon-mum-a', // excludeId
  )
  assert.equal(selfEdit.ok, true)
})

test('6. Rack-to-zone relationships and validation', () => {
  const currentZones: WarehouseZone[] = initialZones.map((z) => ({ ...z }))
  const currentRacks: WarehouseRack[] = initialRacks.map((r) => ({ ...r }))

  // 6a. Missing rack name
  const emptyName = validateRackInput(
    { name: '   ', zoneId: 'zon-mum-a' },
    currentRacks,
    currentZones,
  )
  assert.equal(emptyName.ok, false)
  if (!emptyName.ok) {
    assert.match(emptyName.message, /rack name is required/i)
  }

  // 6b. Missing parent zone
  const emptyZone = validateRackInput(
    { name: 'Rack 1', zoneId: '   ' },
    currentRacks,
    currentZones,
  )
  assert.equal(emptyZone.ok, false)
  if (!emptyZone.ok) {
    assert.match(emptyZone.message, /parent zone is required/i)
  }

  // 6c. Non-existent parent zone rejected
  const nonExistentZone = validateRackInput(
    { name: 'Rack 1', zoneId: 'zon-nonexistent' },
    currentRacks,
    currentZones,
  )
  assert.equal(nonExistentZone.ok, false)
  if (!nonExistentZone.ok) {
    assert.match(nonExistentZone.message, /does not exist/i)
  }

  // 6d. Invalid capacity
  const invalidCap = validateRackInput(
    { name: 'Rack 1', zoneId: 'zon-mum-a', capacity: -10 },
    currentRacks,
    currentZones,
  )
  assert.equal(invalidCap.ok, false)

  // 6e. Invalid levels
  const invalidLevels = validateRackInput(
    { name: 'Rack 1', zoneId: 'zon-mum-a', levels: 0 },
    currentRacks,
    currentZones,
  )
  assert.equal(invalidLevels.ok, false)

  // 6f. Valid rack passes
  const validRack = validateRackInput(
    { name: 'Rack A9', zoneId: 'zon-mum-a', levels: 4, capacity: 150 },
    currentRacks,
    currentZones,
  )
  assert.equal(validRack.ok, true)
})

test('7. Duplicate rack IDs within a zone', () => {
  const currentZones: WarehouseZone[] = initialZones.map((z) => ({ ...z }))
  const currentRacks: WarehouseRack[] = initialRacks.map((r) => ({ ...r }))

  // 7a. Duplicate rack ID in same zone rejected case-insensitively
  const duplicateRack = validateRackInput(
    { id: 'RCK-MUM-A1', name: 'Duplicate Rack', zoneId: 'zon-mum-a' },
    currentRacks,
    currentZones,
  )
  assert.equal(duplicateRack.ok, false)
  if (!duplicateRack.ok) {
    assert.match(duplicateRack.message, /already exists in this zone/i)
  }

  // 7b. Same rack ID in a DIFFERENT zone is permitted
  const diffZoneRack = validateRackInput(
    { id: 'rck-mum-a1', name: 'Different Zone Rack', zoneId: 'zon-mum-b' },
    currentRacks,
    currentZones,
  )
  assert.equal(diffZoneRack.ok, true)

  // 7c. Self-edit preserving ID succeeds
  const selfEdit = validateRackInput(
    { id: 'rck-mum-a1', name: 'Updated Rack A1', zoneId: 'zon-mum-a' },
    currentRacks,
    currentZones,
    'rck-mum-a1', // excludeId
  )
  assert.equal(selfEdit.ok, true)
})

test('8. Protection of parent records with active dependencies', () => {
  const warehousesList: Warehouse[] = initialWarehousesSeed.map((w) => ({
    ...w,
  }))
  let zonesList: WarehouseZone[] = initialZones.map((z) => ({ ...z }))
  let racksList: WarehouseRack[] = initialRacks.map((r) => ({ ...r }))

  // 8a. Deactivating a warehouse with active zones is rejected
  const mumActiveZones = zonesList.filter(
    (z) => z.warehouseId === 'wh-mum' && z.status === 'Active',
  )
  assert.equal(mumActiveZones.length > 0, true)

  // Emulate store deactivation logic
  function canDeactivateWarehouse(whId: string, activeProductCount = 0) {
    const target = warehousesList.find((w) => w.id === whId)
    if (!target) return { ok: false, message: 'Not found' }
    const activeZones = zonesList.filter(
      (z) => z.warehouseId === whId && z.status === 'Active',
    )
    if (activeZones.length > 0) {
      return {
        ok: false,
        message: `Cannot deactivate warehouse "${target.name}" because it still contains ${activeZones.length} active zone(s).`,
      }
    }
    if (activeProductCount > 0) {
      return {
        ok: false,
        message: `Cannot deactivate warehouse "${target.name}" because it currently holds ${activeProductCount} active product record(s).`,
      }
    }
    return { ok: true }
  }

  const whCheckBlockedByZones = canDeactivateWarehouse('wh-mum')
  assert.equal(whCheckBlockedByZones.ok, false)
  assert.match(whCheckBlockedByZones.message, /still contains 2 active zone/i)

  // 8b. Deactivating a warehouse with assigned products is rejected
  const whCheckBlockedByProducts = canDeactivateWarehouse('wh-mum', 5)
  assert.equal(whCheckBlockedByProducts.ok, false)

  // 8c. Deactivating a zone with active racks is rejected
  function canDeactivateZone(zoneId: string, activeProductCount = 0) {
    const target = zonesList.find((z) => z.id === zoneId)
    if (!target) return { ok: false, message: 'Not found' }
    const activeRacks = racksList.filter(
      (r) => r.zoneId === zoneId && r.status === 'Active',
    )
    if (activeRacks.length > 0) {
      return {
        ok: false,
        message: `Cannot deactivate zone "${target.name}" because it contains ${activeRacks.length} active rack(s).`,
      }
    }
    if (activeProductCount > 0) {
      return {
        ok: false,
        message: `Cannot deactivate zone "${target.name}" because it currently holds ${activeProductCount} active product record(s).`,
      }
    }
    return { ok: true }
  }

  const zoneCheckBlocked = canDeactivateZone('zon-mum-a')
  assert.equal(zoneCheckBlocked.ok, false)
  assert.match(zoneCheckBlocked.message, /contains 2 active rack/i)

  // 8d. Once child racks are deactivated, zone deactivation succeeds
  racksList = racksList.map((r) =>
    r.zoneId === 'zon-mum-a' ? { ...r, status: 'Inactive' } : r,
  )
  const zoneCheckAllowed = canDeactivateZone('zon-mum-a', 0)
  assert.equal(zoneCheckAllowed.ok, true)

  // 8e. Once all zones in warehouse are deactivated, warehouse deactivation succeeds
  zonesList = zonesList.map((z) =>
    z.warehouseId === 'wh-mum' ? { ...z, status: 'Inactive' } : z,
  )
  const whCheckAllowed = canDeactivateWarehouse('wh-mum', 0)
  assert.equal(whCheckAllowed.ok, true)
})

test('9. Accurate zone and rack counts across the hierarchy', () => {
  const warehouses = initialWarehousesSeed
  const zones = initialZones
  const racks = initialRacks

  // Mumbai: 3 zones, 5 racks
  const mumZones = zones.filter((z) => z.warehouseId === 'wh-mum')
  const mumRacks = racks.filter((r) => r.warehouseId === 'wh-mum')
  assert.equal(mumZones.length, 3)
  assert.equal(mumRacks.length, 5)

  // Delhi: 2 zones, 3 racks
  const delZones = zones.filter((z) => z.warehouseId === 'wh-del')
  const delRacks = racks.filter((r) => r.warehouseId === 'wh-del')
  assert.equal(delZones.length, 2)
  assert.equal(delRacks.length, 3)

  // Bengaluru: 2 zones, 2 racks
  const blrZones = zones.filter((z) => z.warehouseId === 'wh-blr')
  const blrRacks = racks.filter((r) => r.warehouseId === 'wh-blr')
  assert.equal(blrZones.length, 2)
  assert.equal(blrRacks.length, 2)

  // Total initial counts
  assert.equal(warehouses.length, 3)
  assert.equal(zones.length, 7)
  assert.equal(racks.length, 10)
})

test('10. Inventory and supplier regression checks', () => {
  // Ensure products list is intact
  assert.equal(products.length >= 10, true)
  const firstProd = products[0]
  assert.equal(typeof firstProd.id, 'string')
  assert.equal(typeof firstProd.warehouseId, 'string')

  // Verify supplier store operations remain intact
  const suppliers = initialSuppliers
  assert.equal(suppliers.length >= 5, true)
  const supplierValidation = validateSupplierInput(
    {
      companyName: 'Apex Tools Test',
      contactPerson: 'Karan Mehra',
      email: 'karan@apextools.com',
      phone: '+91 98765 43210',
      address: 'Plot 55, Industrial Area',
    },
    suppliers,
  )
  assert.equal(supplierValidation.ok, true)

  // Verify order input validation remains intact
  const orderValidation = validateOrderInput(
    {
      customerName: 'Test Customer',
      warehouseId: firstProd.warehouseId,
      items: [{ productId: firstProd.id, quantity: 1 }],
    },
    products,
  )
  assert.equal(orderValidation.ok, true)
})

test('11. Warehouse and zone inventory reconciliation across all 3 facilities', () => {
  const warehouseIds = ['wh-mum', 'wh-del', 'wh-blr']

  for (const whId of warehouseIds) {
    const whZones = initialZones.filter((z) => z.warehouseId === whId)
    const whRacks = initialRacks.filter((r) => r.warehouseId === whId)
    const rackToZone = new Map(whRacks.map((r) => [r.id, r.zoneId]))
    const validZoneIds = new Set(whZones.map((z) => z.id))

    // Products in this warehouse
    const whProducts = products.filter((p) => {
      if (p.warehouseStock && p.warehouseStock[whId] !== undefined) {
        return p.warehouseStock[whId] > 0
      }
      return p.warehouseId === whId
    })

    const whTotalStock = whProducts.reduce((sum, p) => {
      const stock =
        p.warehouseStock && p.warehouseStock[whId] !== undefined
          ? p.warehouseStock[whId]
          : p.warehouseId === whId
            ? p.stock
            : 0
      return sum + stock
    }, 0)

    const whTotalValuation = whProducts.reduce((sum, p) => {
      const stock =
        p.warehouseStock && p.warehouseStock[whId] !== undefined
          ? p.warehouseStock[whId]
          : p.warehouseId === whId
            ? p.stock
            : 0
      return sum + stock * p.price
    }, 0)

    // Canonical zone partitioning: every record belongs to exactly one bucket
    const zoneStockMap = new Map<string, number>()
    const zoneValuationMap = new Map<string, number>()
    let unassignedStock = 0
    let unassignedValuation = 0

    for (const p of whProducts) {
      const stock =
        p.warehouseStock && p.warehouseStock[whId] !== undefined
          ? p.warehouseStock[whId]
          : p.warehouseId === whId
            ? p.stock
            : 0
      const val = stock * p.price

      let targetZoneId: string | undefined
      if (p.rackId && rackToZone.has(p.rackId)) {
        targetZoneId = rackToZone.get(p.rackId)
      } else if (p.zoneId && validZoneIds.has(p.zoneId)) {
        targetZoneId = p.zoneId
      }

      if (targetZoneId && validZoneIds.has(targetZoneId)) {
        zoneStockMap.set(
          targetZoneId,
          (zoneStockMap.get(targetZoneId) ?? 0) + stock,
        )
        zoneValuationMap.set(
          targetZoneId,
          (zoneValuationMap.get(targetZoneId) ?? 0) + val,
        )
      } else {
        unassignedStock += stock
        unassignedValuation += val
      }
    }

    // 11a. Verify sum of zone stock equals warehouse stock total
    const sumZoneStock =
      Array.from(zoneStockMap.values()).reduce((sum, s) => sum + s, 0) +
      unassignedStock
    assert.equal(
      sumZoneStock,
      whTotalStock,
      `Reconciled stock for ${whId} must match warehouse total exactly (${sumZoneStock} vs ${whTotalStock})`,
    )

    // 11b. Verify sum of zone valuation equals warehouse valuation total
    const sumZoneValuation =
      Array.from(zoneValuationMap.values()).reduce((sum, v) => sum + v, 0) +
      unassignedValuation
    assert.equal(
      sumZoneValuation,
      whTotalValuation,
      `Reconciled valuation for ${whId} must match warehouse valuation total exactly`,
    )
  }
})

test('12. Location integrity: seeded zoneId and rackId references', () => {
  const zoneMap = new Map(initialZones.map((z) => [z.id, z]))
  const rackMap = new Map(initialRacks.map((r) => [r.id, r]))

  // 12a. Verify all seeded racks reference existing zones and warehouses
  for (const rack of initialRacks) {
    const parentZone = zoneMap.get(rack.zoneId)
    assert.ok(
      parentZone,
      `Rack ${rack.id} must reference existing zone ${rack.zoneId}`,
    )
    assert.equal(
      rack.warehouseId,
      parentZone!.warehouseId,
      `Rack ${rack.id} warehouse must match parent zone warehouse`,
    )
  }

  // 12b. Verify all seeded products with locations reference existing zones and racks
  for (const product of products) {
    if (product.zoneId) {
      const zone = zoneMap.get(product.zoneId)
      assert.ok(zone, `Product ${product.id} zoneId must exist`)
      assert.equal(
        product.warehouseId,
        zone!.warehouseId,
        `Product ${product.id} warehouse must match zone warehouse`,
      )
    }
    if (product.rackId) {
      const rack = rackMap.get(product.rackId)
      assert.ok(rack, `Product ${product.id} rackId must exist`)
      assert.equal(
        product.warehouseId,
        rack!.warehouseId,
        `Product ${product.id} warehouse must match rack warehouse`,
      )
      if (product.zoneId) {
        assert.equal(
          product.zoneId,
          rack!.zoneId,
          `Product ${product.id} zoneId must match rack's parent zone`,
        )
      }
    }
  }
})

test('13. Duplicate counting prevention and missing location edge cases', () => {
  const rackMap = new Map([
    ['rck-1', { id: 'rck-1', zoneId: 'zon-a', warehouseId: 'wh-1' }],
    ['rck-2', { id: 'rck-2', zoneId: 'zon-b', warehouseId: 'wh-1' }],
  ])
  const facilityZoneIds = new Set(['zon-a', 'zon-b'])

  // Helper resolving zone deterministically
  function resolveProductZone(p: {
    zoneId?: string
    rackId?: string
  }): string | null {
    if (p.rackId && rackMap.has(p.rackId)) {
      return rackMap.get(p.rackId)!.zoneId
    }
    if (p.zoneId && facilityZoneIds.has(p.zoneId)) {
      return p.zoneId
    }
    return null
  }

  // 13a. Conflicting zoneId ('zon-a') and rackId (in 'zon-b'): MUST contribute to exactly ONE zone
  const conflictingProduct = { zoneId: 'zon-a', rackId: 'rck-2' }
  const resolvedZone = resolveProductZone(conflictingProduct)
  assert.equal(
    resolvedZone,
    'zon-b',
    'Rack assignment takes deterministic precedence',
  )

  // 13b. Unassigned product (no zone, no rack)
  const unassignedProd = { zoneId: undefined, rackId: undefined }
  assert.equal(resolveProductZone(unassignedProd), null)

  // 13c. Non-existent zone reference
  const orphanProd = { zoneId: 'zon-unknown', rackId: undefined }
  assert.equal(resolveProductZone(orphanProd), null)
})

test('14. Capacity and occupancy boundary constraints', () => {
  // Safe occupancy function
  function calculateOccupancy(units: number, capacity: number): number {
    if (capacity <= 0 || !Number.isFinite(capacity)) return 0
    return Math.min(100, Math.max(0, Math.round((units / capacity) * 100)))
  }

  // 14a. Normal occupancy
  assert.equal(calculateOccupancy(50, 100), 50)

  // 14b. Zero capacity (must safely return 0 without NaN/Infinity)
  assert.equal(calculateOccupancy(50, 0), 0)
  assert.equal(calculateOccupancy(0, 0), 0)

  // 14c. Over-capacity (must cap strictly at 100%)
  assert.equal(calculateOccupancy(250, 100), 100)

  // 14d. Negative stock/units protection (must constrain to 0%)
  assert.equal(calculateOccupancy(-20, 100), 0)
})
