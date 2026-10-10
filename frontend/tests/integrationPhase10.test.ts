import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  validateOrderInput,
  type CreateOrderInput,
} from '../src/lib/orderStore'
import {
  validateAdjustmentInput,
  validateStockInInput,
  validateStockOutInput,
  validateTransferInput,
} from '../src/lib/transactionStore'
import {
  calculateInventoryValuation,
  calculateMovementSummary,
  deriveInventoryAlerts,
  escapeCsvCell,
} from '../src/lib/reportUtils'
import {
  warehouses,
  type Product,
  type Warehouse,
} from '../src/mocks/inventoryData'
import type { StockTransactionRecord } from '../src/mocks/transactionData'

test('Phase 10 Integration: 1. Dynamic warehouse validation across Orders and Warehouse store', () => {
  const dynamicWarehouses: Warehouse[] = [
    {
      id: 'wh-custom-delta',
      name: 'Delta Hub Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      postalCode: '500081',
      status: 'Active',
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    },
  ]

  const mockProduct: Product = {
    id: 'prod-delta-1',
    name: 'Industrial Valve',
    sku: 'VALVE-001',
    category: 'Equipment',
    warehouseId: 'wh-custom-delta',
    stock: 25,
    reorderThreshold: 5,
    price: 450,
  }

  const validOrder: CreateOrderInput = {
    customerName: 'AeroTech Systems',
    customerEmail: 'ops@aerotech.in',
    customerPhone: '+91 99887 76655',
    warehouseId: 'wh-custom-delta',
    items: [{ productId: 'prod-delta-1', quantity: 10 }],
  }

  // Succeeds when dynamic warehouse list is passed
  const successResult = validateOrderInput(
    validOrder,
    [mockProduct],
    dynamicWarehouses,
  )
  assert.equal(
    successResult.ok,
    true,
    'Order should be accepted with dynamic warehouse',
  )

  // Fails when targeting warehouse that is not in the active store
  const invalidWarehouseOrder: CreateOrderInput = {
    ...validOrder,
    warehouseId: 'wh-non-existent',
  }
  const failResult = validateOrderInput(
    invalidWarehouseOrder,
    [mockProduct],
    dynamicWarehouses,
  )
  assert.equal(failResult.ok, false)
  if (!failResult.ok) {
    assert.match(failResult.message, /valid warehouse/i)
  }
})

test('Phase 10 Integration: 2. Stock movement operations and strict conservation laws', () => {
  const primaryWarehouseId = warehouses[0].id
  const product: Product = {
    id: 'prod-conserve-1',
    name: 'Heavy Duty Caster Wheels',
    sku: 'CST-001',
    category: 'Hardware',
    warehouseId: primaryWarehouseId,
    stock: 100,
    reorderThreshold: 20,
    price: 320,
  }

  // Stock In
  const inRes = validateStockInInput(
    {
      productId: product.id,
      quantity: 50,
      destinationWarehouseId: primaryWarehouseId,
      reference: 'PO-2026-001',
    },
    [product],
    warehouses,
  )
  assert.equal(inRes.ok, true)

  // Stock Out cannot exceed stock (negative stock prevention)
  const outResOverflow = validateStockOutInput(
    {
      productId: product.id,
      quantity: 101,
      sourceWarehouseId: primaryWarehouseId,
      reference: 'SO-2026-001',
    },
    [product],
    warehouses,
  )
  assert.equal(outResOverflow.ok, false)
  if (!outResOverflow.ok) {
    assert.match(outResOverflow.message, /insufficient stock/i)
  }

  // Valid Stock Out
  const outRes = validateStockOutInput(
    {
      productId: product.id,
      quantity: 30,
      sourceWarehouseId: primaryWarehouseId,
      reference: 'SO-2026-001',
    },
    [product],
    warehouses,
  )
  assert.equal(outRes.ok, true)

  // Adjustment applies correct signed delta
  const adjRes = validateAdjustmentInput(
    {
      productId: product.id,
      mode: 'delta',
      quantity: -20,
      warehouseId: primaryWarehouseId,
      reason: 'Damaged in transit',
    },
    [product],
    warehouses,
  )
  assert.equal(adjRes.ok, true)
  if (adjRes.ok) {
    assert.equal(adjRes.delta, -20)
    assert.equal(adjRes.resultingStock, 80)
  }

  // Adjustment cannot produce negative stock
  const adjNegative = validateAdjustmentInput(
    {
      productId: product.id,
      mode: 'delta',
      quantity: -105,
      warehouseId: primaryWarehouseId,
      reason: 'Audit reconciliation',
    },
    [product],
    warehouses,
  )
  assert.equal(adjNegative.ok, false)
  if (!adjNegative.ok) {
    assert.match(adjNegative.message, /negative/i)
  }
})

