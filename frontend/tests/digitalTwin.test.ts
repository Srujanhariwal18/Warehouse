import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  generateWarehouse3DLayout,
  type Warehouse3DLayout,
} from '../src/components/warehouse/warehouseLayoutGenerator'
import { products, warehouses } from '../src/mocks/inventoryData'
import { initialRacks, initialZones } from '../src/mocks/warehouseData'

test('1. Deterministic 3D Layout Generation across all seeded warehouses', () => {
  for (const wh of warehouses) {
    const layout: Warehouse3DLayout = generateWarehouse3DLayout(
      wh,
      initialZones,
      initialRacks,
      products,
    )

    // Structural Dimensions
    assert.ok(
      layout.dimensions.width >= 24,
      'Warehouse width should be at least 24m',
    )
    assert.ok(
      layout.dimensions.length >= 18,
      'Warehouse length should be at least 18m',
    )
    assert.ok(
      layout.dimensions.height >= 6,
      'Warehouse clear height should be at least 6m',
    )

    // Columns
    assert.ok(
      layout.columns.length > 0,
      'Columns must be generated for structural realism',
    )
    for (const [cx, cy, cz] of layout.columns) {
      assert.ok(
        Math.abs(cx) <= layout.dimensions.width / 2,
        `Column X=${cx} within bounds`,
      )
      assert.ok(
        Math.abs(cz) <= layout.dimensions.length / 2,
        `Column Z=${cz} within bounds`,
      )
      assert.ok(cy > 0, 'Column Y coordinate is elevated')
    }

    // Active zones for this warehouse
    const expectedZoneCount = initialZones.filter(
      (z) => z.warehouseId === wh.id,
    ).length
    assert.equal(
      layout.zones.length,
      expectedZoneCount,
      `Layout must include all ${expectedZoneCount} zones for ${wh.name}`,
    )

    // Check rack placement inside each zone
    for (const pz of layout.zones) {
      const expectedRacks = initialRacks.filter((r) => r.zoneId === pz.zone.id)
      assert.equal(
        pz.racks.length,
        expectedRacks.length,
        `Zone ${pz.zone.name} must place exactly ${expectedRacks.length} racks`,
      )

      for (const pr of pz.racks) {
        assert.ok(pr.width > 0, 'Rack width is positive')
        assert.ok(pr.depth > 0, 'Rack depth is positive')
        assert.ok(pr.height > 0, 'Rack height is positive')
        assert.ok(pr.levels >= 2, 'Rack has at least 2 storage tiers')
        assert.ok(
          pr.occupancyPct >= 0 && pr.occupancyPct <= 100,
          'Rack occupancy is clamped 0-100%',
        )
      }
    }
  }
})

test('2. Category-Specific Fixtures Placement (Packing, Equipment, Safety)', () => {
  // Test Mumbai Central
  const mumWh = warehouses.find((w) => w.id === 'wh-mum')!
  const mumLayout = generateWarehouse3DLayout(
    mumWh,
    initialZones,
    initialRacks,
    products,
  )

  // Equipment must include forklift and pallet jack
  assert.ok(
    mumLayout.equipment.some((e) => e.type === 'forklift'),
    'Must include reach forklift equipment',
  )
  assert.ok(
    mumLayout.equipment.some((e) => e.type === 'pallet_jack'),
    'Must include pallet jack',
  )
  assert.ok(
    mumLayout.equipment.some((e) => e.type === 'charging_station'),
    'Must include equipment charging station',
  )

  // Safety fixtures must include OSHA yellow cabinet, eyewash, and rack bollards
  assert.ok(
    mumLayout.safetyFixtures.some((s) => s.type === 'safety_cabinet'),
    'Must include yellow OSHA safety cabinet',
  )
  assert.ok(
    mumLayout.safetyFixtures.some((s) => s.type === 'eyewash_station'),
    'Must include emergency eyewash point',
  )
  assert.ok(
    mumLayout.safetyFixtures.some((s) => s.type === 'bollard'),
    'Must include steel impact safety bollards guarding racks',
  )

  // Test Bengaluru South (has Automated Packing Hub zon-blr-a & Quarantine zon-blr-b)
  const blrWh = warehouses.find((w) => w.id === 'wh-blr')!
  const blrLayout = generateWarehouse3DLayout(
    blrWh,
    initialZones,
    initialRacks,
    products,
  )

  assert.ok(
    blrLayout.workstations.length >= 2,
    'Packing zone in Bengaluru must generate specialized packing benches',
  )
  assert.ok(
    blrLayout.safetyFixtures.some((s) => s.type === 'hazard_cage'),
    'Quarantine zone in Bengaluru must generate hazard quarantine enclosure',
  )
})

test('3. Real Data Reconciliation in 3D Layout', () => {
  const mumWh = warehouses.find((w) => w.id === 'wh-mum')!
  const mumLayout = generateWarehouse3DLayout(
    mumWh,
    initialZones,
    initialRacks,
    products,
  )

  // Calculate expected total stock units for Mumbai from active inventory
  const expectedUnits = products.reduce((sum, p) => {
    if (p.warehouseStock && p.warehouseStock['wh-mum'] !== undefined) {
      return sum + p.warehouseStock['wh-mum']
    }
    return p.warehouseId === 'wh-mum' ? sum + p.stock : sum
  }, 0)

  const layoutUnits = mumLayout.zones.reduce((sum, z) => sum + z.actualUnits, 0)
  assert.equal(
    layoutUnits,
    expectedUnits,
    'Sum of zone units in 3D layout equals total warehouse inventory units',
  )

  // Valuation
  const expectedValuation = products.reduce((sum, p) => {
    const stock =
      p.warehouseStock && p.warehouseStock['wh-mum'] !== undefined
        ? p.warehouseStock['wh-mum']
        : p.warehouseId === 'wh-mum'
          ? p.stock
          : 0
    return sum + stock * p.price
  }, 0)

  const layoutValuation = mumLayout.zones.reduce(
    (sum, z) => sum + z.actualValuation,
    0,
  )
  assert.equal(
    layoutValuation,
    expectedValuation,
    'Sum of zone valuations in 3D layout equals total warehouse inventory valuation',
  )
})

test('4. Dynamic Warehouse Fallback and Empty Inventory Safety', () => {
  const dynamicWh = {
    id: 'wh-custom-99',
    name: 'Dynamic Greenfield Depot',
    city: 'Hyderabad',
    capacitySqFt: 25000,
  }

  // No zones or racks configured yet
  const emptyLayout = generateWarehouse3DLayout(dynamicWh, [], [], [])
  assert.equal(emptyLayout.zones.length, 0, 'Zero zones safely handled')
  assert.ok(
    emptyLayout.dimensions.width > 0,
    'Safe fallback dimensions computed',
  )
  assert.ok(
    emptyLayout.workstations.length > 0,
    'Fallback dispatch station placed',
  )
  assert.ok(emptyLayout.equipment.length > 0, 'Fallback equipment placed')
})
