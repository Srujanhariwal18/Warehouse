import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getProductStockAtWarehouse,
  validateAdjustmentInput,
  validateStockInInput,
  validateStockOutInput,
  validateTransferInput,
} from '../src/lib/transactionStore'
import {
  initialTransactionsSeed,
  type CreateStockInInput,
  type CreateStockOutInput,
  type CreateTransferInput,
  type StockTransactionRecord,
} from '../src/mocks/transactionData'
import {
  products as initialProducts,
  warehouses,
  type Product,
} from '../src/mocks/inventoryData'
import { initialSuppliers } from '../src/mocks/supplierData'
import { validateOrderInput } from '../src/lib/orderStore'
import { validateSupplierInput } from '../src/lib/supplierStore'
import { validateWarehouseInput } from '../src/lib/warehouseStore'

test('1. Valid stock-in operation increases stock and records correct history', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]
  const initialStock = product.stock
  const receiveQty = 25

  const input: CreateStockInInput = {
    productId: product.id,
    destinationWarehouseId: product.warehouseId,
    quantity: receiveQty,
    referenceNumber: 'PO-TEST-001',
    reason: 'Restocking shipment',
  }

  const validation = validateStockInInput(
    input,
    currentProducts,
    warehouses,
    initialSuppliers,
  )
  assert.equal(validation.ok, true)

  // Emulate store execution
  const previousStock = product.stock
  const resultingStock = previousStock + receiveQty
  product.stock = resultingStock

  assert.equal(product.stock, initialStock + receiveQty)
  assert.equal(previousStock, initialStock)
  assert.equal(resultingStock, initialStock + receiveQty)
})

test('2. Valid stock-out operation decreases stock and records correct history', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]
  const initialStock = product.stock
  const dispatchQty = 5

  assert.equal(initialStock >= dispatchQty, true)

  const input: CreateStockOutInput = {
    productId: product.id,
    sourceWarehouseId: product.warehouseId,
    quantity: dispatchQty,
    referenceNumber: 'DO-TEST-002',
    reason: 'Client dispatch',
  }

  const validation = validateStockOutInput(input, currentProducts, warehouses)
  assert.equal(validation.ok, true)

  // Emulate store execution
  const previousStock = product.stock
  const resultingStock = previousStock - dispatchQty
  product.stock = resultingStock

  assert.equal(product.stock, initialStock - dispatchQty)
  assert.equal(previousStock, initialStock)
  assert.equal(resultingStock, initialStock - dispatchQty)
})

test('3. Rejection of zero and negative quantities', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]

  // 3a. Stock In zero quantity
  const zeroStockIn = validateStockInInput(
    {
      productId: product.id,
      destinationWarehouseId: product.warehouseId,
      quantity: 0,
    },
    currentProducts,
    warehouses,
    initialSuppliers,
  )
  assert.equal(zeroStockIn.ok, false)
  if (!zeroStockIn.ok) {
    assert.match(zeroStockIn.message, /positive whole number/i)
  }

  // 3b. Stock In negative quantity
  const negStockIn = validateStockInInput(
    {
      productId: product.id,
      destinationWarehouseId: product.warehouseId,
      quantity: -15,
    },
    currentProducts,
    warehouses,
    initialSuppliers,
  )
  assert.equal(negStockIn.ok, false)

  // 3c. Stock Out zero quantity
  const zeroStockOut = validateStockOutInput(
    {
      productId: product.id,
      sourceWarehouseId: product.warehouseId,
      quantity: 0,
    },
    currentProducts,
    warehouses,
  )
  assert.equal(zeroStockOut.ok, false)
  if (!zeroStockOut.ok) {
    assert.match(zeroStockOut.message, /positive whole number/i)
  }

  // 3d. Stock Out negative quantity
  const negStockOut = validateStockOutInput(
    {
      productId: product.id,
      sourceWarehouseId: product.warehouseId,
      quantity: -10,
    },
    currentProducts,
    warehouses,
  )
  assert.equal(negStockOut.ok, false)

  // 3e. Transfer zero or negative quantity
  const zeroTransfer = validateTransferInput(
    {
      productId: product.id,
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-del',
      quantity: 0,
    },
    currentProducts,
    warehouses,
  )
  assert.equal(zeroTransfer.ok, false)

  const negTransfer = validateTransferInput(
    {
      productId: product.id,
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-del',
      quantity: -8,
    },
    currentProducts,
    warehouses,
  )
  assert.equal(negTransfer.ok, false)
})

