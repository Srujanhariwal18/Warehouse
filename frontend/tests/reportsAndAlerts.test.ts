import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  calculateCategoryValuation,
  calculateInventoryValuation,
  calculateMovementByWarehouse,
  calculateMovementSummary,
  calculateMovementTrends,
  calculateWarehouseDistribution,
  classifyProductStockStatus,
  deriveInventoryAlerts,
  escapeCsvCell,
  filterTransactions,
  generateAlertsReportCsv,
  generateInventoryReportCsv,
  generateMovementReportCsv,
  getTopValuedProducts,
  isDateInRange,
  type MovementFilters,
} from '../src/lib/reportUtils'
import {
  products as initialProducts,
  warehouses,
  type Product,
} from '../src/mocks/inventoryData'
import {
  initialTransactionsSeed,
  type StockTransactionRecord,
} from '../src/mocks/transactionData'
import { validateOrderInput } from '../src/lib/orderStore'
import { validateSupplierInput } from '../src/lib/supplierStore'
import { validateWarehouseInput } from '../src/lib/warehouseStore'
import {
  validateAdjustmentInput,
  validateStockInInput,
  validateStockOutInput,
  validateTransferInput,
} from '../src/lib/transactionStore'

// Reference anchor date for deterministic testing
const REF_DATE = new Date('2026-10-10T12:00:00.000Z')

test('1. Inventory valuation from actual product values', () => {
  const valuation = calculateInventoryValuation(initialProducts)

  // Verify total products
  assert.equal(valuation.totalProducts, initialProducts.length)

  // Verify exact math: sum of stock and sum of stock * price
  let expectedUnits = 0
  let expectedValue = 0
  for (const p of initialProducts) {
    expectedUnits += p.stock
    expectedValue += p.stock * p.price
  }

  assert.equal(valuation.totalUnits, expectedUnits)
  assert.equal(valuation.totalValue, expectedValue)
  assert.equal(
    valuation.outOfStockCount +
      valuation.lowStockCount +
      valuation.healthyStockCount,
    initialProducts.length,
  )

  // Verify getTopValuedProducts sorting and limits
  const top10 = getTopValuedProducts(initialProducts, 10)
  assert.equal(top10.length, 10)
  assert.ok(top10[0].totalValue >= top10[1].totalValue)
})

test('2. Zero-stock and empty-product datasets', () => {
  // 2a. Empty product list
  const emptyValuation = calculateInventoryValuation([])
  assert.equal(emptyValuation.totalProducts, 0)
  assert.equal(emptyValuation.totalUnits, 0)
  assert.equal(emptyValuation.totalValue, 0)
  assert.equal(emptyValuation.outOfStockCount, 0)
  assert.equal(emptyValuation.lowStockCount, 0)
  assert.equal(emptyValuation.healthyStockCount, 0)

  // 2b. Zero-stock product list
  const zeroProducts: Product[] = [
    {
      id: 'p-zero-1',
      name: 'Zero Item 1',
      sku: 'SKU-001',
      category: 'Test',
      price: 500,
      stock: 0,
      reorderThreshold: 10,
      warehouseId: 'wh-mum',
    },
    {
      id: 'p-zero-2',
      name: 'Zero Item 2',
      sku: 'SKU-002',
      category: 'Test',
      price: 1500,
      stock: 0,
      reorderThreshold: 20,
      warehouseId: 'wh-del',
    },
  ]

  const zeroValuation = calculateInventoryValuation(zeroProducts)
  assert.equal(zeroValuation.totalProducts, 2)
  assert.equal(zeroValuation.totalUnits, 0)
  assert.equal(zeroValuation.totalValue, 0)
  assert.equal(zeroValuation.outOfStockCount, 2)
  assert.equal(zeroValuation.lowStockCount, 0)
  assert.equal(zeroValuation.healthyStockCount, 0)
})

