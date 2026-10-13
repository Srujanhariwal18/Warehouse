/**
 * INVORA API & REPOSITORY ABSTRACTION LAYER
 *
 * Current Architecture (Phase 3):
 * --------------------------------
 * This layer decouples the React UI components and state stores from raw mock data fixtures.
 * All frontend domain operations route through explicit repository interfaces implemented
 * by mock service classes using in-memory state seeded from `@/mocks/*`.
 *
 * Backend Integration Roadmap (Final Phase):
 * -------------------------------------------
 * In the final integration phase, each mock service below will be swapped with a real HTTP client
 * without modifying UI components or business calculation utilities:
 *
 * 1. `IInventoryRepository`   -> Replaced by `HttpInventoryService` calling `GET/POST/PUT /api/v1/products`
 * 2. `IWarehouseRepository`   -> Replaced by `HttpWarehouseService` calling `/api/v1/warehouses`, `/zones`, `/racks`
 * 3. `ISupplierRepository`   -> Replaced by `HttpSupplierService` calling `/api/v1/suppliers`
 * 4. `ITransactionRepository` -> Replaced by `HttpTransactionService` calling `/api/v1/transactions`
 * 5. `IOrderRepository`       -> Replaced by `HttpOrderService` calling `/api/v1/orders`
 */

export * from './types'

// Repositories & Mock Services
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
