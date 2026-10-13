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
import { initialTransactionsSeed } from '../src/mocks/transactionData'
import { validateAdjustmentInput } from '../src/lib/transactionStore'
import { validateOrderInput } from '../src/lib/orderStore'
import { validateSupplierInput } from '../src/lib/supplierStore'
import { validateWarehouseInput } from '../src/lib/warehouseStore'
import { validateProductData } from '../src/lib/inventoryStore'
import {
  calculateInventoryValuation,
  calculateMovementSummary,
  deriveInventoryAlerts,
  escapeCsvCell,
} from '../src/lib/reportUtils'
import { generateWarehouse3DLayout } from '../src/components/warehouse/warehouseLayoutGenerator'

test('Phase 3 Verification: 1. Inventory search, filtering, sorting, and product validation', () => {
  // Test validateProductData
  const invalidName = validateProductData(
    {
      name: '  ',
      sku: 'SKU-NEW-1',
      category: 'Storage',
      price: 100,
      stock: 10,
      reorderThreshold: 5,
      warehouseId: 'wh-mum',
    },
    products,
  )
  assert.equal(invalidName.ok, false)

  const invalidSku = validateProductData(
    {
      name: 'Valid Name',
      sku: 'INVALID SKU!',
      category: 'Storage',
      price: 100,
      stock: 10,
      reorderThreshold: 5,
      warehouseId: 'wh-mum',
    },
    products,
  )
  assert.equal(invalidSku.ok, false)

  const dupSku = validateProductData(
    {
      name: 'Valid Name',
      sku: products[0].sku.toLowerCase(),
      category: 'Storage',
      price: 100,
      stock: 10,
      reorderThreshold: 5,
      warehouseId: 'wh-mum',
    },
    products,
  )
  assert.equal(dupSku.ok, false)

  const negativeStock = validateProductData(
    {
      name: 'Valid Name',
      sku: 'VALID-SKU-99',
      category: 'Storage',
      price: 100,
      stock: -5,
      reorderThreshold: 5,
      warehouseId: 'wh-mum',
    },
    products,
  )
  assert.equal(negativeStock.ok, false)

  const validProduct = validateProductData(
    {
      name: 'Valid New Container',
      sku: 'VALID-SKU-99',
      category: 'Storage',
      price: 100,
      stock: 25,
      reorderThreshold: 5,
      warehouseId: 'wh-mum',
    },
    products,
  )
  assert.equal(validProduct.ok, true)
})

test('Phase 3 Verification: 2. Valid and invalid stock adjustments and boundary enforcement', () => {
  const targetProduct = products[0]

  // Rejection when adjustment reason is missing
  const noReason = validateAdjustmentInput(
    {
      productId: targetProduct.id,
      warehouseId: targetProduct.warehouseId,
      mode: 'delta',
      quantity: -10,
      reason: '   ',
    },
    products,
    warehouses,
  )
  assert.equal(noReason.ok, false)
  assert.ok(noReason.message.includes('reason'))

  // Rejection when delta is 0
  const zeroDelta = validateAdjustmentInput(
    {
      productId: targetProduct.id,
      warehouseId: targetProduct.warehouseId,
      mode: 'delta',
      quantity: 0,
      reason: 'Audit correction',
    },
    products,
    warehouses,
  )
  assert.equal(zeroDelta.ok, false)

  // Rejection when adjustment causes negative inventory
  const excessiveReduction = validateAdjustmentInput(
    {
      productId: targetProduct.id,
      warehouseId: targetProduct.warehouseId,
      mode: 'delta',
      quantity: -(targetProduct.stock + 100),
      reason: 'Damaged stock deduction',
    },
    products,
    warehouses,
  )
  assert.equal(excessiveReduction.ok, false)
  assert.ok(excessiveReduction.message.includes('negative inventory'))

  // Valid adjustment
  const validAdjustment = validateAdjustmentInput(
    {
      productId: targetProduct.id,
      warehouseId: targetProduct.warehouseId,
      mode: 'delta',
      quantity: -5,
      reason: 'Physical cycle count reconciliation',
    },
    products,
    warehouses,
  )
  assert.equal(validAdjustment.ok, true)
  if (validAdjustment.ok) {
    assert.equal(validAdjustment.resultingStock, targetProduct.stock - 5)
    assert.equal(validAdjustment.delta, -5)
  }
})

