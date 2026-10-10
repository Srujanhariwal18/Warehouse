import type { Product, Warehouse } from '@/mocks/inventoryData'
import type { StockTransactionRecord } from '@/mocks/transactionData'

// =============================================================================
// Types
// =============================================================================

export type StockStatus = 'out_of_stock' | 'low_stock' | 'healthy'

export type InventoryValuationSummary = {
  totalValue: number
  totalUnits: number
  totalProducts: number
  outOfStockCount: number
  lowStockCount: number
  healthyStockCount: number
}

export type CategoryValuation = {
  category: string
  productCount: number
  totalStock: number
  totalValue: number
  percentageOfValue: number
}

export type WarehouseStockDistribution = {
  warehouseId: string
  warehouseName: string
  productCount: number
  totalStock: number
  totalValue: number
  percentageOfStock: number
}

export type TopProductValuation = {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  price: number
  totalValue: number
  percentageOfTotalValue: number
}

export type ReportDateRange = 'all' | '7d' | '30d' | '90d' | 'custom'

export type MovementFilters = {
  dateRange: ReportDateRange
  customStartDate?: string
  customEndDate?: string
  warehouseId?: string // 'All' or specific warehouse id
  category?: string // 'All' or specific category
  type?: string // 'All' or specific TransactionType
}

export type MovementSummary = {
  totalTransactions: number
  stockInUnits: number
  stockInCount: number
  stockOutUnits: number
  stockOutCount: number
  transferUnits: number
  transferCount: number
  adjustmentDeltaUnits: number
  adjustmentCount: number
  netMovementUnits: number
}

export type MovementTrendPoint = {
  period: string
  inbound: number
  outbound: number
  transfers: number
  adjustments: number
  net: number
}

export type WarehouseMovementSummary = {
  warehouseId: string
  warehouseName: string
  inboundUnits: number
  outboundUnits: number
  transferInUnits: number
  transferOutUnits: number
  adjustmentUnits: number
  netUnits: number
}

export type TopMovedProduct = {
  productId: string
  productName: string
  sku: string
  transactionCount: number
  totalUnitsMoved: number
  inboundUnits: number
  outboundUnits: number
}

export type AlertType =
  'out_of_stock' | 'low_stock' | 'unusual_movement' | 'recent_adjustment'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export type InventoryAlert = {
  id: string
  type: AlertType
  severity: AlertSeverity
  productId: string
  productName: string
  sku: string
  category: string
  warehouseId: string
  warehouseName: string
  currentStock: number
  reorderThreshold: number
  title: string
  description: string
  timestamp: string
  date: string
  actionUrl: string
}

// =============================================================================
// 1. Stock Status & Inventory Valuation
// =============================================================================

export function classifyProductStockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return 'out_of_stock'
  if (product.stock <= product.reorderThreshold) return 'low_stock'
  return 'healthy'
}

export function calculateInventoryValuation(
  products: Product[],
): InventoryValuationSummary {
  let totalValue = 0
  let totalUnits = 0
  let outOfStockCount = 0
  let lowStockCount = 0
  let healthyStockCount = 0

  for (const product of products) {
    const stock = Number.isFinite(product.stock)
      ? Math.max(0, product.stock)
      : 0
    const price = Number.isFinite(product.price)
      ? Math.max(0, product.price)
      : 0
    totalUnits += stock
    totalValue += stock * price

    const status = classifyProductStockStatus(product)
    if (status === 'out_of_stock') {
      outOfStockCount += 1
    } else if (status === 'low_stock') {
      lowStockCount += 1
    } else {
      healthyStockCount += 1
    }
  }

  return {
    totalValue,
    totalUnits,
    totalProducts: products.length,
    outOfStockCount,
    lowStockCount,
    healthyStockCount,
  }
}

