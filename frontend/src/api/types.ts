import type { Product, Warehouse, WarehouseStatus } from '@/mocks/inventoryData'
import type {
  WarehouseRack,
  WarehouseZone,
  ZoneStatus,
  RackStatus,
} from '@/mocks/warehouseData'
import type { Supplier, SupplierStatus } from '@/mocks/supplierData'
import type {
  StockTransactionRecord,
  TransactionType,
  TransactionStatus,
  CreateStockInInput,
  CreateStockOutInput,
  CreateAdjustmentInput,
  CreateTransferInput,
} from '@/mocks/transactionData'
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
} from '@/mocks/orderData'

// Re-export domain types for centralized access
export type {
  Product,
  Warehouse,
  WarehouseStatus,
  WarehouseRack,
  WarehouseZone,
  ZoneStatus,
  RackStatus,
  Supplier,
  SupplierStatus,
  StockTransactionRecord,
  TransactionType,
  TransactionStatus,
  CreateStockInInput,
  CreateStockOutInput,
  CreateAdjustmentInput,
  CreateTransferInput,
  Order,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
}

export type ProductInput = Omit<Product, 'id'>

export type CreateWarehouseInput = {
  id: string
  name: string
  city: string
  address?: string
  state?: string
  postalCode?: string
  country?: string
  capacitySqFt?: number
}

export type UpdateWarehouseInput = {
  name: string
  city: string
  address?: string
  state?: string
  postalCode?: string
  country?: string
  capacitySqFt?: number
}

export type CreateZoneInput = {
  id: string
  warehouseId: string
  name: string
  type: string
  description?: string
}

export type UpdateZoneInput = {
  name: string
  type: string
  description?: string
}

export type CreateRackInput = {
  id: string
  zoneId: string
  warehouseId: string
  name: string
  capacity?: number
  levels?: number
}

export type UpdateRackInput = {
  name: string
  capacity?: number
  levels?: number
}

export type CreateSupplierInput = {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export type CreateOrderItemInput = {
  productId: string
  quantity: number
}

export type CreateOrderInput = {
  customerName: string
  customerEmail: string
  customerPhone: string
  warehouseId: string
  items: CreateOrderItemInput[]
  notes?: string
}

export type ServiceResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; message: string }

// ==========================================
// BACKEND SPRING BOOT API CONTRACT DTO TYPES
// ==========================================

export type UserRole = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'STAFF' | 'VIEWER'

export type AuthResponse = {
  accessToken: string
  tokenType: string
  id: string
  username: string
  email: string
  role: UserRole
}

export type LoginRequest = {
  username: string
  password: string
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
  role?: UserRole
}

export type UserProfileResponse = {
  id: string
  username: string
  email: string
  role: UserRole
  active: boolean
  createdAt: string
}

export type BackendStockTransactionResponse = {
  id: string
  productId: string
  productSku: string
  productName: string
  transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  sourceRackId?: string | null
  sourceRackCode?: string | null
  destinationRackId?: string | null
  destinationRackCode?: string | null
  reference?: string | null
  reason?: string | null
  balanceAfter?: number | null
  performedById?: string | null
  performedByUsername?: string | null
  createdAt: string
}

export type DashboardSummaryResponse = {
  totalActiveProducts: number
  totalCategories: number
  totalActiveSuppliers: number
  totalWarehouses: number
  totalStockQuantity: number
  totalInventoryValuation: number
  lowStockProductsCount: number
  recentTransactions: BackendStockTransactionResponse[]
}

export type CategoryResponse = {
  id: string
  name: string
  description?: string | null
  createdAt: string
}

export type CategoryRequest = {
  name: string
  description?: string
}

export type ProductResponse = {
  id: string
  sku: string
  name: string
  categoryId: string
  categoryName: string
  supplierId?: string | null
  supplierName?: string | null
  unit?: string | null
  unitPrice: number
  threshold: number
  reorderQuantity: number
  description?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type ProductRequest = {
  sku: string
  name: string
  categoryId: string
  supplierId?: string | null
  unit?: string
  unitPrice: number
  threshold: number
  reorderQuantity: number
  description?: string
}

export type InventoryResponse = {
  id: string
  productId: string
  productSku: string
  productName: string
  rackId: string
  rackCode: string
  rackName: string
  zoneId?: string | null
  zoneCode?: string | null
  zoneName?: string | null
  warehouseId?: string | null
  warehouseCode?: string | null
  warehouseName?: string | null
  quantity: number
  updatedAt: string
}

export type WarehouseResponse = {
  id: string
  name: string
  code: string
  address?: string | null
  capacity: number
  createdAt: string
}

export type WarehouseRequest = {
  name: string
  code: string
  address?: string
  capacity: number
}

export type ZoneResponse = {
  id: string
  warehouseId: string
  warehouseName?: string | null
  warehouseCode?: string | null
  name: string
  code: string
  createdAt: string
}

export type ZoneRequest = {
  warehouseId: string
  name: string
  code: string
}

export type RackResponse = {
  id: string
  zoneId: string
  zoneName?: string | null
  zoneCode?: string | null
  warehouseId?: string | null
  warehouseCode?: string | null
  name: string
  code: string
  capacity: number
  createdAt: string
}

export type RackRequest = {
  zoneId: string
  name: string
  code: string
  capacity: number
}

export type SupplierResponse = {
  id: string
  name: string
  contactPerson?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  createdAt: string
}

export type SupplierRequest = {
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
}

export type StockInRequest = {
  productId: string
  destinationRackId: string
  quantity: number
  reference?: string
  reason?: string
  performedById?: string
}

export type StockOutRequest = {
  productId: string
  sourceRackId: string
  quantity: number
  reference?: string
  reason?: string
  performedById?: string
}

export type StockTransferRequest = {
  productId: string
  sourceRackId: string
  destinationRackId: string
  quantity: number
  reference?: string
  reason?: string
  performedById?: string
}

export type AlertResponse = {
  id: string
  productId: string
  productSku: string
  productName: string
  currentStock: number
  threshold: number
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
  message: string
  acknowledgedById?: string | null
  acknowledgedByUsername?: string | null
  resolvedById?: string | null
  resolvedByUsername?: string | null
  createdAt: string
  acknowledgedAt?: string | null
  resolvedAt?: string | null
}

export type AlertDetectionResponse = {
  productsEvaluated: number
  alertsCreated: number
  alertsUpdated: number
  alertsResolved: number
  totalActiveAlerts: number
  alerts?: AlertResponse[]
}

export type InventoryValuationSummaryResponse = {
  totalProductsWithInventory: number
  totalStockQuantity: number
  totalInventoryValuation: number
  warehouseBreakdown: Array<{
    warehouseId: string
    warehouseCode: string
    warehouseName: string
    totalQuantity: number
    totalValuation: number
    itemCount: number
  }>
  categoryBreakdown: Array<{
    categoryId: string
    categoryName: string
    totalQuantity: number
    totalValuation: number
    itemCount: number
  }>
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