test('3. Category totals', () => {
  const catVal = calculateCategoryValuation(initialProducts)
  assert.ok(catVal.length > 0)

  // Sum of category stocks must match total inventory units
  const totalCatStock = catVal.reduce((acc, c) => acc + c.totalStock, 0)
  const totalCatValue = catVal.reduce((acc, c) => acc + c.totalValue, 0)
  const totalCatProducts = catVal.reduce((acc, c) => acc + c.productCount, 0)

  const overall = calculateInventoryValuation(initialProducts)
  assert.equal(totalCatStock, overall.totalUnits)
  assert.equal(totalCatValue, overall.totalValue)
  assert.equal(totalCatProducts, overall.totalProducts)

  // Sum of percentages should be approx 100%
  const totalPct = catVal.reduce((acc, c) => acc + c.percentageOfValue, 0)
  assert.ok(totalPct >= 99 && totalPct <= 101)
})

test('4. Warehouse aggregation for legacy products', () => {
  // Legacy products have only warehouseId and stock
  const legacyProducts: Product[] = [
    {
      id: 'p-leg-1',
      name: 'Legacy 1',
      sku: 'LEG-1',
      category: 'Storage',
      price: 100,
      stock: 50,
      reorderThreshold: 10,
      warehouseId: 'wh-mum',
    },
    {
      id: 'p-leg-2',
      name: 'Legacy 2',
      sku: 'LEG-2',
      category: 'Safety',
      price: 200,
      stock: 30,
      reorderThreshold: 10,
      warehouseId: 'wh-del',
    },
  ]

  const dist = calculateWarehouseDistribution(legacyProducts, warehouses)
  const mum = dist.find((w) => w.warehouseId === 'wh-mum')
  const del = dist.find((w) => w.warehouseId === 'wh-del')
  const blr = dist.find((w) => w.warehouseId === 'wh-blr')

  assert.equal(mum?.totalStock, 50)
  assert.equal(mum?.totalValue, 5000)
  assert.equal(del?.totalStock, 30)
  assert.equal(del?.totalValue, 6000)
  assert.equal(blr?.totalStock, 0)
  assert.equal(blr?.totalValue, 0)
})

test('5. Warehouse aggregation for products with warehouseStock', () => {
  // Products with warehouseStock multi-facility map
  const distributedProducts: Product[] = [
    {
      id: 'p-dist-1',
      name: 'Distributed Item',
      sku: 'DST-1',
      category: 'Equipment',
      price: 1000,
      stock: 100, // 40 mum + 60 del
      reorderThreshold: 20,
      warehouseId: 'wh-mum',
      warehouseStock: {
        'wh-mum': 40,
        'wh-del': 60,
      },
    },
  ]

  const dist = calculateWarehouseDistribution(distributedProducts, warehouses)
  const mum = dist.find((w) => w.warehouseId === 'wh-mum')
  const del = dist.find((w) => w.warehouseId === 'wh-del')

  assert.equal(mum?.totalStock, 40)
  assert.equal(mum?.totalValue, 40000)
  assert.equal(del?.totalStock, 60)
  assert.equal(del?.totalValue, 60000)
})

test('6. Prevention of double-counting total and warehouse stock', () => {
  // A mixed dataset of legacy and distributed items
  const mixedProducts: Product[] = [
    {
      id: 'p-1',
      name: 'Item 1',
      sku: 'M-1',
      category: 'Storage',
      price: 50,
      stock: 80,
      reorderThreshold: 10,
      warehouseId: 'wh-mum',
    },
    {
      id: 'p-2',
      name: 'Item 2',
      sku: 'M-2',
      category: 'Storage',
      price: 150,
      stock: 120,
      reorderThreshold: 10,
      warehouseId: 'wh-blr',
      warehouseStock: {
        'wh-mum': 30,
        'wh-del': 40,
        'wh-blr': 50,
      },
    },
  ]

  const totalCatalogStock = mixedProducts.reduce((acc, p) => acc + p.stock, 0)
  const dist = calculateWarehouseDistribution(mixedProducts, warehouses)
  const sumOfWarehouseStock = dist.reduce((acc, w) => acc + w.totalStock, 0)

  // Must strictly equal! No double counting between product.stock and warehouseStock
  assert.equal(sumOfWarehouseStock, totalCatalogStock)
  assert.equal(sumOfWarehouseStock, 200)
})

