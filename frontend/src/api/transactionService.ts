import {
  initialTransactionsSeed,
  type CreateAdjustmentInput,
  type CreateStockInInput,
  type CreateStockOutInput,
  type CreateTransferInput,
  type StockTransactionRecord,
} from '@/mocks/transactionData'
import type { Product, Warehouse } from '@/mocks/inventoryData'
import type { Supplier } from '@/mocks/supplierData'
import type { ServiceResult } from './types'
import {
  getProductStockAtWarehouse,
  validateAdjustmentInput,
  validateStockInInput,
  validateStockOutInput,
  validateTransferInput,
} from '@/lib/transactionStore'

/**
 * Repository interface for Stock Movements and Ledger Transactions.
 * In the final phase, this boundary will be implemented by an HTTP/REST
 * client communicating with the Spring Boot backend (`/api/v1/transactions`).
 */
export interface ITransactionRepository {
  getTransactions(): Promise<StockTransactionRecord[]>
  recordStockIn(
    input: CreateStockInInput,
    products: Product[],
    warehouses: Warehouse[],
    suppliers: Supplier[],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  >
  recordStockOut(
    input: CreateStockOutInput,
    products: Product[],
    warehouses: Warehouse[],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  >
  recordAdjustment(
    input: CreateAdjustmentInput,
    products: Product[],
    warehouses: Warehouse[],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  >
  recordTransfer(
    input: CreateTransferInput,
    products: Product[],
    warehouses: Warehouse[],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
      newPrimaryWarehouseId: string
    }>
  >
}

let txCounter = 200
function generateTransactionId(): string {
  txCounter += 1
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `TXN-${today}-${txCounter}`
}

export class MockTransactionService implements ITransactionRepository {
  private transactions: StockTransactionRecord[]

  constructor(seed = initialTransactionsSeed) {
    this.transactions = JSON.parse(JSON.stringify(seed))
  }

  async getTransactions(): Promise<StockTransactionRecord[]> {
    return [...this.transactions]
  }

  async recordStockIn(
    input: CreateStockInInput,
    products: Product[],
    warehouses: Warehouse[],
    suppliers: Supplier[],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  > {
    const val = validateStockInInput(input, products, warehouses, suppliers)
    if (!val.ok) {
      return { ok: false, message: val.message }
    }

    const product = products.find((p) => p.id === input.productId)!
    const supplier = input.supplierId
      ? suppliers.find((s) => s.id === input.supplierId)
      : undefined

    const previousStock = product.stock
    const resultingStock = product.stock + input.quantity

    const currentLocStock = getProductStockAtWarehouse(
      product,
      input.destinationWarehouseId,
    )
    const updatedWarehouseStock: Record<string, number> = {
      ...(product.warehouseStock ?? {
        [product.warehouseId]: product.stock,
      }),
      [input.destinationWarehouseId]: currentLocStock + input.quantity,
    }

    const now = new Date()
    const isoTimestamp = now.toISOString()
    const date = isoTimestamp.slice(0, 10)
    const id = generateTransactionId()

    const newRecord: StockTransactionRecord = {
      id,
      type: 'Stock In',
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: input.quantity,
      previousStock,
      resultingStock,
      warehouseId: input.destinationWarehouseId,
      destinationWarehouseId: input.destinationWarehouseId,
      supplierId: supplier?.id,
      supplierName: supplier?.companyName,
      referenceNumber: input.referenceNumber?.trim() || undefined,
      reason: input.reason?.trim() || 'Inventory stock receipt',
      timestamp: isoTimestamp,
      date,
      status: 'Completed',
      isSeed: false,
    }

    this.transactions.unshift(newRecord)

    return {
      ok: true,
      data: {
        record: newRecord,
        resultingStock,
        updatedWarehouseStock,
      },
    }
  }

  async recordStockOut(
    input: CreateStockOutInput,
    products: Product[],
    warehouses: Warehouse[],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  > {
    const val = validateStockOutInput(input, products, warehouses)
    if (!val.ok) {
      return { ok: false, message: val.message }
    }

    const product = products.find((p) => p.id === input.productId)!
    const previousStock = product.stock
    const resultingStock = product.stock - input.quantity

    const currentLocStock = getProductStockAtWarehouse(
      product,
      input.sourceWarehouseId,
    )
    const updatedWarehouseStock: Record<string, number> = {
      ...(product.warehouseStock ?? {
        [product.warehouseId]: product.stock,
      }),
      [input.sourceWarehouseId]: currentLocStock - input.quantity,
    }

    const now = new Date()
    const isoTimestamp = now.toISOString()
    const date = isoTimestamp.slice(0, 10)
    const id = generateTransactionId()

    const newRecord: StockTransactionRecord = {
      id,
      type: 'Stock Out',
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: input.quantity,
      previousStock,
      resultingStock,
      warehouseId: input.sourceWarehouseId,
      sourceWarehouseId: input.sourceWarehouseId,
      referenceNumber: input.referenceNumber?.trim() || undefined,
      reason: input.reason?.trim() || 'Authorized inventory dispatch',
      timestamp: isoTimestamp,
      date,
      status: 'Completed',
      isSeed: false,
    }

    this.transactions.unshift(newRecord)

    return {
      ok: true,
      data: {
        record: newRecord,
        resultingStock,
        updatedWarehouseStock,
      },
    }
  }

  async recordAdjustment(
    input: CreateAdjustmentInput,
    products: Product[],
    warehouses: Warehouse[],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  > {
    const val = validateAdjustmentInput(input, products, warehouses)
    if (!val.ok) {
      return { ok: false, message: val.message }
    }

    const product = products.find((p) => p.id === input.productId)!
    const currentLocStock = getProductStockAtWarehouse(
      product,
      input.warehouseId,
    )
    const isTarget = input.mode === 'target'
    const delta = isTarget ? input.quantity - currentLocStock : input.quantity
    const newLocStock = currentLocStock + delta

    const previousStock = product.stock
    const resultingStock = product.stock + delta

    const updatedWarehouseStock: Record<string, number> = {
      ...(product.warehouseStock ?? {
        [product.warehouseId]: product.stock,
      }),
      [input.warehouseId]: newLocStock,
    }

    const now = new Date()
    const isoTimestamp = now.toISOString()
    const date = isoTimestamp.slice(0, 10)
    const id = generateTransactionId()

    const newRecord: StockTransactionRecord = {
      id,
      type: 'Adjustment',
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: delta,
      previousStock,
      resultingStock,
      warehouseId: input.warehouseId,
      referenceNumber: input.referenceNumber?.trim() || undefined,
      reason: input.reason.trim(),
      timestamp: isoTimestamp,
      date,
      status: 'Completed',
      isSeed: false,
    }

    this.transactions.unshift(newRecord)

    return {
      ok: true,
      data: {
        record: newRecord,
        resultingStock,
        updatedWarehouseStock,
      },
    }
  }

  async recordTransfer(
    input: CreateTransferInput,
    products: Product[],
    warehouses: Warehouse[],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
      newPrimaryWarehouseId: string
    }>
  > {
    const val = validateTransferInput(input, products, warehouses)
    if (!val.ok) {
      return { ok: false, message: val.message }
    }

    const product = products.find((p) => p.id === input.productId)!
    const sourcePrev = getProductStockAtWarehouse(
      product,
      input.sourceWarehouseId,
    )
    const destPrev = getProductStockAtWarehouse(
      product,
      input.destinationWarehouseId,
    )

    const sourceResult = sourcePrev - input.quantity
    const destResult = destPrev + input.quantity

    const updatedWarehouseStock: Record<string, number> = {
      ...(product.warehouseStock ?? {
        [product.warehouseId]: product.stock,
      }),
      [input.sourceWarehouseId]: sourceResult,
      [input.destinationWarehouseId]: destResult,
    }

    const totalStock = product.stock
    const newPrimaryWarehouseId =
      destResult === totalStock
        ? input.destinationWarehouseId
        : product.warehouseId

    const now = new Date()
    const isoTimestamp = now.toISOString()
    const date = isoTimestamp.slice(0, 10)
    const id = generateTransactionId()

    const newRecord: StockTransactionRecord = {
      id,
      type: 'Transfer',
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: input.quantity,
      previousStock: totalStock,
      resultingStock: totalStock,
      warehouseId: input.sourceWarehouseId,
      sourceWarehouseId: input.sourceWarehouseId,
      destinationWarehouseId: input.destinationWarehouseId,
      sourcePreviousStock: sourcePrev,
      sourceResultingStock: sourceResult,
      destinationPreviousStock: destPrev,
      destinationResultingStock: destResult,
      referenceNumber: input.referenceNumber?.trim() || undefined,
      reason:
        input.reason?.trim() ||
        `Inter-facility transfer to ${
          warehouses.find((w) => w.id === input.destinationWarehouseId)?.name ??
          input.destinationWarehouseId
        }`,
      timestamp: isoTimestamp,
      date,
      status: 'Completed',
      isSeed: false,
    }

    this.transactions.unshift(newRecord)

    return {
      ok: true,
      data: {
        record: newRecord,
        resultingStock: totalStock,
        updatedWarehouseStock,
        newPrimaryWarehouseId,
      },
    }
  }
}

export const mockTransactionService = new MockTransactionService()
