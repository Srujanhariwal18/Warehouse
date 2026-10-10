export type TransactionType =
  'Stock In' | 'Stock Out' | 'Adjustment' | 'Transfer'

export type TransactionStatus = 'Completed' | 'Pending' | 'Failed'

export type StockTransactionRecord = {
  id: string
  type: TransactionType
  productId: string
  productName: string
  sku: string
  quantity: number
  previousStock: number
  resultingStock: number
  warehouseId: string
  sourceWarehouseId?: string
  destinationWarehouseId?: string
  reason?: string
  referenceNumber?: string
  timestamp: string
  date: string
  status: TransactionStatus
  supplierId?: string
  supplierName?: string
  sourcePreviousStock?: number
  sourceResultingStock?: number
  destinationPreviousStock?: number
  destinationResultingStock?: number
  isSeed?: boolean
}

export type CreateStockInInput = {
  productId: string
  destinationWarehouseId: string
  quantity: number
  supplierId?: string
  referenceNumber?: string
  reason?: string
}

export type CreateStockOutInput = {
  productId: string
  sourceWarehouseId: string
  quantity: number
  referenceNumber?: string
  reason?: string
}

export type CreateAdjustmentInput = {
  productId: string
  warehouseId: string
  mode?: 'delta' | 'target'
  quantity: number
  reason: string
  referenceNumber?: string
}

export type CreateTransferInput = {
  productId: string
  sourceWarehouseId: string
  destinationWarehouseId: string
  quantity: number
  referenceNumber?: string
  reason?: string
}