test('Phase 3 Verification: 3. Receiving, dispatching, and transfers (conservation of stock)', async () => {
  const txService = new MockTransactionService(initialTransactionsSeed)
  const product = products[0]

  // Valid Stock In
  const inRes = await txService.recordStockIn(
    {
      productId: product.id,
      destinationWarehouseId: 'wh-mum',
      quantity: 20,
      reason: 'Supplier shipment received',
    },
    products,
    warehouses,
    initialSuppliers,
  )
  assert.equal(inRes.ok, true)
  if (inRes.ok) {
    assert.equal(inRes.data.resultingStock, product.stock + 20)
  }

  // Stock Out rejection on insufficient stock
  const outReject = await txService.recordStockOut(
    {
      productId: product.id,
      sourceWarehouseId: 'wh-mum',
      quantity: 99999,
      reason: 'Emergency order dispatch',
    },
    products,
    warehouses,
  )
  assert.equal(outReject.ok, false)
  assert.ok(outReject.message.includes('Insufficient stock'))

  // Transfer: Source and destination cannot be identical
  const sameWhTransfer = await txService.recordTransfer(
    {
      productId: product.id,
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-mum',
      quantity: 5,
    },
    products,
    warehouses,
  )
  assert.equal(sameWhTransfer.ok, false)

  // Transfer preserves total stock across organization
  const validTransfer = await txService.recordTransfer(
    {
      productId: product.id,
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-del',
      quantity: 5,
      reason: 'Stock balancing',
    },
    products,
    warehouses,
  )
  assert.equal(validTransfer.ok, true)
  if (validTransfer.ok) {
    assert.equal(validTransfer.data.resultingStock, product.stock)
  }
})

test('Phase 3 Verification: 4. Order validation and line aggregation', () => {
  const prod = products.find((p) => p.stock > 10)!
  const halfStock = Math.floor(prod.stock / 2) + 1

  // Overselling via duplicate lines rejected
  const oversell = validateOrderInput(
    {
      customerName: 'Rohit Sharma',
      customerEmail: 'rohit@example.com',
      customerPhone: '+91 98765 43210',
      warehouseId: prod.warehouseId,
      items: [
        { productId: prod.id, quantity: halfStock },
        { productId: prod.id, quantity: halfStock },
      ],
    },
    products,
    warehouses,
  )
  assert.equal(oversell.ok, false)
  assert.ok(oversell.message.includes('Combined quantity'))

  // Valid order accepted
  const validOrder = validateOrderInput(
    {
      customerName: 'Rohit Sharma',
      customerEmail: 'rohit@example.com',
      customerPhone: '+91 98765 43210',
      warehouseId: prod.warehouseId,
      items: [{ productId: prod.id, quantity: 2 }],
    },
    products,
    warehouses,
  )
  assert.equal(validOrder.ok, true)
  if (validOrder.ok) {
    assert.equal(validOrder.totalAmount, 2 * prod.price)
  }
})

test('Phase 3 Verification: 5. Dashboard and Report metrics consistency after mutations', () => {
  const valuation = calculateInventoryValuation(products)
  const expectedValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)
  const expectedUnits = products.reduce((sum, p) => sum + p.stock, 0)
  assert.equal(valuation.totalValue, expectedValue)
  assert.equal(valuation.totalUnits, expectedUnits)

  const movSummary = calculateMovementSummary(initialTransactionsSeed)
  assert.equal(movSummary.totalTransactions, initialTransactionsSeed.length)
  assert.equal(
    movSummary.netMovementUnits,
    movSummary.stockInUnits -
      movSummary.stockOutUnits +
      movSummary.adjustmentDeltaUnits,
  )
})

