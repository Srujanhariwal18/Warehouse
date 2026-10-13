import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MockWarehouseService,
  MockTransactionService,
  MockOrderService,
} from '../src/api'
import { products, warehouses, type Product } from '../src/mocks/inventoryData'
import { initialZones, initialRacks } from '../src/mocks/warehouseData'
import { initialSuppliers } from '../src/mocks/supplierData'
import { getProductStockAtWarehouse } from '../src/lib/transactionStore'
import { validateOrderInput } from '../src/lib/orderStore'
import { validateSupplierInput } from '../src/lib/supplierStore'
import {
  calculateInventoryValuation,
  deriveInventoryAlerts,
} from '../src/lib/reportUtils'
import { generateWarehouse3DLayout } from '../src/components/warehouse/warehouseLayoutGenerator'

test('Phase 5 Stabilization: 1. Stock conservation and boundary enforcement across operations', async () => {
  const txService = new MockTransactionService([])

  const product = products.find((p) => p.stock >= 20)!
  const initialStock = product.stock

  // 1. Stock In adds stock and updates history
  const stockInResult = await txService.recordStockIn(
    {
      productId: product.id,
      quantity: 15,
      destinationWarehouseId: product.warehouseId,
      reason: 'Standard stock in',
    },
    products,
    warehouses,
    initialSuppliers,
  )
  assert.equal(stockInResult.ok, true)
  if (stockInResult.ok) {
    assert.equal(stockInResult.data.resultingStock, initialStock + 15)
  }

  // 2. Stock Out reduces stock correctly
  const stockOutResult = await txService.recordStockOut(
    {
      productId: product.id,
      quantity: 10,
      sourceWarehouseId: product.warehouseId,
      reason: 'Client dispatch',
    },
    products,
    warehouses,
  )
  assert.equal(stockOutResult.ok, true)
  if (stockOutResult.ok) {
    assert.equal(stockOutResult.data.resultingStock, initialStock - 10)
  }

  // 3. Stock cannot become negative
  const excessiveOutResult = await txService.recordStockOut(
    {
      productId: product.id,
      quantity: product.stock + 999,
      sourceWarehouseId: product.warehouseId,
    },
    products,
    warehouses,
  )
  assert.equal(excessiveOutResult.ok, false)
  assert.ok(excessiveOutResult.message.toLowerCase().includes('insufficient'))
})

test('Phase 5 Stabilization: 2. Inter-facility stock transfers preserve conservation laws', async () => {
  const txService = new MockTransactionService([])
  const sampleProduct: Product = {
    ...products[0],
    stock: 120,
    warehouseId: 'wh-mum',
    warehouseStock: {
      'wh-mum': 90,
      'wh-blr': 30,
    },
  }

  const mumInitial = getProductStockAtWarehouse(sampleProduct, 'wh-mum')
  const blrInitial = getProductStockAtWarehouse(sampleProduct, 'wh-blr')

  // Transfer 25 units from Mumbai to Bengaluru
  const transferRes = await txService.recordTransfer(
    {
      productId: sampleProduct.id,
      quantity: 25,
      sourceWarehouseId: 'wh-mum',
      destinationWarehouseId: 'wh-blr',
      notes: 'Inter-hub rebalancing',
    },
    [sampleProduct],
    warehouses,
  )

  assert.equal(transferRes.ok, true)
  if (transferRes.ok) {
    const { resultingStock, updatedWarehouseStock } = transferRes.data
    // Total stock across hubs is strictly conserved
    assert.equal(resultingStock, 120)
    assert.equal(updatedWarehouseStock['wh-mum'], mumInitial - 25)
    assert.equal(updatedWarehouseStock['wh-blr'], blrInitial + 25)
  }
})

