import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  validateOrderInput,
  type CreateOrderInput,
} from '../src/lib/orderStore'
import { isOrderWithinDateRange } from '../src/pages/OrdersPage'
import { warehouses, type Product } from '../src/mocks/inventoryData'

const mockWarehouseId = warehouses[0].id

const sampleProducts: Product[] = [
  {
    id: 'prod-widget-1',
    name: 'Industrial Widget Alpha',
    sku: 'WGT-ALP-001',
    category: 'Hardware',
    warehouseId: mockWarehouseId,
    stock: 50,
    minStock: 10,
    price: 150,
    unit: 'units',
    status: 'In Stock',
  },
  {
    id: 'prod-widget-2',
    name: 'Precision Gear Beta',
    sku: 'WGT-BET-002',
    category: 'Hardware',
    warehouseId: mockWarehouseId,
    stock: 10,
    minStock: 5,
    price: 300,
    unit: 'units',
    status: 'In Stock',
  },
]

test('1. Stock changes made in Inventory are reflected in order validation', () => {
  // Start with fresh copy of products where stock is 50
  let currentInventory: Product[] = sampleProducts.map((p) => ({ ...p }))

  const orderInput: CreateOrderInput = {
    customerName: 'Test Corp',
    customerEmail: 'test@example.com',
    customerPhone: '+91 98000 00000',
    warehouseId: mockWarehouseId,
    items: [{ productId: 'prod-widget-1', quantity: 40 }],
  }

  // 1a. With stock = 50, order requesting 40 units should succeed
  const initialResult = validateOrderInput(orderInput, currentInventory)
  assert.equal(
    initialResult.ok,
    true,
    'Order should be accepted when stock is 50',
  )
  if (initialResult.ok) {
    assert.equal(initialResult.totalAmount, 40 * 150)
    assert.equal(initialResult.resolvedItems.length, 1)
  }

  // 1b. Inventory update: stock is reduced (e.g. stock out) to 30 units
  currentInventory = currentInventory.map((p) =>
    p.id === 'prod-widget-1' ? { ...p, stock: 30 } : p,
  )

  // 1c. With stock reduced to 30, the exact same order requesting 40 units must now be rejected
  const reducedResult = validateOrderInput(orderInput, currentInventory)
  assert.equal(
    reducedResult.ok,
    false,
    'Order must be rejected when stock is reduced below requested quantity',
  )
  if (!reducedResult.ok) {
    assert.match(
      reducedResult.message,
      /exceeds available stock \(30 units\)/i,
      'Error message should state that requested quantity exceeds available stock',
    )
  }

  // 1d. Inventory update: stock is replenished to 60 units
  currentInventory = currentInventory.map((p) =>
    p.id === 'prod-widget-1' ? { ...p, stock: 60 } : p,
  )

  // 1e. With stock replenished, order requesting 40 units should now succeed again
  const replenishedResult = validateOrderInput(orderInput, currentInventory)
  assert.equal(
    replenishedResult.ok,
    true,
    'Order should be accepted after stock is replenished',
  )
})

test('2. Duplicate lines exceeding combined available stock are rejected', () => {
  const currentInventory: Product[] = sampleProducts.map((p) => ({ ...p }))
  // prod-widget-2 has stock = 10

  const orderWithExcessiveDuplicates: CreateOrderInput = {
    customerName: 'Acme Logistics',
    customerEmail: 'acme@example.com',
    customerPhone: '+91 98000 00000',
    warehouseId: mockWarehouseId,
    items: [
      { productId: 'prod-widget-2', quantity: 6 }, // 6 <= 10 individually
      { productId: 'prod-widget-2', quantity: 5 }, // 5 <= 10 individually
    ], // Combined = 11 > 10 stock!
  }

  const result = validateOrderInput(
    orderWithExcessiveDuplicates,
    currentInventory,
  )
  assert.equal(
    result.ok,
    false,
    'Duplicate lines exceeding combined stock must be rejected',
  )
  if (!result.ok) {
    assert.match(
      result.message,
      /11 units.*exceeds available stock.*10 units/i,
      'Error message should clearly state combined quantity and available stock',
    )
  }
})

