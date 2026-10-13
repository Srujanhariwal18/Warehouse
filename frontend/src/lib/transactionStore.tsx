import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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
import { useInventoryStore } from '@/lib/inventoryStore'
import { useWarehouseStore } from '@/lib/warehouseStore'
import { useSuppliersStore } from '@/lib/supplierStore'
import { httpTransactionService } from '@/api/httpTransactionService'

export type TransactionOperationResult =
  { ok: true; id: string } | { ok: false; message: string }

export type TransactionStore = {
  transactions: StockTransactionRecord[]
  createStockIn: (input: CreateStockInInput) => TransactionOperationResult
  createStockOut: (input: CreateStockOutInput) => TransactionOperationResult
  createAdjustment: (input: CreateAdjustmentInput) => TransactionOperationResult
  createTransfer: (input: CreateTransferInput) => TransactionOperationResult
}

const TransactionContext = createContext<TransactionStore | null>(null)

let txCounter = 100
function generateTransactionId(): string {
  txCounter += 1
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `TXN-${today}-${txCounter}`
}

// eslint-disable-next-line react-refresh/only-export-components
export function getProductStockAtWarehouse(
  product: Product,
  warehouseId: string,
): number {
  if (
    product.warehouseStock &&
    typeof product.warehouseStock[warehouseId] === 'number'
  ) {
    return product.warehouseStock[warehouseId]
  }
  return product.warehouseId === warehouseId ? product.stock : 0
}