export function calculateCategoryValuation(
  products: Product[],
): CategoryValuation[] {
  const map = new Map<
    string,
    { productCount: number; totalStock: number; totalValue: number }
  >()

  let grandTotalValue = 0

  for (const product of products) {
    const category = product.category?.trim() || 'Uncategorized'
    const stock = Number.isFinite(product.stock)
      ? Math.max(0, product.stock)
      : 0
    const price = Number.isFinite(product.price)
      ? Math.max(0, product.price)
      : 0
    const val = stock * price
    grandTotalValue += val

    const current = map.get(category) ?? {
      productCount: 0,
      totalStock: 0,
      totalValue: 0,
    }
    current.productCount += 1
    current.totalStock += stock
    current.totalValue += val
    map.set(category, current)
  }

  const result: CategoryValuation[] = []
  for (const [category, data] of map.entries()) {
    result.push({
      category,
      productCount: data.productCount,
      totalStock: data.totalStock,
      totalValue: data.totalValue,
      percentageOfValue:
        grandTotalValue > 0
          ? Math.round((data.totalValue / grandTotalValue) * 1000) / 10
          : 0,
    })
  }

  // Sort descending by totalValue
  return result.sort((a, b) => b.totalValue - a.totalValue)
}

export function calculateWarehouseDistribution(
  products: Product[],
  warehouses: Warehouse[],
): WarehouseStockDistribution[] {
  const warehouseMap = new Map<string, Warehouse>()
  for (const w of warehouses) {
    warehouseMap.set(w.id, w)
  }

  // Map warehouseId -> { productCount, totalStock, totalValue }
  const counts = new Map<
    string,
    { productCount: number; totalStock: number; totalValue: number }
  >()

  // Initialize for all known warehouses
  for (const w of warehouses) {
    counts.set(w.id, { productCount: 0, totalStock: 0, totalValue: 0 })
  }

  let grandTotalStock = 0

  for (const product of products) {
    const price = Number.isFinite(product.price)
      ? Math.max(0, product.price)
      : 0

    if (product.warehouseStock && typeof product.warehouseStock === 'object') {
      // Product uses multi-warehouse stock map
      for (const [whId, locStock] of Object.entries(product.warehouseStock)) {
        if (
          typeof locStock === 'number' &&
          Number.isFinite(locStock) &&
          locStock > 0
        ) {
          grandTotalStock += locStock
          let whData = counts.get(whId)
          if (!whData) {
            whData = { productCount: 0, totalStock: 0, totalValue: 0 }
            counts.set(whId, whData)
          }
          whData.productCount += 1
          whData.totalStock += locStock
          whData.totalValue += locStock * price
        }
      }
    } else {
      // Legacy single-warehouse representation
      const stock = Number.isFinite(product.stock)
        ? Math.max(0, product.stock)
        : 0
      grandTotalStock += stock
      const whId = product.warehouseId || 'unassigned'
      let whData = counts.get(whId)
      if (!whData) {
        whData = { productCount: 0, totalStock: 0, totalValue: 0 }
        counts.set(whId, whData)
      }
      if (stock > 0) {
        whData.productCount += 1
      }
      whData.totalStock += stock
      whData.totalValue += stock * price
    }
  }

  const result: WarehouseStockDistribution[] = []
  for (const [whId, data] of counts.entries()) {
    const warehouseObj = warehouseMap.get(whId)
    const warehouseName =
      warehouseObj?.name ?? (whId === 'unassigned' ? 'Unassigned' : whId)

    result.push({
      warehouseId: whId,
      warehouseName,
      productCount: data.productCount,
      totalStock: data.totalStock,
      totalValue: data.totalValue,
      percentageOfStock:
        grandTotalStock > 0
          ? Math.round((data.totalStock / grandTotalStock) * 1000) / 10
          : 0,
    })
  }

  return result.sort((a, b) => b.totalStock - a.totalStock)
}

export function getTopValuedProducts(
  products: Product[],
  limit = 10,
): TopProductValuation[] {
  let grandTotalValue = 0
  const valuations: Array<{
    id: string
    name: string
    sku: string
    category: string
    stock: number
    price: number
    totalValue: number
  }> = []

  for (const product of products) {
    const stock = Number.isFinite(product.stock)
      ? Math.max(0, product.stock)
      : 0
    const price = Number.isFinite(product.price)
      ? Math.max(0, product.price)
      : 0
    const totalValue = stock * price
    grandTotalValue += totalValue

    valuations.push({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      stock,
      price,
      totalValue,
    })
  }

  valuations.sort((a, b) => b.totalValue - a.totalValue)
  const sliced = valuations.slice(0, limit)

  return sliced.map((item) => ({
    ...item,
    percentageOfTotalValue:
      grandTotalValue > 0
        ? Math.round((item.totalValue / grandTotalValue) * 1000) / 10
        : 0,
  }))
}

// =============================================================================
// 2. Date Filtering & Stock Movement Analytics
// =============================================================================