test('3. Duplicate lines within available stock are accepted', () => {
  const currentInventory: Product[] = sampleProducts.map((p) => ({ ...p }))
  // prod-widget-2 has stock = 10

  const orderWithValidDuplicates: CreateOrderInput = {
    customerName: 'Acme Logistics',
    customerEmail: 'acme@example.com',
    customerPhone: '+91 98000 00000',
    warehouseId: mockWarehouseId,
    items: [
      { productId: 'prod-widget-2', quantity: 4 },
      { productId: 'prod-widget-2', quantity: 3 },
    ], // Combined = 7 <= 10 stock
  }

  const result = validateOrderInput(orderWithValidDuplicates, currentInventory)
  assert.equal(
    result.ok,
    true,
    'Duplicate lines within available stock must be accepted',
  )
  if (result.ok) {
    assert.equal(
      result.resolvedItems.length,
      2,
      'Both duplicate line items should be preserved',
    )
    assert.equal(result.resolvedItems[0].quantity, 4)
    assert.equal(result.resolvedItems[1].quantity, 3)
    assert.equal(
      result.totalAmount,
      (4 + 3) * 300,
      'Total should equal combined price',
    )
  }
})

test('4. Date-range filtering relative to the current date and custom reference dates', () => {
  const now = new Date()
  const formatDateString = (d: Date) => d.toISOString().slice(0, 10)
  const daysAgo = (days: number) =>
    formatDateString(new Date(now.getTime() - days * 24 * 60 * 60 * 1000))

  const todayStr = formatDateString(now)
  const fiveDaysAgo = daysAgo(5)
  const fifteenDaysAgo = daysAgo(15)
  const fortyFiveDaysAgo = daysAgo(45)
  const hundredDaysAgo = daysAgo(100)
  const tomorrowStr = formatDateString(
    new Date(now.getTime() + 24 * 60 * 60 * 1000),
  )

  // 4a. Default current date relative filtering
  // 'all' includes all historical dates
  assert.equal(isOrderWithinDateRange(todayStr, 'all'), true)
  assert.equal(isOrderWithinDateRange(fiveDaysAgo, 'all'), true)
  assert.equal(isOrderWithinDateRange(fifteenDaysAgo, 'all'), true)
  assert.equal(isOrderWithinDateRange(fortyFiveDaysAgo, 'all'), true)
  assert.equal(isOrderWithinDateRange(hundredDaysAgo, 'all'), true)

  // '7d' filter
  assert.equal(
    isOrderWithinDateRange(todayStr, '7d'),
    true,
    'Today should be in 7d',
  )
  assert.equal(
    isOrderWithinDateRange(fiveDaysAgo, '7d'),
    true,
    '5 days ago should be in 7d',
  )
  assert.equal(
    isOrderWithinDateRange(fifteenDaysAgo, '7d'),
    false,
    '15 days ago must not be in 7d',
  )

  // '30d' filter
  assert.equal(
    isOrderWithinDateRange(todayStr, '30d'),
    true,
    'Today should be in 30d',
  )
  assert.equal(
    isOrderWithinDateRange(fifteenDaysAgo, '30d'),
    true,
    '15 days ago should be in 30d',
  )
  assert.equal(
    isOrderWithinDateRange(fortyFiveDaysAgo, '30d'),
    false,
    '45 days ago must not be in 30d',
  )

  // '90d' filter
  assert.equal(
    isOrderWithinDateRange(todayStr, '90d'),
    true,
    'Today should be in 90d',
  )
  assert.equal(
    isOrderWithinDateRange(fortyFiveDaysAgo, '90d'),
    true,
    '45 days ago should be in 90d',
  )
  assert.equal(
    isOrderWithinDateRange(hundredDaysAgo, '90d'),
    false,
    '100 days ago must not be in 90d',
  )

  // Future orders should be excluded from range filters
  assert.equal(
    isOrderWithinDateRange(tomorrowStr, '7d'),
    false,
    'Future date should not match 7d',
  )

  // 4b. Explicit reference date for deterministic, leap-year and timezone consistency
  const refDate = new Date('2026-10-10T12:00:00Z')
  assert.equal(isOrderWithinDateRange('2026-10-10', '7d', refDate), true)
  assert.equal(isOrderWithinDateRange('2026-10-04', '7d', refDate), true) // 6 days ago
  assert.equal(isOrderWithinDateRange('2026-10-02', '7d', refDate), false) // 8 days ago
  assert.equal(isOrderWithinDateRange('2026-09-20', '30d', refDate), true) // 20 days ago
  assert.equal(isOrderWithinDateRange('2026-08-15', '30d', refDate), false) // 56 days ago
  assert.equal(isOrderWithinDateRange('2026-08-15', '90d', refDate), true) // 56 days ago
  assert.equal(isOrderWithinDateRange('2026-05-01', '90d', refDate), false) // >160 days ago
})
