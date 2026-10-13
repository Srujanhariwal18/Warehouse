/**
 * INVORA API & REPOSITORY ABSTRACTION LAYER
 * Exposes repository interfaces, typed HTTP clients connecting to Spring Boot,
 * and test mock services.
 */

export * from './types'
export * from './client'

// Production HTTP Services (Spring Boot REST)
export {
  httpInventoryService,
  HttpInventoryService,
} from './httpInventoryService'

export {
  httpWarehouseService,
  HttpWarehouseService,
} from './httpWarehouseService'

export {
  httpSupplierService,
  HttpSupplierService,
} from './httpSupplierService'

export {
  httpTransactionService,
  HttpTransactionService,
} from './httpTransactionService'

export {
  httpAlertService,
  HttpAlertService,
} from './httpAlertService'

export {
  httpReportService,
  HttpReportService,
} from './httpReportService'

export {
  httpDashboardService,
  HttpDashboardService,
} from './httpDashboardService'

// Repositories & Mock Services (for Unit & Regression Tests)
export {
  mockInventoryService,
  MockInventoryService,
  type IInventoryRepository,
} from './inventoryService'

export {
  mockWarehouseService,
  MockWarehouseService,
  type IWarehouseRepository,
} from './warehouseService'

export {
  mockSupplierService,
  MockSupplierService,
  type ISupplierRepository,
} from './supplierService'

export {
  mockTransactionService,
  MockTransactionService,
  type ITransactionRepository,
} from './transactionService'

export {
  mockOrderService,
  MockOrderService,
  type IOrderRepository,
} from './orderService'