export function isDateInRange(
  dateString: string,
  range: ReportDateRange,
  customStart?: string,
  customEnd?: string,
  referenceDate?: Date,
): boolean {
  if (range === 'all') return true

  const now = referenceDate ?? new Date()
  const targetDate = new Date(
    dateString.includes('T') ? dateString : `${dateString}T00:00:00`,
  )
  if (Number.isNaN(targetDate.getTime())) return false

  if (range === 'custom') {
    if (!customStart && !customEnd) return true
    if (customStart && customEnd && customStart > customEnd) return false

    if (customStart) {
      const start = new Date(`${customStart}T00:00:00`)
      if (!Number.isNaN(start.getTime()) && targetDate < start) return false
    }
    if (customEnd) {
      const end = new Date(`${customEnd}T23:59:59.999`)
      if (!Number.isNaN(end.getTime()) && targetDate > end) return false
    }
    return true
  }

  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = Date.UTC(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  )
  const diffDays = (nowDay - targetDay) / (1000 * 3600 * 24)

  if (range === '7d') return diffDays >= 0 && diffDays <= 7
  if (range === '30d') return diffDays >= 0 && diffDays <= 30
  if (range === '90d') return diffDays >= 0 && diffDays <= 90

  return true
}

export function filterTransactions(
  transactions: StockTransactionRecord[],
  filters: MovementFilters,
  productsById: Map<string, Product>,
  referenceDate?: Date,
): StockTransactionRecord[] {
  return transactions.filter((tx) => {
    // 1. Date Range
    const dateToCheck = tx.timestamp || tx.date
    if (
      !isDateInRange(
        dateToCheck,
        filters.dateRange,
        filters.customStartDate,
        filters.customEndDate,
        referenceDate,
      )
    ) {
      return false
    }

    // 2. Transaction Type
    if (filters.type && filters.type !== 'All' && tx.type !== filters.type) {
      return false
    }

    // 3. Warehouse Filter
    if (filters.warehouseId && filters.warehouseId !== 'All') {
      const targetWh = filters.warehouseId
      const matchesSource = tx.sourceWarehouseId === targetWh
      const matchesDest = tx.destinationWarehouseId === targetWh
      const matchesMain = tx.warehouseId === targetWh
      if (!matchesSource && !matchesDest && !matchesMain) {
        return false
      }
    }

    // 4. Category Filter
    if (filters.category && filters.category !== 'All') {
      const product = productsById.get(tx.productId)
      if (!product || product.category !== filters.category) {
        return false
      }
    }

    return true
  })
}

export function calculateMovementSummary(
  transactions: StockTransactionRecord[],
): MovementSummary {
  let stockInUnits = 0
  let stockInCount = 0
  let stockOutUnits = 0
  let stockOutCount = 0
  let transferUnits = 0
  let transferCount = 0
  let adjustmentDeltaUnits = 0
  let adjustmentCount = 0

  for (const tx of transactions) {
    const qty = Number.isFinite(tx.quantity) ? Math.max(0, tx.quantity) : 0

    if (tx.type === 'Stock In') {
      stockInUnits += qty
      stockInCount += 1
    } else if (tx.type === 'Stock Out') {
      stockOutUnits += qty
      stockOutCount += 1
    } else if (tx.type === 'Transfer') {
      transferUnits += qty
      transferCount += 1
      // Transfers have 0 net effect on organization total stock
    } else if (tx.type === 'Adjustment') {
      adjustmentCount += 1
      // Derive delta from resultingStock - previousStock if available, otherwise tx.quantity
      if (
        typeof tx.resultingStock === 'number' &&
        typeof tx.previousStock === 'number'
      ) {
        adjustmentDeltaUnits += tx.resultingStock - tx.previousStock
      } else {
        adjustmentDeltaUnits += tx.quantity
      }
    }
  }

  // Net organization movement: Stock In (+) minus Stock Out (-) plus Adjustment delta (+/-).
  // Transfers net 0 across the entire organization.
  const netMovementUnits = stockInUnits - stockOutUnits + adjustmentDeltaUnits

  return {
    totalTransactions: transactions.length,
    stockInUnits,
    stockInCount,
    stockOutUnits,
    stockOutCount,
    transferUnits,
    transferCount,
    adjustmentDeltaUnits,
    adjustmentCount,
    netMovementUnits,
  }
}