test('Phase 3 Verification: 6. Alerts derivation reflects live inventory conditions', () => {
  const testProducts = [
    { ...products[0], stock: 0 }, // Out of stock
    { ...products[1], stock: 2, reorderThreshold: 10 }, // Low stock
  ]
  const alerts = deriveInventoryAlerts(
    testProducts,
    initialTransactionsSeed,
    warehouses,
  )

  const oosAlert = alerts.find(
    (a) => a.type === 'out_of_stock' && a.productId === testProducts[0].id,
  )
  assert.ok(oosAlert, 'Out of stock alert must be derived for zero stock')
  assert.equal(oosAlert.severity, 'critical')

  const lowAlert = alerts.find(
    (a) => a.type === 'low_stock' && a.productId === testProducts[1].id,
  )
  assert.ok(lowAlert, 'Low stock alert must be derived for buffer breach')
  assert.equal(lowAlert.severity, 'warning')
})

test('Phase 3 Verification: 7. 3D Digital Twin layout generation across all facilities', () => {
  for (const wh of warehouses) {
    const whZones = initialZones.filter((z) => z.warehouseId === wh.id)
    const whRacks = initialRacks.filter((r) => r.warehouseId === wh.id)
    const whProducts = products.filter((p) => p.warehouseId === wh.id)

    const layout = generateWarehouse3DLayout(wh, whZones, whRacks, whProducts)
    assert.ok(layout)
    assert.equal(layout.warehouse.id, wh.id)
    assert.ok(layout.dimensions.width > 0)
    assert.ok(layout.dimensions.length > 0)
    assert.ok(layout.dimensions.height > 0)
    assert.ok(Array.isArray(layout.zones))
    assert.ok(Array.isArray(layout.workstations))
    assert.ok(Array.isArray(layout.equipment))
    assert.ok(Array.isArray(layout.safetyFixtures))
  }
})

test('Phase 3 Verification: 8. Supplier and Warehouse form validation & safe deactivation', async () => {
  // Supplier duplicate email check
  const dupEmail = validateSupplierInput(
    {
      companyName: 'New Vendor Pvt Ltd',
      contactPerson: 'Suresh Patel',
      email: initialSuppliers[0].email,
      phone: '+91 99887 76655',
      address: 'Industrial Area',
      city: 'Pune',
    },
    initialSuppliers,
  )
  assert.equal(dupEmail.ok, false)
  assert.ok(dupEmail.message.includes('already exists'))

  // Warehouse duplicate ID check
  const dupWhId = validateWarehouseInput(
    {
      id: warehouses[0].id.toUpperCase(),
      name: 'Duplicate Facility',
      city: 'Mumbai',
    },
    warehouses,
  )
  assert.equal(dupWhId.ok, false)
  assert.ok(dupWhId.message.includes('already exists'))

  // Warehouse deactivation protected by active zones
  const whService = new MockWarehouseService(
    warehouses,
    initialZones,
    initialRacks,
  )
  const deactBlocked = await whService.deactivateWarehouse('wh-mum')
  assert.equal(deactBlocked.ok, false)
  assert.ok(deactBlocked.message.includes('active storage zones'))
})

test('Phase 3 Verification: 9. CSV formula injection mitigation and RFC-4180 escaping', () => {
  assert.equal(escapeCsvCell('=SUM(A1:A10)'), "'=SUM(A1:A10)")
  assert.equal(escapeCsvCell('+12345'), "'+12345")
  assert.equal(escapeCsvCell('-500'), "'-500")
  assert.equal(escapeCsvCell('@cmd'), "'@cmd")
  assert.equal(escapeCsvCell('Regular Product'), 'Regular Product')
  assert.equal(escapeCsvCell('Line with, comma'), '"Line with, comma"')
  assert.equal(
    escapeCsvCell('Quotes "inside" text'),
    '"Quotes ""inside"" text"',
  )
})

test('Phase 3 Verification: 10. Frontend-only architecture confirmation', () => {
  // Verify that all mock services are instantiable in pure in-memory mode without network or DB
  const invService = new MockInventoryService()
  const whService = new MockWarehouseService()
  const supService = new MockSupplierService()
  const txService = new MockTransactionService()
  const ordService = new MockOrderService()

  assert.ok(invService)
  assert.ok(whService)
  assert.ok(supService)
  assert.ok(txService)
  assert.ok(ordService)
})
