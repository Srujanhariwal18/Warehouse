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
  city: string
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