export function calculateMovementTrends(
  transactions: StockTransactionRecord[],
): MovementTrendPoint[] {
  // Group by date (YYYY-MM-DD)
  const map = new Map<
    string,
    {
      inbound: number
      outbound: number
      transfers: number
      adjustments: number
    }
  >()

  for (const tx of transactions) {
    const dateKey =
      tx.date?.slice(0, 10) || tx.timestamp?.slice(0, 10) || 'Unknown'
    const current = map.get(dateKey) ?? {
      inbound: 0,
      outbound: 0,
      transfers: 0,
      adjustments: 0,
    }

    const qty = Number.isFinite(tx.quantity) ? Math.max(0, tx.quantity) : 0

    if (tx.type === 'Stock In') {
      current.inbound += qty
    } else if (tx.type === 'Stock Out') {
      current.outbound += qty
    } else if (tx.type === 'Transfer') {
      current.transfers += qty
    } else if (tx.type === 'Adjustment') {
      const delta =
        typeof tx.resultingStock === 'number' &&
        typeof tx.previousStock === 'number'
          ? tx.resultingStock - tx.previousStock
          : tx.quantity
      current.adjustments += delta
    }

    map.set(dateKey, current)
  }

  // Sort keys chronologically
  const sortedDates = Array.from(map.keys()).sort()

  return sortedDates.map((dateKey) => {
    const data = map.get(dateKey)!
    const parsed = new Date(`${dateKey}T00:00:00`)
    const periodLabel = !Number.isNaN(parsed.getTime())
      ? new Intl.DateTimeFormat('en-IN', {
          day: '2-digit',
          month: 'short',
        }).format(parsed)
      : dateKey

    return {
      period: periodLabel,
      inbound: data.inbound,
      outbound: data.outbound,
      transfers: data.transfers,
      adjustments: data.adjustments,
      net: data.inbound - data.outbound + data.adjustments,
    }
  })
}

export function calculateMovementByWarehouse(
  transactions: StockTransactionRecord[],
  warehouses: Warehouse[],
): WarehouseMovementSummary[] {
  const warehouseMap = new Map<string, Warehouse>()
  for (const w of warehouses) {
    warehouseMap.set(w.id, w)
  }

  const map = new Map<
    string,
    {
      inboundUnits: number
      outboundUnits: number
      transferInUnits: number
      transferOutUnits: number
      adjustmentUnits: number
    }
  >()

  for (const w of warehouses) {
    map.set(w.id, {
      inboundUnits: 0,
      outboundUnits: 0,
      transferInUnits: 0,
      transferOutUnits: 0,
      adjustmentUnits: 0,
    })
  }

  for (const tx of transactions) {
    const qty = Number.isFinite(tx.quantity) ? Math.max(0, tx.quantity) : 0

    if (tx.type === 'Stock In') {
      const whId = tx.destinationWarehouseId || tx.warehouseId
      let data = map.get(whId)
      if (!data) {
        data = {
          inboundUnits: 0,
          outboundUnits: 0,
          transferInUnits: 0,
          transferOutUnits: 0,
          adjustmentUnits: 0,
        }
        map.set(whId, data)
      }
      data.inboundUnits += qty
    } else if (tx.type === 'Stock Out') {
      const whId = tx.sourceWarehouseId || tx.warehouseId
      let data = map.get(whId)
      if (!data) {
        data = {
          inboundUnits: 0,
          outboundUnits: 0,
          transferInUnits: 0,
          transferOutUnits: 0,
          adjustmentUnits: 0,
        }
        map.set(whId, data)
      }
      data.outboundUnits += qty
    } else if (tx.type === 'Transfer') {
      const srcId = tx.sourceWarehouseId || tx.warehouseId
      const dstId = tx.destinationWarehouseId
      if (srcId) {
        let srcData = map.get(srcId)
        if (!srcData) {
          srcData = {
            inboundUnits: 0,
            outboundUnits: 0,
            transferInUnits: 0,
            transferOutUnits: 0,
            adjustmentUnits: 0,
          }
          map.set(srcId, srcData)
        }
        srcData.transferOutUnits += qty
      }
      if (dstId) {
        let dstData = map.get(dstId)
        if (!dstData) {
          dstData = {
            inboundUnits: 0,
            outboundUnits: 0,
            transferInUnits: 0,
            transferOutUnits: 0,
            adjustmentUnits: 0,
          }
          map.set(dstId, dstData)
        }
        dstData.transferInUnits += qty
      }
    } else if (tx.type === 'Adjustment') {
      const whId = tx.warehouseId || tx.sourceWarehouseId
      if (whId) {
        let data = map.get(whId)
        if (!data) {
          data = {
            inboundUnits: 0,
            outboundUnits: 0,
            transferInUnits: 0,
            transferOutUnits: 0,
            adjustmentUnits: 0,
          }
          map.set(whId, data)
        }
        const delta =
          typeof tx.resultingStock === 'number' &&
          typeof tx.previousStock === 'number'
            ? tx.resultingStock - tx.previousStock
            : tx.quantity
        data.adjustmentUnits += delta
      }
    }
  }

  const result: WarehouseMovementSummary[] = []
  for (const [whId, data] of map.entries()) {
    const whObj = warehouseMap.get(whId)
    const warehouseName = whObj?.name ?? whId
    const netUnits =
      data.inboundUnits +
      data.transferInUnits -
      data.outboundUnits -
      data.transferOutUnits +
      data.adjustmentUnits

    result.push({
      warehouseId: whId,
      warehouseName,
      inboundUnits: data.inboundUnits,
      outboundUnits: data.outboundUnits,
      transferInUnits: data.transferInUnits,
      transferOutUnits: data.transferOutUnits,
      adjustmentUnits: data.adjustmentUnits,
      netUnits,
    })
  }

  return result.sort(
    (a, b) =>
      b.inboundUnits + b.outboundUnits - (a.inboundUnits + a.outboundUnits),
  )
}

