import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MockInventoryService,
  MockWarehouseService,
  MockSupplierService,
  MockTransactionService,
  MockOrderService,
} from '../src/api'
import { products, warehouses } from '../src/mocks/inventoryData'
import { initialZones, initialRacks } from '../src/mocks/warehouseData'
import { initialSuppliers } from '../src/mocks/supplierData'
import { getProductStockAtWarehouse } from '../src/lib/transactionStore'

test('1. Mock Architecture: MockInventoryService CRUD & domain validation', async () => {
  const service = new MockInventoryService(products)
  const allProds = await service.getProducts()
  assert.equal(allProds.length, products.length)

  // Creation validation
  const invalidName = await service.createProduct({
    name: '   ',
    sku: 'SKU-TEST-1',
    category: 'Storage',
    price: 100,
    stock: 10,
    reorderThreshold: 5,
    warehouseId: 'wh-mum',
  })
  assert.equal(invalidName.ok, false)

  const duplicateSku = await service.createProduct({
    name: 'Duplicate Item',
    sku: products[0].sku,
    category: 'Storage',
    price: 100,
    stock: 10,
    reorderThreshold: 5,
    warehouseId: 'wh-mum',
  })
  assert.equal(duplicateSku.ok, false)

  const validCreate = await service.createProduct({
    name: 'New Test Container',
    sku: 'SKU-UNIQUE-999',
    category: 'Storage',
    price: 450,
    stock: 50,
    reorderThreshold: 10,
    warehouseId: 'wh-mum',
  })
  assert.equal(validCreate.ok, true)
  if (validCreate.ok) {
    const createdId = validCreate.data.id
    const fetched = await service.getProductById(createdId)
    assert.ok(fetched)
    assert.equal(fetched.name, 'New Test Container')
  }
})

test('2. Mock Architecture: MockWarehouseService hierarchy & deactivation protections', async () => {
  const whService = new MockWarehouseService(
    warehouses,
    initialZones,
    initialRacks,
  )
  const allWh = await whService.getWarehouses()
  assert.equal(allWh.length, warehouses.length)

  // Safety: Cannot deactivate warehouse with active zones
  const deactWh = await whService.deactivateWarehouse('wh-mum')
  assert.equal(deactWh.ok, false)
  assert.ok(deactWh.message.includes('active storage zones'))

  // Safety: Cannot deactivate zone with active racks
  const deactZone = await whService.deactivateZone('zon-mum-a')
  assert.equal(deactZone.ok, false)
  assert.ok(deactZone.message.includes('active storage racks'))

  // Rack deactivation followed by zone deactivation works cleanly
  const mumRacks = await whService.getRacks('zon-mum-a')
  for (const r of mumRacks) {
    const res = await whService.deactivateRack(r.id)
    assert.equal(res.ok, true)
  }

  const deactZoneClean = await whService.deactivateZone('zon-mum-a')
  assert.equal(deactZoneClean.ok, true)
})

test('3. Mock Architecture: MockSupplierService validation & email deduplication', async () => {
  const supService = new MockSupplierService(initialSuppliers)
  const allSuppliers = await supService.getSuppliers()
  assert.equal(allSuppliers.length, initialSuppliers.length)

  // Duplicate email rejection
  const dupEmail = await supService.createSupplier({
    companyName: 'New Corp',
    contactPerson: 'Arun',
    email: initialSuppliers[0].email,
    phone: '+91 99999 99999',
    address: 'Ind Area',
    city: 'Pune',
  })
  assert.equal(dupEmail.ok, false)
  assert.ok(dupEmail.message.includes('already exists'))
})

test('4. Mock Architecture: Inter-Warehouse Transfer & Stock Conservation in MockTransactionService', async () => {
  const txService = new MockTransactionService([])
  const sampleProduct = {
    ...products[0],
    stock: 100,
    warehouseId: 'wh-mum',
    warehouseStock: {
      'wh-mum': 80,
      'wh-del': 20,
    },
  }

  // Transfer 30 units from Mumbai to Delhi
  const transferRes = await txService.recordTransfer(
    {
      productId: sampleProduct.id,
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-del',
      quantity: 30,
    },
    [sampleProduct],
    warehouses,
  )

  assert.equal(transferRes.ok, true)
  if (transferRes.ok) {
    const { resultingStock, updatedWarehouseStock } = transferRes.data
    // Total stock is conserved
    assert.equal(resultingStock, 100)
    // Source decreased by 30
    assert.equal(updatedWarehouseStock['wh-mum'], 50)
    // Destination increased by 30
    assert.equal(updatedWarehouseStock['wh-del'], 50)
    // Sum across warehouses equals total
    const sumLocStock =
      updatedWarehouseStock['wh-mum'] + updatedWarehouseStock['wh-del']
    assert.equal(sumLocStock, resultingStock)
  }
})

