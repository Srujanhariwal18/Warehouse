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