test('7. Date filtering, boundaries, invalid ranges, and empty history', () => {
  // 7a. 'all' range
  assert.equal(
    isDateInRange('2026-01-01', 'all', undefined, undefined, REF_DATE),
    true,
  )

  // 7b. '7d' range relative to 2026-10-10
  assert.equal(
    isDateInRange('2026-10-09', '7d', undefined, undefined, REF_DATE),
    true,
  )
  assert.equal(
    isDateInRange('2026-10-03', '7d', undefined, undefined, REF_DATE),
    true,
  )
  assert.equal(
    isDateInRange('2026-10-02', '7d', undefined, undefined, REF_DATE),
    false,
  ) // 8 days prior

  // 7c. '30d' range
  assert.equal(
    isDateInRange('2026-09-20', '30d', undefined, undefined, REF_DATE),
    true,
  )
  assert.equal(
    isDateInRange('2026-08-01', '30d', undefined, undefined, REF_DATE),
    false,
  )

  // 7d. Custom valid range
  assert.equal(
    isDateInRange('2026-05-15', 'custom', '2026-05-01', '2026-05-31', REF_DATE),
    true,
  )
  assert.equal(
    isDateInRange('2026-06-01', 'custom', '2026-05-01', '2026-05-31', REF_DATE),
    false,
  )

  // 7e. Custom invalid range (start > end)
  assert.equal(
    isDateInRange('2026-05-15', 'custom', '2026-06-01', '2026-05-01', REF_DATE),
    false,
  )

  // 7f. Empty transaction history
  const emptyFilters: MovementFilters = { dateRange: '7d' }
  const productsMap = new Map<string, Product>()
  const filtered = filterTransactions([], emptyFilters, productsMap, REF_DATE)
  assert.deepEqual(filtered, [])
})

test('8. Stock In and Stock Out totals', () => {
  const summary = calculateMovementSummary(initialTransactionsSeed)

  let expectedIn = 0
  let expectedOut = 0

  for (const tx of initialTransactionsSeed) {
    if (tx.type === 'Stock In') expectedIn += tx.quantity
    if (tx.type === 'Stock Out') expectedOut += tx.quantity
  }

  assert.equal(summary.stockInUnits, expectedIn)
  assert.equal(summary.stockOutUnits, expectedOut)
  assert.ok(summary.stockInUnits > 0)
  assert.ok(summary.stockOutUnits > 0)

  // Verify warehouse movements and trends
  const whMovements = calculateMovementByWarehouse(
    initialTransactionsSeed,
    warehouses,
  )
  assert.equal(whMovements.length, warehouses.length)

  const trends = calculateMovementTrends(initialTransactionsSeed)
  assert.ok(trends.length > 0)
})

test('9. Adjustments and organization-wide transfer net effect', () => {
  const sampleTransactions: StockTransactionRecord[] = [
    {
      id: 'tx-in-1',
      type: 'Stock In',
      productId: 'p-1',
      productName: 'Item 1',
      sku: 'SKU-1',
      quantity: 100,
      previousStock: 0,
      resultingStock: 100,
      warehouseId: 'wh-mum',
      timestamp: '2026-10-09T10:00:00Z',
      date: '2026-10-09',
      status: 'Completed',
    },
    {
      id: 'tx-out-1',
      type: 'Stock Out',
      productId: 'p-1',
      productName: 'Item 1',
      sku: 'SKU-1',
      quantity: 30,
      previousStock: 100,
      resultingStock: 70,
      warehouseId: 'wh-mum',
      timestamp: '2026-10-09T12:00:00Z',
      date: '2026-10-09',
      status: 'Completed',
    },
    {
      id: 'tx-trf-1',
      type: 'Transfer',
      productId: 'p-1',
      productName: 'Item 1',
      sku: 'SKU-1',
      quantity: 25,
      previousStock: 70,
      resultingStock: 70, // Total org stock remains 70!
      warehouseId: 'wh-mum',
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-del',
      timestamp: '2026-10-09T14:00:00Z',
      date: '2026-10-09',
      status: 'Completed',
    },
    {
      id: 'tx-adj-pos',
      type: 'Adjustment',
      productId: 'p-1',
      productName: 'Item 1',
      sku: 'SKU-1',
      quantity: 5,
      previousStock: 70,
      resultingStock: 75,
      warehouseId: 'wh-mum',
      timestamp: '2026-10-09T15:00:00Z',
      date: '2026-10-09',
      status: 'Completed',
    },
    {
      id: 'tx-adj-neg',
      type: 'Adjustment',
      productId: 'p-1',
      productName: 'Item 1',
      sku: 'SKU-1',
      quantity: 2,
      previousStock: 75,
      resultingStock: 73,
      warehouseId: 'wh-mum',
      timestamp: '2026-10-09T16:00:00Z',
      date: '2026-10-09',
      status: 'Completed',
    },
  ]

  const summary = calculateMovementSummary(sampleTransactions)

  assert.equal(summary.stockInUnits, 100)
  assert.equal(summary.stockOutUnits, 30)
  assert.equal(summary.transferUnits, 25)
  // Positive adjustment: +5. Negative adjustment: -2. Total adjustment delta = +3.
  assert.equal(summary.adjustmentDeltaUnits, 3)

  // Net organization movement: 100 - 30 + 3 = 73 units.
  // Transfer of 25 units has ZERO net effect on org inventory.
  assert.equal(summary.netMovementUnits, 73)
})

