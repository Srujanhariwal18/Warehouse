import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  products as initialProducts,
  stockTransactions as initialTransactions,
  warehouses,
  type Product,
  type StockTransaction,
} from '@/mocks/inventoryData'

export type ProductInput = Omit<Product, 'id'>
export type StockOperation = 'Stock In' | 'Stock Out'
export type StoreOperationResult =
  { ok: true; id?: string } | { ok: false; message: string }

export type InventoryStore = {
  products: Product[]
  transactions: StockTransaction[]
  lowStockProducts: Product[]
  addProduct: (input: ProductInput) => StoreOperationResult
  updateProduct: (id: string, input: ProductInput) => StoreOperationResult
  applyStockOperation: (
    productId: string,
    quantity: number,
    operation: StockOperation,
  ) => StoreOperationResult
}

let uniqueCounter = 0
function generateUniqueId(prefix: string): string {
  uniqueCounter += 1
  const timestamp = Date.now()
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${timestamp}-${crypto.randomUUID().slice(0, 8)}`
  }
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${timestamp}-${uniqueCounter}-${random}`
}

function validateProductData(
  input: ProductInput,
  currentProducts: Product[],
  excludeProductId?: string,
): { ok: true } | { ok: false; message: string } {
  const trimmedName = input.name?.trim() ?? ''
  if (!trimmedName) {
    return { ok: false, message: 'Product name is required.' }
  }

  const trimmedSku = input.sku?.trim() ?? ''
  if (!trimmedSku) {
    return { ok: false, message: 'SKU is required.' }
  }

  if (!/^[A-Za-z0-9-]+$/.test(trimmedSku)) {
    return {
      ok: false,
      message: 'SKU may only contain letters, numbers, and hyphens.',
    }
  }

  const duplicateSku = currentProducts.some(
    (product) =>
      product.id !== excludeProductId &&
      product.sku.trim().toLowerCase() === trimmedSku.toLowerCase(),
  )
  if (duplicateSku) {
    return {
      ok: false,
      message: `A product with SKU "${trimmedSku}" already exists. SKUs must be unique (case-insensitive).`,
    }
  }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    return {
      ok: false,
      message: 'Unit price must be a finite positive number.',
    }
  }

  if (
    !Number.isFinite(input.stock) ||
    !Number.isInteger(input.stock) ||
    input.stock < 0
  ) {
    return {
      ok: false,
      message: 'Available quantity must be a non-negative whole number.',
    }
  }

  if (
    !Number.isFinite(input.reorderThreshold) ||
    !Number.isInteger(input.reorderThreshold) ||
    input.reorderThreshold < 0
  ) {
    return {
      ok: false,
      message: 'Reorder threshold must be a non-negative whole number.',
    }
  }

  const validWarehouse = warehouses.some((w) => w.id === input.warehouseId)
  if (!validWarehouse) {
    return { ok: false, message: 'Please select a valid warehouse.' }
  }

  return { ok: true }
}

const InventoryContext = createContext<InventoryStore | null>(null)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(initialProducts)
  const [transactions, setTransactions] = useState(initialTransactions)

  const store = useMemo<InventoryStore>(() => {
    const lowStockProducts = products.filter(
      (product) => product.stock <= product.reorderThreshold,
    )

    return {
      products,
      transactions,
      lowStockProducts,
      addProduct: (input) => {
        const validation = validateProductData(input, products)
        if (!validation.ok) {
          return validation
        }
        const id = generateUniqueId('product')
        const newProduct: Product = {
          ...input,
          id,
          name: input.name.trim(),
          sku: input.sku.trim(),
        }
        setProducts((current) => [...current, newProduct])
        return { ok: true, id }
      },
      updateProduct: (id, input) => {
        const existing = products.find((p) => p.id === id)
        if (!existing) {
          return { ok: false, message: 'Product was not found.' }
        }
        const validation = validateProductData(input, products, id)
        if (!validation.ok) {
          return validation
        }
        setProducts((current) =>
          current.map((product) =>
            product.id === id
              ? {
                  ...input,
                  id,
                  name: input.name.trim(),
                  sku: input.sku.trim(),
                }
              : product,
          ),
        )
        return { ok: true }
      },
      applyStockOperation: (productId, quantity, operation) => {
        if (
          !Number.isFinite(quantity) ||
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          return {
            ok: false,
            message: 'Quantity must be a positive whole number.',
          }
        }

        const product = products.find((item) => item.id === productId)
        if (!product) {
          return { ok: false, message: 'Product was not found.' }
        }
        if (operation === 'Stock Out' && quantity > product.stock) {
          return {
            ok: false,
            message: `Only ${product.stock} units are available for stock out.`,
          }
        }

        const nextStock =
          operation === 'Stock In'
            ? product.stock + quantity
            : product.stock - quantity
        const transaction: StockTransaction = {
          id: generateUniqueId('txn'),
          productId,
          type: operation === 'Stock In' ? 'Inbound' : 'Outbound',
          quantity,
          warehouseId: product.warehouseId,
          date: new Date().toISOString().slice(0, 10),
        }

        setProducts((current) =>
          current.map((item) =>
            item.id === productId ? { ...item, stock: nextStock } : item,
          ),
        )
        setTransactions((current) => [transaction, ...current])
        return { ok: true }
      },
    }
  }, [products, transactions])

  return (
    <InventoryContext.Provider value={store}>
      {children}
    </InventoryContext.Provider>
  )
}

// The hook intentionally shares the provider's context from this small store module.
// eslint-disable-next-line react-refresh/only-export-components
export function useInventoryStore() {
  const store = useContext(InventoryContext)
  if (!store) {
    throw new Error('useInventoryStore must be used inside InventoryProvider')
  }
  return store
}