export function getMostFrequentlyMovedProducts(
  transactions: StockTransactionRecord[],
  limit = 5,
): TopMovedProduct[] {
  const map = new Map<
    string,
    {
      productId: string
      productName: string
      sku: string
      transactionCount: number
      totalUnitsMoved: number
      inboundUnits: number
      outboundUnits: number
    }
  >()

  for (const tx of transactions) {
    let data = map.get(tx.productId)
    if (!data) {
      data = {
        productId: tx.productId,
        productName: tx.productName,
        sku: tx.sku,
        transactionCount: 0,
        totalUnitsMoved: 0,
        inboundUnits: 0,
        outboundUnits: 0,
      }
      map.set(tx.productId, data)
    }

    const qty = Number.isFinite(tx.quantity) ? Math.max(0, tx.quantity) : 0
    data.transactionCount += 1
    data.totalUnitsMoved += qty

    if (tx.type === 'Stock In') {
      data.inboundUnits += qty
    } else if (tx.type === 'Stock Out') {
      data.outboundUnits += qty
    }
  }

  const list = Array.from(map.values())
  list.sort((a, b) => b.totalUnitsMoved - a.totalUnitsMoved)
  return list.slice(0, limit)
}

// =============================================================================
// 3. Inventory Alerts
// =============================================================================