test('10. Low-stock versus out-of-stock classification', () => {
  const pOOS: Product = {
    id: 'p-oos',
    name: 'OOS Product',
    sku: 'OOS-1',
    category: 'Storage',
    price: 100,
    stock: 0,
    reorderThreshold: 10,
    warehouseId: 'wh-mum',
  }

  const pLow: Product = {
    id: 'p-low',
    name: 'Low Product',
    sku: 'LOW-1',
    category: 'Storage',
    price: 100,
    stock: 10,
    reorderThreshold: 10,
    warehouseId: 'wh-mum',
  }

  const pHealthy: Product = {
    id: 'p-ok',
    name: 'Healthy Product',
    sku: 'OK-1',
    category: 'Storage',
    price: 100,
    stock: 25,
    reorderThreshold: 10,
    warehouseId: 'wh-mum',
  }

  assert.equal(classifyProductStockStatus(pOOS), 'out_of_stock')
  assert.equal(classifyProductStockStatus(pLow), 'low_stock')
  assert.equal(classifyProductStockStatus(pHealthy), 'healthy')

  const alerts = deriveInventoryAlerts([pOOS, pLow, pHealthy], [], warehouses)
  const oosAlert = alerts.find((a) => a.productId === 'p-oos')
  const lowAlert = alerts.find((a) => a.productId === 'p-low')
  const healthyAlert = alerts.find((a) => a.productId === 'p-ok')

  assert.ok(oosAlert)
  assert.equal(oosAlert?.type, 'out_of_stock')
  assert.equal(oosAlert?.severity, 'critical')

  assert.ok(lowAlert)
  assert.equal(lowAlert?.type, 'low_stock')
  assert.equal(lowAlert?.severity, 'warning')

  assert.equal(healthyAlert, undefined)

  // Verify alert CSV generation
  const alertsCsv = generateAlertsReportCsv(alerts)
  assert.ok(alertsCsv.includes('Alert ID,Date,Severity'))
  assert.ok(alertsCsv.includes('OOS Product'))
})

test('11. Missing optional fields and unknown warehouse references', () => {
  const missingFieldProduct: Product = {
    id: 'p-unk',
    name: 'Unknown Wh Product',
    sku: 'UNK-1',
    category: 'Safety',
    price: 250,
    stock: 15,
    reorderThreshold: 5,
    warehouseId: 'wh-non-existent',
  }

  const dist = calculateWarehouseDistribution([missingFieldProduct], warehouses)
  const unkWh = dist.find((w) => w.warehouseId === 'wh-non-existent')
  assert.ok(unkWh)
  assert.equal(unkWh?.totalStock, 15)

  // Empty string / undefined optional fields in CSV
  const csv = generateInventoryReportCsv([missingFieldProduct], warehouses)
  assert.ok(csv.includes('UNK-1'))
})

