import { apiClient } from './client'
import type { ITransactionRepository } from './transactionService'
import type {
  BackendStockTransactionResponse,
  InventoryResponse,
  RackResponse,
  ServiceResult,
  StockInRequest,
  StockOutRequest,
  StockTransferRequest,
} from './types'
import type { Product, Warehouse } from '@/mocks/inventoryData'
import type { Supplier } from '@/mocks/supplierData'
import type {
  CreateAdjustmentInput,
  CreateStockInInput,
  CreateStockOutInput,
  CreateTransferInput,
  StockTransactionRecord,
} from '@/mocks/transactionData'

export class HttpTransactionService implements ITransactionRepository {
  async getTransactions(): Promise<StockTransactionRecord[]> {
    const rawTransactions =
      await apiClient.get<BackendStockTransactionResponse[]>(
        '/stock/transactions',
      )

    return rawTransactions.map((tx) => {
      let type: 'Stock In' | 'Stock Out' | 'Transfer' | 'Adjustment' = 'Stock In'
      if (tx.transactionType === 'STOCK_IN') type = 'Stock In'
      else if (tx.transactionType === 'STOCK_OUT') type = 'Stock Out'
      else if (tx.transactionType === 'TRANSFER') type = 'Transfer'
      else if (tx.transactionType === 'ADJUSTMENT') type = 'Adjustment'

      return {
        id: tx.id,
        sku: tx.productSku,
        productName: tx.productName,
        type,
        quantity: tx.quantity,
        previousStock: tx.balanceAfter ? tx.balanceAfter - tx.quantity : 0,
        resultingStock: tx.balanceAfter || 0,
        warehouseId: tx.destinationRackId || '',
        destinationWarehouseId: tx.destinationRackId || undefined,
        sourceWarehouseId: tx.sourceRackId || undefined,
        timestamp: tx.createdAt,
        date: tx.createdAt.slice(0, 10),
        status: 'Completed',
        referenceNumber: tx.reference || undefined,
        reason: tx.reason || undefined,
      } as StockTransactionRecord
    })
  }