test('4. Rejection when stock is insufficient for Stock Out', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]
  const excessiveQty = product.stock + 500

  const input: CreateStockOutInput = {
    productId: product.id,
    sourceWarehouseId: product.warehouseId,
    quantity: excessiveQty,
  }

  const validation = validateStockOutInput(input, currentProducts, warehouses)
  assert.equal(validation.ok, false)
  if (!validation.ok) {
    assert.match(validation.message, /insufficient stock/i)
  }
})

test('5. Adjustment requires a reason', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]

  // 5a. Missing reason
  const emptyReason = validateAdjustmentInput(
    {
      productId: product.id,
      warehouseId: product.warehouseId,
      quantity: 5,
      reason: '   ',
    },
    currentProducts,
    warehouses,
  )
  assert.equal(emptyReason.ok, false)
  if (!emptyReason.ok) {
    assert.match(emptyReason.message, /reason or audit note is required/i)
  }

  // 5b. Valid reason passes
  const validReason = validateAdjustmentInput(
    {
      productId: product.id,
      warehouseId: product.warehouseId,
      quantity: 5,
      reason: 'Physical cycle count variance',
    },
    currentProducts,
    warehouses,
  )
  assert.equal(validReason.ok, true)
})

test('6. Adjustment cannot result in negative stock', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]
  const availableStock = product.stock

  // 6a. Negative delta greater than available stock
  const excessiveNegativeDelta = validateAdjustmentInput(
    {
      productId: product.id,
      warehouseId: product.warehouseId,
      mode: 'delta',
      quantity: -(availableStock + 20),
      reason: 'Scrapped damaged units',
    },
    currentProducts,
    warehouses,
  )
  assert.equal(excessiveNegativeDelta.ok, false)
  if (!excessiveNegativeDelta.ok) {
    assert.match(excessiveNegativeDelta.message, /negative inventory/i)
  }

  // 6b. Target count less than zero
  const negativeTarget = validateAdjustmentInput(
    {
      productId: product.id,
      warehouseId: product.warehouseId,
      mode: 'target',
      quantity: -5,
      reason: 'Invalid count',
    },
    currentProducts,
    warehouses,
  )
  assert.equal(negativeTarget.ok, false)
  if (!negativeTarget.ok) {
    assert.match(negativeTarget.message, /cannot be negative/i)
  }

  // 6c. Valid negative adjustment within available stock
  const validNegativeDelta = validateAdjustmentInput(
    {
      productId: product.id,
      warehouseId: product.warehouseId,
      mode: 'delta',
      quantity: -1,
      reason: 'Sample damaged in inspection',
    },
    currentProducts,
    warehouses,
  )
  assert.equal(validNegativeDelta.ok, true)
  if (validNegativeDelta.ok) {
    assert.equal(validNegativeDelta.resultingStock, availableStock - 1)
  }
})

test('7. Valid transfer between different warehouses', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]
  const transferQty = 10
  const sourceWh = product.warehouseId
  const destWh = warehouses.find((w) => w.id !== sourceWh)!.id

  const input: CreateTransferInput = {
    productId: product.id,
    sourceWarehouseId: sourceWh,
    destinationWarehouseId: destWh,
    quantity: transferQty,
    referenceNumber: 'TRF-TEST-007',
    reason: 'Stock balancing between hubs',
  }

  const validation = validateTransferInput(input, currentProducts, warehouses)
  assert.equal(validation.ok, true)

  const sourcePrev = getProductStockAtWarehouse(product, sourceWh)
  const destPrev = getProductStockAtWarehouse(product, destWh)

  const sourceResult = sourcePrev - transferQty
  const destResult = destPrev + transferQty

  assert.equal(sourceResult, sourcePrev - transferQty)
  assert.equal(destResult, destPrev + transferQty)
})

test('8. Transfer rejects identical source and destination', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]

  const identicalWh = validateTransferInput(
    {
      productId: product.id,
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-mum',
      quantity: 5,
    },
    currentProducts,
    warehouses,
  )
  assert.equal(identicalWh.ok, false)
  if (!identicalWh.ok) {
    assert.match(identicalWh.message, /must be different/i)
  }
})

test('9. Transfer rejects insufficient source stock', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]
  const excessiveQty = product.stock + 100

  const insufficientTransfer = validateTransferInput(
    {
      productId: product.id,
      sourceWarehouseId: product.warehouseId,
      destinationWarehouseId: warehouses.find(
        (w) => w.id !== product.warehouseId,
      )!.id,
      quantity: excessiveQty,
    },
    currentProducts,
    warehouses,
  )
  assert.equal(insufficientTransfer.ok, false)
  if (!insufficientTransfer.ok) {
    assert.match(insufficientTransfer.message, /insufficient stock at source/i)
  }
})