test('12. CSV quoting, commas, quotes, newlines, and formula-injection protection', () => {
  // 12a. Formula injection: =, +, -, @
  assert.equal(escapeCsvCell('=cmd|"/C calc"!A0'), `"'=cmd|""/C calc""!A0"`)
  assert.equal(escapeCsvCell('+44 123 4567'), "'+44 123 4567")
  assert.equal(escapeCsvCell('-20% discount'), "'-20% discount")
  assert.equal(escapeCsvCell('@admin_user'), "'@admin_user")

  // 12b. Numeric values are preserved cleanly without formula quote
  assert.equal(escapeCsvCell(-15), '-15')
  assert.equal(escapeCsvCell(500), '500')
  assert.equal(escapeCsvCell(0), '0')

  // 12c. Strings with commas, double quotes, and line breaks
  assert.equal(escapeCsvCell('Hello, World'), '"Hello, World"')
  assert.equal(escapeCsvCell('He said "Hi"'), '"He said ""Hi"""')
  assert.equal(escapeCsvCell('Line1\nLine2'), '"Line1\nLine2"')
})

test('13. Export results respecting active filters', () => {
  const productsById = new Map(initialProducts.map((p) => [p.id, p]))

  // Filter only Stock In transactions in Mumbai
  const filters: MovementFilters = {
    dateRange: 'all',
    type: 'Stock In',
    warehouseId: 'wh-mum',
  }

  const filteredTxns = filterTransactions(
    initialTransactionsSeed,
    filters,
    productsById,
  )

  assert.ok(filteredTxns.length > 0)
  for (const tx of filteredTxns) {
    assert.equal(tx.type, 'Stock In')
    const matchesWh =
      tx.warehouseId === 'wh-mum' ||
      tx.destinationWarehouseId === 'wh-mum' ||
      tx.sourceWarehouseId === 'wh-mum'
    assert.equal(matchesWh, true)
  }

  const csv = generateMovementReportCsv(filteredTxns, warehouses)
  const lines = csv.split('\r\n')
  // Header line + filtered row count
  assert.equal(lines.length, filteredTxns.length + 1)
})

test('14. Regression checks for existing order, supplier, warehouse, inventory, and transaction modules', () => {
  // 14a. Order store validation regression
  const orderVal = validateOrderInput(
    {
      customerName: 'Acme Logistics',
      customerEmail: 'acme@example.com',
      customerPhone: '+91 98765 43210',
      warehouseId: 'wh-mum',
      items: [{ productId: initialProducts[0].id, quantity: 1 }],
    },
    initialProducts,
  )
  assert.equal(orderVal.ok, true)

  // 14b. Supplier validation regression
  const suppVal = validateSupplierInput(
    {
      companyName: 'Apex Industrial Supply',
      contactPerson: 'Rohan Sharma',
      email: 'rohan@apex.example.com',
      phone: '+91 98765 43210',
      address: 'Plot 44, Marol Industrial Area',
      city: 'Mumbai',
    },
    [],
  )
  assert.equal(suppVal.ok, true)

  // 14c. Warehouse validation regression
  const whVal = validateWarehouseInput(
    {
      name: 'Pune Distribution Center',
      city: 'Pune',
    },
    warehouses,
  )
  assert.equal(whVal.ok, true)

  // 14d. Transaction validation regressions
  const p = initialProducts[0]
  const stockInVal = validateStockInInput(
    {
      productId: p.id,
      destinationWarehouseId: p.warehouseId,
      quantity: 10,
    },
    initialProducts,
    warehouses,
    [],
  )
  assert.equal(stockInVal.ok, true)

  const stockOutVal = validateStockOutInput(
    {
      productId: p.id,
      sourceWarehouseId: p.warehouseId,
      quantity: 2,
    },
    initialProducts,
    warehouses,
  )
  assert.equal(stockOutVal.ok, true)

  const trfVal = validateTransferInput(
    {
      productId: p.id,
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-del',
      quantity: 5,
    },
    initialProducts,
    warehouses,
  )
  assert.equal(trfVal.ok, true)

  const adjVal = validateAdjustmentInput(
    {
      productId: p.id,
      warehouseId: p.warehouseId,
      quantity: 1,
      reason: 'Physical inventory audit',
    },
    initialProducts,
    warehouses,
  )
  assert.equal(adjVal.ok, true)
})