export function deriveInventoryAlerts(
  products: Product[],
  transactions: StockTransactionRecord[],
  warehouses: Warehouse[],
): InventoryAlert[] {
  const warehouseMap = new Map<string, Warehouse>()
  for (const w of warehouses) {
    warehouseMap.set(w.id, w)
  }

  const alerts: InventoryAlert[] = []

  // 1. Stock Status Alerts: Out of stock (critical) & Low stock (warning)
  for (const product of products) {
    const whObj = warehouseMap.get(product.warehouseId)
    const whName = whObj?.name ?? product.warehouseId

    if (product.stock === 0) {
      alerts.push({
        id: `alert-oos-${product.id}`,
        type: 'out_of_stock',
        severity: 'critical',
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        warehouseId: product.warehouseId,
        warehouseName: whName,
        currentStock: 0,
        reorderThreshold: product.reorderThreshold,
        title: `Out of Stock: ${product.name}`,
        description: `Product has 0 available units in stock. Reorder threshold is ${product.reorderThreshold} units. Immediate replenishment required.`,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
        actionUrl: `/app/transactions`,
      })
    } else if (product.stock <= product.reorderThreshold) {
      alerts.push({
        id: `alert-low-${product.id}`,
        type: 'low_stock',
        severity: 'warning',
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        warehouseId: product.warehouseId,
        warehouseName: whName,
        currentStock: product.stock,
        reorderThreshold: product.reorderThreshold,
        title: `Low Stock: ${product.name}`,
        description: `Current stock (${product.stock} units) is at or below reorder threshold (${product.reorderThreshold} units). Consider creating a purchase order.`,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
        actionUrl: `/app/transactions`,
      })
    }
  }

  // 2. Transaction Exception Alerts: Unusual Movement & Recent Adjustments
  // Unusual Movement Rule:
  // - Single transaction moving >= 50 units, OR
  // - Single Stock Out removing >= 50% of product's previous available stock.
  for (const tx of transactions) {
    const whId =
      tx.warehouseId || tx.sourceWarehouseId || tx.destinationWarehouseId
    const whObj = whId ? warehouseMap.get(whId) : undefined
    const whName = whObj?.name ?? (whId || 'Unknown Location')

    if (tx.type === 'Adjustment') {
      const delta =
        typeof tx.resultingStock === 'number' &&
        typeof tx.previousStock === 'number'
          ? tx.resultingStock - tx.previousStock
          : tx.quantity
      const sign = delta > 0 ? `+${delta}` : `${delta}`

      alerts.push({
        id: `alert-adj-${tx.id}`,
        type: 'recent_adjustment',
        severity: delta < 0 ? 'warning' : 'info',
        productId: tx.productId,
        productName: tx.productName,
        sku: tx.sku,
        category: 'Adjustment',
        warehouseId: whId || '',
        warehouseName: whName,
        currentStock: tx.resultingStock,
        reorderThreshold: 0,
        title: `Inventory Adjustment (${sign} units): ${tx.productName}`,
        description: `Stock adjusted by ${sign} units. Reason: ${tx.reason || 'Audit reconciliation'}. Reference: ${tx.referenceNumber || 'N/A'}.`,
        timestamp: tx.timestamp || `${tx.date}T00:00:00.000Z`,
        date: tx.date,
        actionUrl: `/app/transactions`,
      })
    } else if (
      tx.type === 'Stock Out' &&
      tx.previousStock > 0 &&
      tx.quantity / tx.previousStock >= 0.5 &&
      tx.quantity >= 10
    ) {
      alerts.push({
        id: `alert-unusual-pct-${tx.id}`,
        type: 'unusual_movement',
        severity: 'warning',
        productId: tx.productId,
        productName: tx.productName,
        sku: tx.sku,
        category: 'High Outflow',
        warehouseId: whId || '',
        warehouseName: whName,
        currentStock: tx.resultingStock,
        reorderThreshold: 0,
        title: `High-Volume Dispatch: ${tx.productName}`,
        description: `Single dispatch of ${tx.quantity} units depleted ${Math.round(
          (tx.quantity / tx.previousStock) * 100,
        )}% of available stock (${tx.previousStock} -> ${tx.resultingStock}).`,
        timestamp: tx.timestamp || `${tx.date}T00:00:00.000Z`,
        date: tx.date,
        actionUrl: `/app/transactions`,
      })
    } else if (tx.quantity >= 100) {
      alerts.push({
        id: `alert-unusual-vol-${tx.id}`,
        type: 'unusual_movement',
        severity: 'info',
        productId: tx.productId,
        productName: tx.productName,
        sku: tx.sku,
        category: 'High Volume',
        warehouseId: whId || '',
        warehouseName: whName,
        currentStock: tx.resultingStock,
        reorderThreshold: 0,
        title: `Large Volume Movement: ${tx.productName}`,
        description: `${tx.type} transaction of ${tx.quantity} units processed at ${whName}. Reference: ${tx.referenceNumber || 'N/A'}.`,
        timestamp: tx.timestamp || `${tx.date}T00:00:00.000Z`,
        date: tx.date,
        actionUrl: `/app/transactions`,
      })
    }
  }

  // Sort alerts: critical first, then warning, then info; newest timestamp first
  const severityRank: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  }

  alerts.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity]
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return alerts
}

// =============================================================================
// 4. CSV Escaping & Export Generation
// =============================================================================