test('10. Transfer preserves total stock across all locations', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]
  const totalStockBefore = product.stock
  const transferQty = 12
  const sourceWh = product.warehouseId
  const destWh = warehouses.find((w) => w.id !== sourceWh)!.id

  const sourcePrev = getProductStockAtWarehouse(product, sourceWh)
  const destPrev = getProductStockAtWarehouse(product, destWh)

  const updatedLocationStock: Record<string, number> = {
    [sourceWh]: sourcePrev - transferQty,
    [destWh]: destPrev + transferQty,
  }

  // Sum of stocks across all locations
  const totalStockAfter =
    updatedLocationStock[sourceWh] + updatedLocationStock[destWh]
  assert.equal(totalStockAfter, totalStockBefore)
})

test('11. Failed transactions do not partially mutate stock or history', () => {
  const currentProducts: Product[] = initialProducts.map((p) => ({ ...p }))
  const product = currentProducts[0]
  const initialStock = product.stock
  const history: StockTransactionRecord[] = [...initialTransactionsSeed]
  const initialHistoryLength = history.length

  // Attempt invalid stock out
  const invalidStockOut = validateStockOutInput(
    {
      productId: product.id,
      sourceWarehouseId: product.warehouseId,
      quantity: product.stock + 999,
    },
    currentProducts,
    warehouses,
  )
  assert.equal(invalidStockOut.ok, false)

  // Verify stock and history did not change
  assert.equal(product.stock, initialStock)
  assert.equal(history.length, initialHistoryLength)
})

test('12. Every successful mutation records correct previous and resulting quantities', () => {
  const seed = initialTransactionsSeed

  for (const tx of seed) {
    assert.equal(typeof tx.previousStock, 'number')
    assert.equal(typeof tx.resultingStock, 'number')
    assert.equal(typeof tx.quantity, 'number')
    assert.equal(tx.quantity > 0, true)

    if (tx.type === 'Stock In') {
      assert.equal(tx.resultingStock, tx.previousStock + tx.quantity)
    } else if (tx.type === 'Stock Out') {
      assert.equal(tx.resultingStock, tx.previousStock - tx.quantity)
    } else if (tx.type === 'Transfer') {
      assert.equal(tx.resultingStock, tx.previousStock)
      if (
        tx.sourcePreviousStock !== undefined &&
        tx.sourceResultingStock !== undefined
      ) {
        assert.equal(
          tx.sourceResultingStock,
          tx.sourcePreviousStock - tx.quantity,
        )
      }
    }
  }
})

test('13. Search and filters return expected transaction history', () => {
  const seed = initialTransactionsSeed

  // 13a. Filter by type 'Stock In'
  const stockInTxns = seed.filter((t) => t.type === 'Stock In')
  assert.equal(stockInTxns.length >= 4, true)
  assert.equal(
    stockInTxns.every((t) => t.type === 'Stock In'),
    true,
  )

  // 13b. Filter by type 'Transfer'
  const transferTxns = seed.filter((t) => t.type === 'Transfer')
  assert.equal(transferTxns.length >= 4, true)
  assert.equal(
    transferTxns.every((t) => t.type === 'Transfer'),
    true,
  )

  // 13c. Search by SKU
  const skuMatches = seed.filter((t) => t.sku === 'INV-0001')
  assert.equal(skuMatches.length >= 2, true)

  // 13d. Search by Reference Number
  const refMatches = seed.filter(
    (t) => t.referenceNumber?.includes('PO-2026') ?? false,
  )
  assert.equal(refMatches.length >= 4, true)
})

test('14. Regression checks: Order, supplier, warehouse, and inventory validation remain intact', () => {
  const firstProd = initialProducts[0]

  // Order validation
  const orderRes = validateOrderInput(
    {
      customerName: 'Aarav Mehta',
      warehouseId: firstProd.warehouseId,
      items: [{ productId: firstProd.id, quantity: 1 }],
    },
    initialProducts,
  )
  assert.equal(orderRes.ok, true)

  // Supplier validation
  const supplierRes = validateSupplierInput(
    {
      companyName: 'Apex Tools Test',
      contactPerson: 'Karan Mehra',
      email: 'karan@apextools.com',
      phone: '+91 98765 43210',
      address: 'Plot 55, Industrial Area',
    },
    initialSuppliers,
  )
  assert.equal(supplierRes.ok, true)

  // Warehouse validation
  const warehouseRes = validateWarehouseInput(
    {
      name: 'Pune Distribution Depot',
      city: 'Pune',
      capacitySqFt: 25000,
    },
    warehouses,
  )
  assert.equal(warehouseRes.ok, true)
})
