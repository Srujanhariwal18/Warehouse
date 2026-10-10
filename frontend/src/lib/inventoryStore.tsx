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
  type Product,
  type StockTransaction,
} from '@/mocks/inventoryData'

type ProductInput = Omit<Product, 'id'>
type StockOperation = 'Stock In' | 'Stock Out'

type InventoryStore = {
  products: Product[]
  transactions: StockTransaction[]
  lowStockProducts: Product[]
  addProduct: (input: ProductInput) => void
  updateProduct: (id: string, input: ProductInput) => void
  applyStockOperation: (
    productId: string,
    quantity: number,
    operation: StockOperation,
  ) => { ok: true } | { ok: false; message: string }
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
        setProducts((current) => [
          ...current,
          { ...input, id: `product-${Date.now()}` },
        ])
      },
      updateProduct: (id, input) => {
        setProducts((current) =>
          current.map((product) =>
            product.id === id ? { ...input, id } : product,
          ),
        )
      },
      applyStockOperation: (productId, quantity, operation) => {
        if (!Number.isFinite(quantity) || quantity <= 0) {
          return { ok: false, message: 'Quantity must be greater than zero.' }
        }

        const product = products.find((item) => item.id === productId)
        if (!product) return { ok: false, message: 'Product was not found.' }
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
          id: `txn-${Date.now()}`,
          productId,
          type: operation === 'Stock In' ? 'Inbound' : 'Outbound',
          quantity,
          warehouseId: product.warehouseId,
          date: new Date().toISOString(),
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