test('Phase 10 Integration: 3. Inter-warehouse transfer preserves organization-wide inventory balance', () => {
  const sourceWh = warehouses[0].id
  const destWh = warehouses[1].id

  const prodWithWhStock: Product = {
    id: 'prod-multi-wh',
    name: 'Precision Bearings',
    sku: 'BRG-900',
    category: 'Hardware',
    warehouseId: sourceWh,
    stock: 80,
    reorderThreshold: 10,
    price: 120,
    warehouseStock: {
      [sourceWh]: 50,
      [destWh]: 30,
    },
  }

  // Valid transfer from source to destination
  const transferRes = validateTransferInput(
    {
      productId: prodWithWhStock.id,
      sourceWarehouseId: sourceWh,
      destinationWarehouseId: destWh,
      quantity: 25,
      notes: 'Replenishing regional depot',
    },
    [prodWithWhStock],
    warehouses,
  )

  assert.equal(
    transferRes.ok,
    true,
    'Transfer validation must succeed when stock is available',
  )

  // Transfer cannot exceed source warehouse balance
  const transferOverflow = validateTransferInput(
    {
      productId: prodWithWhStock.id,
      sourceWarehouseId: sourceWh,
      destinationWarehouseId: destWh,
      quantity: 51,
    },
    [prodWithWhStock],
    warehouses,
  )
  assert.equal(transferOverflow.ok, false)
  if (!transferOverflow.ok) {
    assert.match(transferOverflow.message, /insufficient stock/i)
  }
})

test('Phase 10 Integration: 4. Order line aggregation prevents overselling duplicate lines', () => {
  const limitedProduct: Product = {
    id: 'prod-scarce',
    name: 'Lithium Battery Pack',
    sku: 'BAT-LITH-01',
    category: 'Equipment',
    warehouseId: warehouses[0].id,
    stock: 15,
    reorderThreshold: 5,
    price: 1200,
  }

  // Order with two separate lines of 10 units each for a product with 15 units available
  const duplicateOrder: CreateOrderInput = {
    customerName: 'GreenPower Ltd',
    customerEmail: 'procure@greenpower.in',
    customerPhone: '+91 91234 56789',
    warehouseId: warehouses[0].id,
    items: [
      { productId: 'prod-scarce', quantity: 10 },
      { productId: 'prod-scarce', quantity: 10 },
    ],
  }

  const result = validateOrderInput(
    duplicateOrder,
    [limitedProduct],
    warehouses,
  )
  assert.equal(
    result.ok,
    false,
    'Combined quantity of 20 exceeds available stock of 15',
  )
  if (!result.ok) {
    assert.match(result.message, /Combined quantity/i)
    assert.match(result.message, /exceeds available stock/i)
  }
})