// -----------------------------------------------------------------------------
// Pure Validation Functions
// -----------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export function validateStockInInput(
  input: Partial<CreateStockInInput>,
  products: Product[],
  warehousesList: Warehouse[],
  suppliersList: Supplier[],
): { ok: true } | { ok: false; message: string } {
  const productId = input.productId?.trim() ?? ''
  if (!productId) {
    return { ok: false, message: 'Please select a product for stock receipt.' }
  }

  const product = products.find((p) => p.id === productId)
  if (!product) {
    return { ok: false, message: `Product "${productId}" does not exist.` }
  }

  const destinationWarehouseId = input.destinationWarehouseId?.trim() ?? ''
  if (!destinationWarehouseId) {
    return { ok: false, message: 'Destination warehouse is required.' }
  }

  const destinationWarehouse = warehousesList.find(
    (w) => w.id === destinationWarehouseId,
  )
  if (!destinationWarehouse) {
    return {
      ok: false,
      message: `Destination warehouse "${destinationWarehouseId}" does not exist.`,
    }
  }

  const quantity = input.quantity
  if (
    quantity === undefined ||
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return {
      ok: false,
      message: 'Received quantity must be a positive whole number.',
    }
  }

  if (input.supplierId?.trim()) {
    const supplier = suppliersList.find(
      (s) => s.id === input.supplierId?.trim(),
    )
    if (!supplier) {
      return {
        ok: false,
        message: `Selected supplier "${input.supplierId.trim()}" does not exist.`,
      }
    }
  }

  return { ok: true }
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateStockOutInput(
  input: Partial<CreateStockOutInput>,
  products: Product[],
  warehousesList: Warehouse[],
): { ok: true } | { ok: false; message: string } {
  const productId = input.productId?.trim() ?? ''
  if (!productId) {
    return { ok: false, message: 'Please select a product for dispatch.' }
  }

  const product = products.find((p) => p.id === productId)
  if (!product) {
    return { ok: false, message: `Product "${productId}" does not exist.` }
  }

  const sourceWarehouseId = input.sourceWarehouseId?.trim() ?? ''
  if (!sourceWarehouseId) {
    return { ok: false, message: 'Source warehouse is required.' }
  }

  const sourceWarehouse = warehousesList.find((w) => w.id === sourceWarehouseId)
  if (!sourceWarehouse) {
    return {
      ok: false,
      message: `Source warehouse "${sourceWarehouseId}" does not exist.`,
    }
  }

  const quantity = input.quantity
  if (
    quantity === undefined ||
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return {
      ok: false,
      message: 'Dispatch quantity must be a positive whole number.',
    }
  }

  const availableStock = getProductStockAtWarehouse(product, sourceWarehouseId)
  if (quantity > availableStock) {
    return {
      ok: false,
      message: `Insufficient stock: only ${availableStock} units available at ${sourceWarehouse.name} (${quantity} requested).`,
    }
  }

  return { ok: true }
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateAdjustmentInput(
  input: Partial<CreateAdjustmentInput>,
  products: Product[],
  warehousesList: Warehouse[],
):
  | { ok: true; resultingStock: number; delta: number }
  | { ok: false; message: string } {
  const productId = input.productId?.trim() ?? ''
  if (!productId) {
    return { ok: false, message: 'Please select a product for adjustment.' }
  }

  const product = products.find((p) => p.id === productId)
  if (!product) {
    return { ok: false, message: `Product "${productId}" does not exist.` }
  }

  const warehouseId = input.warehouseId?.trim() ?? ''
  if (!warehouseId) {
    return { ok: false, message: 'Warehouse location is required.' }
  }

  const warehouse = warehousesList.find((w) => w.id === warehouseId)
  if (!warehouse) {
    return {
      ok: false,
      message: `Warehouse "${warehouseId}" does not exist.`,
    }
  }

  const reason = input.reason?.trim() ?? ''
  if (!reason) {
    return {
      ok: false,
      message: 'A detailed adjustment reason or audit note is required.',
    }
  }

  const quantity = input.quantity
  if (
    quantity === undefined ||
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity)
  ) {
    return {
      ok: false,
      message: 'Adjustment value must be a whole number.',
    }
  }

  const currentLocStock = getProductStockAtWarehouse(product, warehouseId)

  let resultingStock: number
  let delta: number

  if (input.mode === 'target') {
    if (quantity < 0) {
      return {
        ok: false,
        message: 'New physical count cannot be negative.',
      }
    }
    resultingStock = quantity
    delta = quantity - currentLocStock
    if (delta === 0) {
      return {
        ok: false,
        message:
          'New physical count matches current stock; no adjustment is needed.',
      }
    }
  } else {
    // Mode is 'delta'
    if (quantity === 0) {
      return {
        ok: false,
        message: 'Adjustment quantity cannot be zero.',
      }
    }
    resultingStock = currentLocStock + quantity
    delta = quantity
    if (resultingStock < 0) {
      return {
        ok: false,
        message: `Adjustment would cause negative inventory (${resultingStock} units). Maximum reduction is -${currentLocStock}.`,
      }
    }
  }

  return { ok: true, resultingStock, delta }
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateTransferInput(
  input: Partial<CreateTransferInput>,
  products: Product[],
  warehousesList: Warehouse[],
): { ok: true } | { ok: false; message: string } {
  const productId = input.productId?.trim() ?? ''
  if (!productId) {
    return { ok: false, message: 'Please select a product to transfer.' }
  }

  const product = products.find((p) => p.id === productId)
  if (!product) {
    return { ok: false, message: `Product "${productId}" does not exist.` }
  }

  const sourceWarehouseId = input.sourceWarehouseId?.trim() ?? ''
  if (!sourceWarehouseId) {
    return { ok: false, message: 'Source warehouse is required.' }
  }

  const destinationWarehouseId = input.destinationWarehouseId?.trim() ?? ''
  if (!destinationWarehouseId) {
    return { ok: false, message: 'Destination warehouse is required.' }
  }

  if (sourceWarehouseId === destinationWarehouseId) {
    return {
      ok: false,
      message:
        'Source and destination warehouses must be different for an inter-facility transfer.',
    }
  }

  const sourceWarehouse = warehousesList.find((w) => w.id === sourceWarehouseId)
  if (!sourceWarehouse) {
    return {
      ok: false,
      message: `Source warehouse "${sourceWarehouseId}" does not exist.`,
    }
  }

  const destinationWarehouse = warehousesList.find(
    (w) => w.id === destinationWarehouseId,
  )
  if (!destinationWarehouse) {
    return {
      ok: false,
      message: `Destination warehouse "${destinationWarehouseId}" does not exist.`,
    }
  }

  const quantity = input.quantity
  if (
    quantity === undefined ||
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return {
      ok: false,
      message: 'Transfer quantity must be a positive whole number.',
    }
  }

  const availableSourceStock = getProductStockAtWarehouse(
    product,
    sourceWarehouseId,
  )
  if (quantity > availableSourceStock) {
    return {
      ok: false,
      message: `Insufficient stock at source: ${sourceWarehouse.name} only has ${availableSourceStock} units available (${quantity} requested).`,
    }
  }

  return { ok: true }
}

// -----------------------------------------------------------------------------
// Provider Implementation
// -----------------------------------------------------------------------------

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { products, updateProductStock, appendTransaction } =
    useInventoryStore()
  const { warehouses: warehousesList } = useWarehouseStore()
  const { suppliers: suppliersList } = useSuppliersStore()

  const [transactionsList, setTransactionsList] = useState<
    StockTransactionRecord[]
  >(initialTransactionsSeed)

  useEffect(() => {
    let mounted = true
    const loadTransactions = async () => {
      try {
        const live = await httpTransactionService.getTransactions()
        if (mounted && live && live.length > 0) {
          setTransactionsList(live)
        }
      } catch {
        // Fallback or unauthenticated
      }
    }
    loadTransactions()

    const handleAuthChange = () => {
      loadTransactions()
    }
    window.addEventListener('invora:auth-changed', handleAuthChange)

    return () => {
      mounted = false
      window.removeEventListener('invora:auth-changed', handleAuthChange)
    }
  }, [])

  const store = useMemo<TransactionStore>(() => {
    return {
      transactions: transactionsList,

      // -----------------------------------------------------------------------
      // 1. Stock In
      // -----------------------------------------------------------------------
      createStockIn: (input) => {
        const validation = validateStockInInput(
          input,
          products,
          warehousesList,
          suppliersList,
        )
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const product = products.find((p) => p.id === input.productId)!
        const supplier = input.supplierId
          ? suppliersList.find((s) => s.id === input.supplierId)
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

        // Atomically update inventory and append transaction
        updateProductStock(product.id, resultingStock, {
          warehouseStock: updatedWarehouseStock,
        })
        appendTransaction({
          id,
          productId: product.id,
          type: 'Inbound',
          quantity: input.quantity,
          warehouseId: input.destinationWarehouseId,
          date,
        })
        setTransactionsList((prev) => [newRecord, ...prev])

        return { ok: true, id }
      },

      // -----------------------------------------------------------------------
      // 2. Stock Out
      // -----------------------------------------------------------------------
      createStockOut: (input) => {
        const validation = validateStockOutInput(
          input,
          products,
          warehousesList,
        )
        if (!validation.ok) {
          return { ok: false, message: validation.message }
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

        // Atomically update inventory and append transaction
        updateProductStock(product.id, resultingStock, {
          warehouseStock: updatedWarehouseStock,
        })
        appendTransaction({
          id,
          productId: product.id,
          type: 'Outbound',
          quantity: input.quantity,
          warehouseId: input.sourceWarehouseId,
          date,
        })
        setTransactionsList((prev) => [newRecord, ...prev])

        return { ok: true, id }
      },

      // -----------------------------------------------------------------------
      // 3. Adjustment
      // -----------------------------------------------------------------------
      createAdjustment: (input) => {
        const validation = validateAdjustmentInput(
          input,
          products,
          warehousesList,
        )
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const product = products.find((p) => p.id === input.productId)!
        const { resultingStock: newLocStock, delta } = validation

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
          quantity: Math.abs(delta),
          previousStock,
          resultingStock,
          warehouseId: input.warehouseId,
          sourceWarehouseId: input.warehouseId,
          referenceNumber: input.referenceNumber?.trim() || undefined,
          reason: input.reason.trim(),
          timestamp: isoTimestamp,
          date,
          status: 'Completed',
          isSeed: false,
        }

        // Atomically update inventory and append transaction
        updateProductStock(product.id, resultingStock, {
          warehouseStock: updatedWarehouseStock,
        })
        appendTransaction({
          id,
          productId: product.id,
          type: 'Adjustment',
          quantity: delta,
          warehouseId: input.warehouseId,
          date,
        })
        setTransactionsList((prev) => [newRecord, ...prev])

        return { ok: true, id }
      },

      // -----------------------------------------------------------------------
      // 4. Transfer
      // -----------------------------------------------------------------------
      createTransfer: (input) => {
        const validation = validateTransferInput(
          input,
          products,
          warehousesList,
        )
        if (!validation.ok) {
          return { ok: false, message: validation.message }
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

        // Total stock is conserved across all warehouses
        const totalStock = product.stock

        // If all stock of the product has moved to destination, update primary warehouseId
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
              warehousesList.find((w) => w.id === input.destinationWarehouseId)
                ?.name ?? input.destinationWarehouseId
            }`,
          timestamp: isoTimestamp,
          date,
          status: 'Completed',
          isSeed: false,
        }

        // Atomically update inventory and append transaction
        updateProductStock(product.id, totalStock, {
          warehouseId: newPrimaryWarehouseId,
          warehouseStock: updatedWarehouseStock,
        })
        appendTransaction({
          id: `${id}-out`,
          productId: product.id,
          type: 'Outbound',
          quantity: input.quantity,
          warehouseId: input.sourceWarehouseId,
          date,
        })
        appendTransaction({
          id: `${id}-in`,
          productId: product.id,
          type: 'Inbound',
          quantity: input.quantity,
          warehouseId: input.destinationWarehouseId,
          date,
        })
        setTransactionsList((prev) => [newRecord, ...prev])

        return { ok: true, id }
      },
    }
  }, [
    transactionsList,
    products,
    warehousesList,
    suppliersList,
    updateProductStock,
    appendTransaction,
  ])

  return (
    <TransactionContext.Provider value={store}>
      {children}
    </TransactionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTransactionStore() {
  const store = useContext(TransactionContext)
  if (!store) {
    throw new Error(
      'useTransactionStore must be used inside TransactionProvider',
    )
  }
  return store
}