export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return ''

  // If it's a number, preserve it as clean raw numeric data for spreadsheets
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : '0'
  }

  let str = String(val)

  // Protect against spreadsheet formula injection (CWE-123):
  // If untrusted string starts with '=', '+', '-', '@', '\t', or '\r', prepend a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }

  // Enclose in quotes if it contains commas, double quotes, or newlines
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`
  }

  return str
}

export function generateInventoryReportCsv(
  products: Product[],
  warehouses: Warehouse[],
): string {
  const warehouseMap = new Map<string, Warehouse>()
  for (const w of warehouses) {
    warehouseMap.set(w.id, w)
  }

  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Unit Price (INR)',
    'Total Stock',
    'Reorder Threshold',
    'Stock Status',
    'Primary Warehouse',
    'Total Valuation (INR)',
  ]

  const rows = products.map((product) => {
    const wh = warehouseMap.get(product.warehouseId)
    const whName = wh?.name ?? product.warehouseId
    const stock = Number.isFinite(product.stock)
      ? Math.max(0, product.stock)
      : 0
    const price = Number.isFinite(product.price)
      ? Math.max(0, product.price)
      : 0
    const totalVal = stock * price
    const status = classifyProductStockStatus(product)
    const statusLabel =
      status === 'out_of_stock'
        ? 'Out of Stock'
        : status === 'low_stock'
          ? 'Low Stock'
          : 'Healthy'

    return [
      escapeCsvCell(product.sku),
      escapeCsvCell(product.name),
      escapeCsvCell(product.category),
      escapeCsvCell(price),
      escapeCsvCell(stock),
      escapeCsvCell(product.reorderThreshold),
      escapeCsvCell(statusLabel),
      escapeCsvCell(whName),
      escapeCsvCell(totalVal),
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\r\n')
}

export function generateMovementReportCsv(
  transactions: StockTransactionRecord[],
  warehouses: Warehouse[],
): string {
  const warehouseMap = new Map<string, Warehouse>()
  for (const w of warehouses) {
    warehouseMap.set(w.id, w)
  }

  const headers = [
    'Transaction ID',
    'Date',
    'Timestamp',
    'Type',
    'Product Name',
    'SKU',
    'Quantity',
    'Previous Stock',
    'Resulting Stock',
    'Warehouse',
    'Source Warehouse',
    'Destination Warehouse',
    'Reference Number',
    'Reason / Notes',
    'Status',
  ]

  const rows = transactions.map((tx) => {
    const mainWh = tx.warehouseId
      ? (warehouseMap.get(tx.warehouseId)?.name ?? tx.warehouseId)
      : ''
    const srcWh = tx.sourceWarehouseId
      ? (warehouseMap.get(tx.sourceWarehouseId)?.name ?? tx.sourceWarehouseId)
      : ''
    const dstWh = tx.destinationWarehouseId
      ? (warehouseMap.get(tx.destinationWarehouseId)?.name ??
        tx.destinationWarehouseId)
      : ''

    return [
      escapeCsvCell(tx.id),
      escapeCsvCell(tx.date),
      escapeCsvCell(tx.timestamp),
      escapeCsvCell(tx.type),
      escapeCsvCell(tx.productName),
      escapeCsvCell(tx.sku),
      escapeCsvCell(tx.quantity),
      escapeCsvCell(tx.previousStock),
      escapeCsvCell(tx.resultingStock),
      escapeCsvCell(mainWh),
      escapeCsvCell(srcWh),
      escapeCsvCell(dstWh),
      escapeCsvCell(tx.referenceNumber || ''),
      escapeCsvCell(tx.reason || ''),
      escapeCsvCell(tx.status),
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\r\n')
}

export function generateAlertsReportCsv(alerts: InventoryAlert[]): string {
  const headers = [
    'Alert ID',
    'Date',
    'Severity',
    'Alert Type',
    'Product Name',
    'SKU',
    'Category',
    'Warehouse',
    'Current Stock',
    'Reorder Threshold',
    'Description',
  ]

  const rows = alerts.map((a) => {
    const typeLabel =
      a.type === 'out_of_stock'
        ? 'Out of Stock'
        : a.type === 'low_stock'
          ? 'Low Stock'
          : a.type === 'unusual_movement'
            ? 'Unusual Movement'
            : 'Recent Adjustment'

    return [
      escapeCsvCell(a.id),
      escapeCsvCell(a.date),
      escapeCsvCell(a.severity.toUpperCase()),
      escapeCsvCell(typeLabel),
      escapeCsvCell(a.productName),
      escapeCsvCell(a.sku),
      escapeCsvCell(a.category),
      escapeCsvCell(a.warehouseName),
      escapeCsvCell(a.currentStock),
      escapeCsvCell(a.reorderThreshold),
      escapeCsvCell(a.description),
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\r\n')
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  // Prepend UTF-8 BOM so Microsoft Excel correctly parses UTF-8 encoding
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