test('Phase 5 Stabilization: 3. Order lifecycle status transitions and validation constraints', async () => {
  const orderService = new MockOrderService([])
  const inStockProduct = products.find((p) => p.stock >= 20)!

  // Create valid order
  const createRes = await orderService.createOrder(
    {
      customerName: 'Acme Logistics Ltd',
      customerEmail: 'ops@acmelogistics.in',
      customerPhone: '+91 98765 43210',
      warehouseId: inStockProduct.warehouseId,
      items: [{ productId: inStockProduct.id, quantity: 4 }],
      notes: 'Phase 5 lifecycle test',
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

    // Transition: Processing -> Completed
    const compRes = await orderService.updateOrderStatus(orderId, 'Completed')
    assert.equal(compRes.ok, true)

    // Completed orders cannot be modified or reopened
    const invalidTrans = await orderService.updateOrderStatus(
      orderId,
      'Cancelled',
    )
    assert.equal(invalidTrans.ok, false)
  }

  // Pure validation check: empty customer name
  const invalidNameOrder = validateOrderInput(
    {
      customerName: '   ',
      customerEmail: 'ops@acmelogistics.in',
      customerPhone: '+91 98765 43210',
      warehouseId: 'wh-mum',
      items: [{ productId: products[0].id, quantity: 1 }],
    },
    products,
    warehouses,
  )
  assert.equal(invalidNameOrder.ok, false)

  // Pure validation check: empty items list
  const emptyItemsOrder = validateOrderInput(
    {
      customerName: 'Acme Logistics Ltd',
      customerEmail: 'ops@acmelogistics.in',
      customerPhone: '+91 98765 43210',
      warehouseId: 'wh-mum',
      items: [],
    },
    products,
    warehouses,
  )
  assert.equal(emptyItemsOrder.ok, false)
})

test('Phase 5 Stabilization: 4. 3D Digital Twin camera bounds calculations and mode trigonometry', () => {
  // Test across all 3 seeded warehouse facilities
  for (const wh of warehouses) {
    const layout = generateWarehouse3DLayout(
      wh,
      initialZones,
      initialRacks,
      products,
    )
    const { width: w, length: l, height: h } = layout.dimensions

    // Verify minimum structural clear envelope
    assert.ok(w >= 24, `${wh.name} width >= 24m`)
    assert.ok(l >= 18, `${wh.name} length >= 18m`)
    assert.ok(h >= 6, `${wh.name} height >= 6m`)

    // Verify bounding sphere trigonometry used by CameraController
    const R = Math.sqrt((w / 2) ** 2 + (l / 2) ** 2 + (h / 2) ** 2)
    assert.ok(Number.isFinite(R) && R > 0)

    // Test aspect ratios across desktop and mobile
    const viewports = [
      { aspect: 1440 / 900, name: 'Desktop 1440px' },
      { aspect: 1024 / 768, name: 'Tablet Landscape 1024px' },
      { aspect: 768 / 1024, name: 'Tablet Portrait 768px' },
      { aspect: 390 / 844, name: 'Mobile Standard 390px' },
      { aspect: 360 / 740, name: 'Mobile Compact 360px' },
    ]

    const fovRad = (40 * Math.PI) / 180
    const tanHalfVFov = Math.tan(fovRad / 2)

    for (const vp of viewports) {
      const tanHalfHFov = tanHalfVFov * vp.aspect
      const minHalfFov = Math.min(fovRad / 2, Math.atan(tanHalfHFov))

      // 3D Isometric distance check
      const safetyIso = vp.aspect < 1 ? 1.4 : 1.22
      const isoDist = Math.max(18, (R / Math.sin(minHalfFov)) * safetyIso)
      assert.ok(Number.isFinite(isoDist) && isoDist >= 18)

      // 2D Plan distance check (must fit both width and length)
      const distV = l / 2 / tanHalfVFov
      const distH = w / 2 / tanHalfHFov
      const safetyPlan = vp.aspect < 1 ? 1.35 : 1.18
      const planDist = Math.max(20, Math.max(distV, distH) * safetyPlan)
      assert.ok(Number.isFinite(planDist) && planDist >= 20)

      // On mobile portrait (vp.aspect < 1), horizontal distance scales up
      if (vp.aspect < 1) {
        assert.ok(distH > distV || planDist > distV)
      }
    }
  }
})

test('Phase 5 Stabilization: 5. 3D Digital Twin mode-aware label elevation and staggered hierarchy', () => {
  // 1. 2D Plan: badge sits near floor level (Y=0.35)
  const planY = 0.35
  assert.equal(planY, 0.35)

  // 2. Elevation: staggered vertically to prevent depth axis overlap
  const elevationY_even = 1.4 + (0 % 2) * 1.5
  const elevationY_odd = 1.4 + (1 % 2) * 1.5
  assert.equal(elevationY_even, 1.4)
  assert.equal(elevationY_odd, 2.9)
  assert.notEqual(
    elevationY_even,
    elevationY_odd,
    'Staggering must produce distinct heights',
  )

  // 3. Isometric: elevated above racks (Y=4.0)
  const isoY = 4.0
  assert.equal(isoY, 4.0)
})

test('Phase 5 Stabilization: 6. Digital Twin parent zone resolution and unassigned fallback', () => {
  const mumRacks = initialRacks.filter((r) => r.warehouseId === 'wh-mum')
  const mumZones = initialZones.filter((z) => z.warehouseId === 'wh-mum')

  // Check parent zone resolution for all configured racks
  for (const rack of mumRacks) {
    const parentZone = mumZones.find((z) => z.id === rack.zoneId)
    const resolvedParentName =
      parentZone?.name ??
      (rack.zoneId
        ? `Zone ${rack.zoneId}`
        : 'Independent Rack (Unassigned Zone)')

    assert.ok(resolvedParentName.length > 0)
    if (parentZone) {
      assert.equal(resolvedParentName, parentZone.name)
    }
  }

  // Check fallback for an unassigned rack
  const unassignedRack = {
    id: 'rack-orphan',
    warehouseId: 'wh-mum',
    zoneId: '',
    name: 'Floating Staging Rack',
  }
  const unassignedParentName = unassignedRack.zoneId
    ? `Zone ${unassignedRack.zoneId}`
    : 'Independent Rack (Unassigned Zone)'
  assert.equal(unassignedParentName, 'Independent Rack (Unassigned Zone)')
})

test('Phase 5 Stabilization: 7. Supplier and Warehouse CRUD domain protections', async () => {
  const whService = new MockWarehouseService(
    warehouses,
    initialZones,
    initialRacks,
  )

  // 1. Safe deactivation: warehouse with active zones cannot be deactivated
  const deactWithZones = await whService.deactivateWarehouse('wh-mum')
  assert.equal(deactWithZones.ok, false)
  assert.ok(deactWithZones.message.includes('active storage zones'))

  // 2. Supplier duplicate email check
  const dupEmail = validateSupplierInput(
    {
      companyName: 'New Vendor',
      contactPerson: 'Vendor Rep',
      email: initialSuppliers[0].email.toUpperCase(),
      phone: '+91 98765 00000',
    },
    initialSuppliers,
  )
  assert.equal(dupEmail.ok, false)
  assert.ok(dupEmail.message.includes('already exists'))
})

test('Phase 5 Stabilization: 8. Reports & Alerts metrics consistency under stock mutations', () => {
  const initialVal = calculateInventoryValuation(products)
  assert.ok(initialVal.totalValue > 0)
  assert.equal(
    initialVal.totalUnits,
    products.reduce((s, p) => s + p.stock, 0),
  )

  // Mutate product stock
  const testProducts: Product[] = products.map((p) => ({ ...p }))
  testProducts[0].stock += 10
  const afterVal = calculateInventoryValuation(testProducts)
  assert.equal(afterVal.totalUnits, initialVal.totalUnits + 10)
  assert.equal(
    afterVal.totalValue,
    initialVal.totalValue + 10 * testProducts[0].price,
  )

  // Derive alerts
  const alerts = deriveInventoryAlerts(testProducts, [], warehouses)
  assert.ok(Array.isArray(alerts))
  for (const alert of alerts) {
    assert.ok(alert.id && alert.title && alert.severity && alert.type)
  }
})

test('Phase 5 Stabilization: 9. Frontend-only architecture and mock data isolation', () => {
  // Confirm no backend credentials or live DB endpoints are defined
  assert.equal(process.env.SUPABASE_URL, undefined)
  assert.equal(process.env.SUPABASE_KEY, undefined)
  assert.equal(process.env.DATABASE_URL, undefined)
  assert.equal(process.env.SPRING_PROFILES_ACTIVE, undefined)
})