export const initialTransactionsSeed: StockTransactionRecord[] = [
  {
    id: 'TXN-2026-016',
    type: 'Stock In',
    productId: 'product-3',
    productName: 'Nimbus Label Printer',
    sku: 'INV-0003',
    quantity: 24,
    previousStock: 48,
    resultingStock: 72,
    warehouseId: 'wh-mum',
    destinationWarehouseId: 'wh-mum',
    supplierId: 'SUP-102',
    supplierName: 'Bharat Pack Solutions',
    referenceNumber: 'PO-2026-1044',
    reason: 'Monthly replenishment order received',
    timestamp: '2026-10-10T09:15:00Z',
    date: '2026-10-10',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-015',
    type: 'Stock Out',
    productId: 'product-5',
    productName: 'Orbit Barcode Scanner',
    sku: 'INV-0005',
    quantity: 8,
    previousStock: 80,
    resultingStock: 72,
    warehouseId: 'wh-blr',
    sourceWarehouseId: 'wh-blr',
    referenceNumber: 'DO-2026-0512',
    reason: 'Dispatched for enterprise client fulfillment',
    timestamp: '2026-10-09T14:40:00Z',
    date: '2026-10-09',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-014',
    type: 'Transfer',
    productId: 'product-1',
    productName: 'Cedar Storage Bin',
    sku: 'INV-0001',
    quantity: 15,
    previousStock: 45,
    resultingStock: 45,
    warehouseId: 'wh-mum',
    sourceWarehouseId: 'wh-mum',
    destinationWarehouseId: 'wh-del',
    sourcePreviousStock: 45,
    sourceResultingStock: 30,
    destinationPreviousStock: 0,
    destinationResultingStock: 15,
    referenceNumber: 'TRF-2026-0089',
    reason: 'Inter-warehouse stock rebalance for northern region',
    timestamp: '2026-10-09T11:20:00Z',
    date: '2026-10-09',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-013',
    type: 'Adjustment',
    productId: 'product-11',
    productName: 'Summit Heavy Duty Dolly',
    sku: 'INV-0011',
    quantity: 3,
    previousStock: 42,
    resultingStock: 39,
    warehouseId: 'wh-del',
    sourceWarehouseId: 'wh-del',
    referenceNumber: 'ADJ-AUDIT-084',
    reason: 'Quarterly physical stock cycle count reconciliation',
    timestamp: '2026-10-08T16:05:00Z',
    date: '2026-10-08',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-012',
    type: 'Stock Out',
    productId: 'product-1',
    productName: 'Cedar Storage Bin',
    sku: 'INV-0001',
    quantity: 16,
    previousStock: 61,
    resultingStock: 45,
    warehouseId: 'wh-mum',
    sourceWarehouseId: 'wh-mum',
    referenceNumber: 'DO-2026-0498',
    reason: 'Fulfillment order ORD-1046 shipment dispatch',
    timestamp: '2026-10-07T10:30:00Z',
    date: '2026-10-07',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-011',
    type: 'Stock In',
    productId: 'product-18',
    productName: 'Harbor Steel Rack',
    sku: 'INV-0018',
    quantity: 80,
    previousStock: 110,
    resultingStock: 190,
    warehouseId: 'wh-blr',
    destinationWarehouseId: 'wh-blr',
    supplierId: 'SUP-101',
    supplierName: 'Apex Industrial Supplies',
    referenceNumber: 'PO-2026-0988',
    reason: 'Bulk vendor shipment consignment received',
    timestamp: '2026-10-06T15:25:00Z',
    date: '2026-10-06',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-010',
    type: 'Transfer',
    productId: 'product-8',
    productName: 'Atlas Packing Tape',
    sku: 'INV-0008',
    quantity: 25,
    previousStock: 95,
    resultingStock: 95,
    warehouseId: 'wh-del',
    sourceWarehouseId: 'wh-del',
    destinationWarehouseId: 'wh-blr',
    sourcePreviousStock: 95,
    sourceResultingStock: 70,
    destinationPreviousStock: 0,
    destinationResultingStock: 25,
    referenceNumber: 'TRF-2026-0088',
    reason: 'Repositioning packaging materials to Bengaluru hub',
    timestamp: '2026-10-05T13:10:00Z',
    date: '2026-10-05',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-009',
    type: 'Stock Out',
    productId: 'product-21',
    productName: 'Cedar Storage Bin',
    sku: 'INV-0021',
    quantity: 4,
    previousStock: 38,
    resultingStock: 34,
    warehouseId: 'wh-mum',
    sourceWarehouseId: 'wh-mum',
    referenceNumber: 'DO-2026-0480',
    reason: 'Sample batch dispatch for quality inspection',
    timestamp: '2026-10-05T08:50:00Z',
    date: '2026-10-05',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-008',
    type: 'Stock In',
    productId: 'product-8',
    productName: 'Atlas Packing Tape',
    sku: 'INV-0008',
    quantity: 120,
    previousStock: 40,
    resultingStock: 160,
    warehouseId: 'wh-del',
    destinationWarehouseId: 'wh-del',
    supplierId: 'SUP-104',
    supplierName: 'Titan Hardware Mfg',
    referenceNumber: 'PO-2026-0955',
    reason: 'Stock replenishment for festival peak demand',
    timestamp: '2026-10-04T12:00:00Z',
    date: '2026-10-04',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-007',
    type: 'Adjustment',
    productId: 'product-25',
    productName: 'Orbit Barcode Scanner',
    sku: 'INV-0025',
    quantity: 6,
    previousStock: 48,
    resultingStock: 54,
    warehouseId: 'wh-blr',
    sourceWarehouseId: 'wh-blr',
    referenceNumber: 'ADJ-AUDIT-083',
    reason: 'Found misplaced stock in aisle B4 rack tier',
    timestamp: '2026-10-03T17:15:00Z',
    date: '2026-10-03',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-006',
    type: 'Stock In',
    productId: 'product-2',
    productName: 'Atlas Packing Tape',
    sku: 'INV-0002',
    quantity: 50,
    previousStock: 25,
    resultingStock: 75,
    warehouseId: 'wh-del',
    destinationWarehouseId: 'wh-del',
    supplierId: 'SUP-102',
    supplierName: 'Bharat Pack Solutions',
    referenceNumber: 'PO-2026-0920',
    reason: 'Routine warehouse restocking',
    timestamp: '2026-10-02T11:45:00Z',
    date: '2026-10-02',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-005',
    type: 'Transfer',
    productId: 'product-4',
    productName: 'Harbor Steel Rack',
    sku: 'INV-0004',
    quantity: 10,
    previousStock: 35,
    resultingStock: 35,
    warehouseId: 'wh-blr',
    sourceWarehouseId: 'wh-blr',
    destinationWarehouseId: 'wh-mum',
    sourcePreviousStock: 35,
    sourceResultingStock: 25,
    destinationPreviousStock: 0,
    destinationResultingStock: 10,
    referenceNumber: 'TRF-2026-0075',
    reason: 'Transferred rack frames to Mumbai distribution depot',
    timestamp: '2026-10-01T14:00:00Z',
    date: '2026-10-01',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-004',
    type: 'Stock Out',
    productId: 'product-7',
    productName: 'Nimbus Label Printer',
    sku: 'INV-0007',
    quantity: 12,
    previousStock: 50,
    resultingStock: 38,
    warehouseId: 'wh-mum',
    sourceWarehouseId: 'wh-mum',
    referenceNumber: 'DO-2026-0421',
    reason: 'Dispatched to West Zone fulfillment center',
    timestamp: '2026-09-30T16:20:00Z',
    date: '2026-09-30',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-003',
    type: 'Adjustment',
    productId: 'product-14',
    productName: 'Harbor Steel Rack',
    sku: 'INV-0014',
    quantity: 2,
    previousStock: 28,
    resultingStock: 26,
    warehouseId: 'wh-del',
    sourceWarehouseId: 'wh-del',
    referenceNumber: 'ADJ-DMG-012',
    reason: 'Damaged during forklift handling in aisle 3',
    timestamp: '2026-09-29T10:15:00Z',
    date: '2026-09-29',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-002',
    type: 'Stock In',
    productId: 'product-10',
    productName: 'Orbit Barcode Scanner',
    sku: 'INV-0010',
    quantity: 30,
    previousStock: 15,
    resultingStock: 45,
    warehouseId: 'wh-mum',
    destinationWarehouseId: 'wh-mum',
    supplierId: 'SUP-105',
    supplierName: 'Kaveri Warehousing Co',
    referenceNumber: 'PO-2026-0890',
    reason: 'New scanner units onboarded for barcoding upgrade',
    timestamp: '2026-09-28T13:30:00Z',
    date: '2026-09-28',
    status: 'Completed',
    isSeed: true,
  },
  {
    id: 'TXN-2026-001',
    type: 'Transfer',
    productId: 'product-12',
    productName: 'Atlas Packing Tape',
    sku: 'INV-0012',
    quantity: 20,
    previousStock: 60,
    resultingStock: 60,
    warehouseId: 'wh-del',
    sourceWarehouseId: 'wh-del',
    destinationWarehouseId: 'wh-mum',
    sourcePreviousStock: 60,
    sourceResultingStock: 40,
    destinationPreviousStock: 0,
    destinationResultingStock: 20,
    referenceNumber: 'TRF-2026-0062',
    reason: 'Emergency packing tape shipment to Mumbai depot',
    timestamp: '2026-09-27T09:40:00Z',
    date: '2026-09-27',
    status: 'Completed',
    isSeed: true,
  },
]