test('Phase 10 Integration: 5. CSV formula-injection protection across report exports', () => {
  const dangerousStrings = [
    '=cmd|"/C calc"!A0',
    '+1+2+cmd|"/C calc"!A0',
    '-1+2+cmd|"/C calc"!A0',
    '@SUM(1+1)*cmd|"/C calc"!A0',
    '\tDDE("cmd";"calc")',
    '\r=HYPERLINK("http://attacker.com")',
  ]

  for (const malicious of dangerousStrings) {
    const escaped = escapeCsvCell(malicious)
    // Must begin with a single quote to neutralize formula execution in Excel/Calc
    assert.match(
      escaped,
      /^"'/,
      `Dangerous cell starting with formula character must be sanitized: ${malicious}`,
    )
  }

  // Standard safe strings should not be prepended with a quote if not formula characters
  assert.equal(
    escapeCsvCell('Invora Warehouse Standard'),
    'Invora Warehouse Standard',
  )
  assert.equal(escapeCsvCell('Widget, Model X'), '"Widget, Model X"')
})

test('Phase 10 Integration: 6. Reports and Alerts reconciliation with live store calculations', () => {
  // Test valuation math matches sum of stock * price
  const sampleProducts: Product[] = [
    {
      id: 'p1',
      name: 'Item 1',
      sku: 'SKU1',
      category: 'CatA',
      warehouseId: warehouses[0].id,
      stock: 10,
      reorderThreshold: 2,
      price: 100,
    },
    {
      id: 'p2',
      name: 'Item 2',
      sku: 'SKU2',
      category: 'CatB',
      warehouseId: warehouses[0].id,
      stock: 5,
      reorderThreshold: 10, // low stock: 5 <= 10
      price: 200,
    },
    {
      id: 'p3',
      name: 'Item 3',
      sku: 'SKU3',
      category: 'CatA',
      warehouseId: warehouses[0].id,
      stock: 0, // out of stock: stock === 0
      reorderThreshold: 5,
      price: 50,
    },
  ]

  const valuation = calculateInventoryValuation(sampleProducts)
  assert.equal(valuation.totalValue, 10 * 100 + 5 * 200 + 0 * 50)
  assert.equal(valuation.totalUnits, 15)
  assert.equal(valuation.totalProducts, 3)

  // Verify alerts classification
  const alerts = deriveInventoryAlerts(sampleProducts, [], warehouses)
  const oosAlerts = alerts.filter((a) => a.type === 'out_of_stock')
  const lowAlerts = alerts.filter((a) => a.type === 'low_stock')
  assert.equal(oosAlerts.length, 1)
  assert.equal(lowAlerts.length, 1)

  // Net zero for transfer transactions in movement summary
  const sampleTransfers: StockTransactionRecord[] = [
    {
      id: 'TXN-TR-1',
      timestamp: '2026-10-01T10:00:00Z',
      type: 'Transfer',
      productId: 'p1',
      productName: 'Item 1',
      sku: 'SKU1',
      warehouseId: warehouses[0].id,
      warehouseName: warehouses[0].name,
      destinationWarehouseId: warehouses[1].id,
      destinationWarehouseName: warehouses[1].name,
      quantity: 5,
      quantityDelta: -5,
      previousQuantity: 15,
      resultingQuantity: 10,
      user: 'admin',
    },
    {
      id: 'TXN-TR-2',
      timestamp: '2026-10-01T10:00:00Z',
      type: 'Transfer',
      productId: 'p1',
      productName: 'Item 1',
      sku: 'SKU1',
      warehouseId: warehouses[1].id,
      warehouseName: warehouses[1].name,
      destinationWarehouseId: warehouses[0].id,
      destinationWarehouseName: warehouses[0].name,
      quantity: 5,
      quantityDelta: 5,
      previousQuantity: 10,
      resultingQuantity: 15,
      user: 'admin',
    },
  ]

  const summary = calculateMovementSummary(sampleTransfers)
  // Transfers within the organization must have a net impact of zero
  assert.equal(
    summary.netMovementUnits,
    0,
    'Transfer transactions net movement must be zero',
  )
})