  async recordStockIn(
    input: CreateStockInInput,
    products: Product[],
    _warehouses: Warehouse[] = [],
    _suppliers: Supplier[] = [],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  > {
    try {
      const racks = await apiClient.get<RackResponse[]>('/racks')
      const targetRack =
        racks.find((r) => r.warehouseId === input.destinationWarehouseId) ||
        racks[0]

      if (!targetRack) {
        return {
          ok: false,
          message: 'No rack found in facility to receive stock.',
        }
      }

      const payload: StockInRequest = {
        productId: input.productId,
        destinationRackId: targetRack.id,
        quantity: input.quantity,
        reference:
          input.referenceNumber || `IN-${Date.now().toString().slice(-4)}`,
        reason: input.reason || 'Inbound stock receipt',
      }

      const res = await apiClient.post<BackendStockTransactionResponse>(
        '/stock/transactions/in',
        payload,
      )

      const product = products.find((p) => p.id === input.productId)
      const currentStock = product?.stock || 0
      const resultingStock = currentStock + input.quantity

      const updatedWarehouseStock = { ...(product?.warehouseStock || {}) }
      updatedWarehouseStock[input.destinationWarehouseId] =
        (updatedWarehouseStock[input.destinationWarehouseId] || 0) +
        input.quantity

      const record: StockTransactionRecord = {
        id: res.id,
        productId: input.productId,
        sku: res.productSku,
        productName: res.productName,
        type: 'Stock In',
        quantity: res.quantity,
        previousStock: currentStock,
        resultingStock,
        warehouseId: input.destinationWarehouseId,
        destinationWarehouseId: input.destinationWarehouseId,
        timestamp: res.createdAt,
        date: res.createdAt.slice(0, 10),
        status: 'Completed',
        referenceNumber: res.reference || undefined,
        reason: res.reason || undefined,
      }

      return {
        ok: true,
        data: {
          record,
          resultingStock,
          updatedWarehouseStock,
        },
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stock In failed'
      return { ok: false, message: msg }
    }
  }

  async recordStockOut(
    input: CreateStockOutInput,
    products: Product[],
    _warehouses: Warehouse[] = [],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  > {
    try {
      const inventory = await apiClient.get<InventoryResponse[]>('/inventory')
      const available = inventory.find(
        (i) => i.productId === input.productId && i.quantity >= input.quantity,
      )

      if (!available) {
        return {
          ok: false,
          message: 'Insufficient stock available in storage locations.',
        }
      }

      const payload: StockOutRequest = {
        productId: input.productId,
        sourceRackId: available.rackId,
        quantity: input.quantity,
        reference:
          input.referenceNumber || `OUT-${Date.now().toString().slice(-4)}`,
        reason: input.reason || 'Outbound stock issuance',
      }

      const res = await apiClient.post<BackendStockTransactionResponse>(
        '/stock/transactions/out',
        payload,
      )

      const product = products.find((p) => p.id === input.productId)
      const currentStock = product?.stock || 0
      const resultingStock = Math.max(0, currentStock - input.quantity)

      const updatedWarehouseStock = { ...(product?.warehouseStock || {}) }
      updatedWarehouseStock[input.sourceWarehouseId] = Math.max(
        0,
        (updatedWarehouseStock[input.sourceWarehouseId] || 0) - input.quantity,
      )

      const record: StockTransactionRecord = {
        id: res.id,
        productId: input.productId,
        sku: res.productSku,
        productName: res.productName,
        type: 'Stock Out',
        quantity: res.quantity,
        previousStock: currentStock,
        resultingStock,
        warehouseId: input.sourceWarehouseId,
        sourceWarehouseId: input.sourceWarehouseId,
        timestamp: res.createdAt,
        date: res.createdAt.slice(0, 10),
        status: 'Completed',
        referenceNumber: res.reference || undefined,
        reason: res.reason || undefined,
      }

      return {
        ok: true,
        data: {
          record,
          resultingStock,
          updatedWarehouseStock,
        },
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stock Out failed'
      return { ok: false, message: msg }
    }
  }

  async recordAdjustment(
    input: CreateAdjustmentInput,
    products: Product[],
    warehouses: Warehouse[] = [],
    suppliers: Supplier[] = [],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
    }>
  > {
    if (input.quantity >= 0) {
      return this.recordStockIn(
        {
          productId: input.productId,
          destinationWarehouseId: input.warehouseId,
          quantity: input.quantity,
          supplierId: suppliers[0]?.id || '',
          reason: input.reason,
          referenceNumber:
            input.referenceNumber || `ADJ-${Date.now().toString().slice(-4)}`,
        },
        products,
        warehouses,
        suppliers,
      )
    } else {
      return this.recordStockOut(
        {
          productId: input.productId,
          sourceWarehouseId: input.warehouseId,
          quantity: Math.abs(input.quantity),
          reason: input.reason,
          referenceNumber:
            input.referenceNumber || `ADJ-${Date.now().toString().slice(-4)}`,
        },
        products,
        warehouses,
      )
    }
  }

  async recordTransfer(
    input: CreateTransferInput,
    products: Product[],
    _warehouses: Warehouse[] = [],
  ): Promise<
    ServiceResult<{
      record: StockTransactionRecord
      resultingStock: number
      updatedWarehouseStock: Record<string, number>
      newPrimaryWarehouseId: string
    }>
  > {
    try {
      const [inventory, racks] = await Promise.all([
        apiClient.get<InventoryResponse[]>('/inventory'),
        apiClient.get<RackResponse[]>('/racks'),
      ])

      const srcInv = inventory.find(
        (i) => i.productId === input.productId && i.quantity >= input.quantity,
      )
      const dstRack =
        racks.find((r) => r.warehouseId === input.destinationWarehouseId) ||
        racks.find((r) => r.id !== srcInv?.rackId) ||
        racks[0]

      if (!srcInv || !dstRack) {
        return {
          ok: false,
          message:
            'Unable to locate source stock or destination rack for transfer.',
        }
      }

      const payload: StockTransferRequest = {
        productId: input.productId,
        sourceRackId: srcInv.rackId,
        destinationRackId: dstRack.id,
        quantity: input.quantity,
        reference:
          input.referenceNumber || `TRF-${Date.now().toString().slice(-4)}`,
        reason: input.reason || 'Inter-facility transfer',
      }

      const res = await apiClient.post<BackendStockTransactionResponse>(
        '/stock/transactions/transfer',
        payload,
      )

      const product = products.find((p) => p.id === input.productId)
      const currentStock = { ...(product?.warehouseStock || {}) }

      currentStock[input.sourceWarehouseId] = Math.max(
        0,
        (currentStock[input.sourceWarehouseId] || 0) - input.quantity,
      )
      currentStock[input.destinationWarehouseId] =
        (currentStock[input.destinationWarehouseId] || 0) + input.quantity

      const totalStock = product?.stock || 0

      const record: StockTransactionRecord = {
        id: res.id,
        productId: input.productId,
        sku: res.productSku,
        productName: res.productName,
        type: 'Transfer',
        quantity: res.quantity,
        previousStock: totalStock,
        resultingStock: totalStock,
        warehouseId: input.sourceWarehouseId,
        sourceWarehouseId: input.sourceWarehouseId,
        destinationWarehouseId: input.destinationWarehouseId,
        timestamp: res.createdAt,
        date: res.createdAt.slice(0, 10),
        status: 'Completed',
        referenceNumber: res.reference || undefined,
        reason: res.reason || undefined,
      }

      return {
        ok: true,
        data: {
          record,
          resultingStock: totalStock,
          updatedWarehouseStock: currentStock,
          newPrimaryWarehouseId: input.destinationWarehouseId,
        },
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stock Transfer failed'
      return { ok: false, message: msg }
    }
  }
}

export const httpTransactionService = new HttpTransactionService()