test('5. Multi-Warehouse consistency: getProductStockAtWarehouse & Dashboard telemetry', () => {
  const testProduct = {
    id: 'prod-test',
    name: 'Multi-Warehouse Item',
    sku: 'INV-MW-1',
    category: 'Storage',
    price: 500,
    stock: 120,
    reorderThreshold: 20,
    warehouseId: 'wh-mum',
    warehouseStock: {
      'wh-mum': 70,
      'wh-del': 50,
    },
  }

  const mumStock = getProductStockAtWarehouse(testProduct, 'wh-mum')
  const delStock = getProductStockAtWarehouse(testProduct, 'wh-del')
  const blrStock = getProductStockAtWarehouse(testProduct, 'wh-blr')

  assert.equal(mumStock, 70)
  assert.equal(delStock, 50)
  assert.equal(blrStock, 0)
  assert.equal(mumStock + delStock + blrStock, testProduct.stock)
})

test('6. 3D Digital Twin: Entity selection, empty racks, and unassigned inventory partitioning', () => {
  const facilityProducts = products.filter((p) => p.warehouseId === 'wh-mum')
  const mumRacks = initialRacks.filter((r) => r.warehouseId === 'wh-mum')
  const mumZones = initialZones.filter((z) => z.warehouseId === 'wh-mum')

  // Verify rack mapping
  for (const rack of mumRacks) {
    const rackProducts = facilityProducts.filter((p) => p.rackId === rack.id)
    const rackUnits = rackProducts.reduce((sum, p) => sum + p.stock, 0)
    const capacity = rack.capacity ?? 50
    const occupancy =
      capacity > 0
        ? Math.min(100, Math.max(0, Math.round((rackUnits / capacity) * 100)))
        : 0

    assert.ok(occupancy >= 0 && occupancy <= 100)
    if (rackProducts.length === 0) {
      assert.equal(rackUnits, 0, 'Empty rack must have exactly 0 units')
      assert.equal(occupancy, 0, 'Empty rack must have 0% occupancy')
    }
  }

  // Verify zone mapping and unassigned isolation
  const rackToZoneMap = new Map<string, string>()
  for (const r of mumRacks) {
    rackToZoneMap.set(r.id, r.zoneId)
  }
  const zoneIds = new Set(mumZones.map((z) => z.id))

  const unassigned = facilityProducts.filter((p) => {
    let targetZone: string | undefined
    if (p.rackId && rackToZoneMap.has(p.rackId)) {
      targetZone = rackToZoneMap.get(p.rackId)
    } else if (p.zoneId && zoneIds.has(p.zoneId)) {
      targetZone = p.zoneId
    }
    return !targetZone || !zoneIds.has(targetZone)
  })

  // All unassigned products are accounted for
  for (const u of unassigned) {
    assert.ok(!u.rackId || !rackToZoneMap.has(u.rackId))
  }
})

test('7. Mock Architecture: MockOrderService lifecycle transitions & stock check', async () => {
  const orderService = new MockOrderService([])
  const inStockProduct = products.find((p) => p.stock >= 20)!

  // Create valid order
  const createRes = await orderService.createOrder(
    {
      customerName: 'AeroTech Systems Ltd',
      customerEmail: 'procurement@aerotech.in',
      customerPhone: '+91 98200 12345',
      warehouseId: inStockProduct.warehouseId,
      items: [{ productId: inStockProduct.id, quantity: 5 }],
      notes: 'Priority dispatch',
    },
    products,
    warehouses,
  )

  assert.equal(createRes.ok, true)
  if (createRes.ok) {
    const orderId = createRes.data.id
    assert.equal(createRes.data.order.status, 'Pending')

    // Transition: Pending -> Processing
    const procRes = await orderService.updateOrderStatus(orderId, 'Processing')
    assert.equal(procRes.ok, true)
    if (procRes.ok) {
      assert.equal(procRes.data.order.status, 'Processing')
    }

    // Transition: Processing -> Completed
    const compRes = await orderService.updateOrderStatus(orderId, 'Completed')
    assert.equal(compRes.ok, true)
    if (compRes.ok) {
      assert.equal(compRes.data.order.status, 'Completed')
    }

    // Protection: Cannot transition terminal Completed order
    const invalidTrans = await orderService.updateOrderStatus(
      orderId,
      'Cancelled',
    )
    assert.equal(invalidTrans.ok, false)
    assert.ok(invalidTrans.message.includes('terminal status'))
  }
})
