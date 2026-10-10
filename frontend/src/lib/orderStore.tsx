import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  initialOrders,
  type Order,
  type OrderItem,
  type OrderStatus,
  type OrderTimelineEvent,
} from '@/mocks/orderData'
import { warehouses, type Product } from '@/mocks/inventoryData'
import { useInventoryStore } from '@/lib/inventoryStore'

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

export type OrderOperationResult =
  { ok: true; id?: string } | { ok: false; message: string }

export type OrdersStore = {
  orders: Order[]
  createOrder: (input: CreateOrderInput) => OrderOperationResult
  updateOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    reason?: string,
  ) => OrderOperationResult
  cancelOrder: (orderId: string, reason?: string) => OrderOperationResult
}

const OrdersContext = createContext<OrdersStore | null>(null)

function validateStatusTransition(
  current: OrderStatus,
  next: OrderStatus,
): { valid: boolean; message?: string } {
  if (current === next) {
    return { valid: false, message: `Order is already in ${current} status.` }
  }

  if (current === 'Completed') {
    return {
      valid: false,
      message: 'Completed orders cannot be transitioned to another status.',
    }
  }

  if (current === 'Cancelled') {
    return {
      valid: false,
      message: 'Cancelled orders cannot be reopened or modified.',
    }
  }

  if (current === 'Pending') {
    if (next === 'Processing' || next === 'Cancelled') {
      return { valid: true }
    }
    return {
      valid: false,
      message: 'Pending orders must be moved to Processing before completion.',
    }
  }

  if (current === 'Processing') {
    if (next === 'Completed' || next === 'Cancelled') {
      return { valid: true }
    }
    return {
      valid: false,
      message: 'Processing orders can only be Completed or Cancelled.',
    }
  }

  return { valid: false, message: 'Invalid status transition.' }
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateOrderInput(
  input: CreateOrderInput,
  currentProducts: Product[],
):
  | {
      ok: true
      resolvedItems: OrderItem[]
      totalAmount: number
    }
  | {
      ok: false
      message: string
    } {
  const trimmedName = input.customerName.trim()
  if (!trimmedName) {
    return { ok: false, message: 'Customer name is required.' }
  }

  const validWarehouse = warehouses.some((w) => w.id === input.warehouseId)
  if (!validWarehouse) {
    return { ok: false, message: 'Please select a valid warehouse.' }
  }

  if (!input.items || input.items.length === 0) {
    return {
      ok: false,
      message: 'An order must contain at least one line item.',
    }
  }

  // 1. Validate line items individually for existence and positive integers
  for (const item of input.items) {
    const product = currentProducts.find((p) => p.id === item.productId)
    if (!product) {
      return {
        ok: false,
        message: 'One or more selected products do not exist.',
      }
    }

    if (
      !Number.isFinite(item.quantity) ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return {
        ok: false,
        message: `Quantity for "${product.name}" must be a positive whole number.`,
      }
    }
  }

  // 2. Aggregate quantities by productId before validating stock
  const aggregatedQuantities = new Map<string, number>()
  for (const item of input.items) {
    const current = aggregatedQuantities.get(item.productId) ?? 0
    aggregatedQuantities.set(item.productId, current + item.quantity)
  }

  // 3. Validate combined quantity against available stock
  for (const [productId, combinedQty] of aggregatedQuantities.entries()) {
    const product = currentProducts.find((p) => p.id === productId)!
    if (combinedQty > product.stock) {
      const hasDuplicates =
        input.items.filter((i) => i.productId === productId).length > 1
      return {
        ok: false,
        message: hasDuplicates
          ? `Combined quantity for "${product.name}" (${combinedQty} units) exceeds available stock (${product.stock} units).`
          : `Requested quantity for "${product.name}" (${combinedQty}) exceeds available stock (${product.stock} units).`,
      }
    }
  }

  // 4. Resolve items without deducting inventory stock
  const resolvedItems: OrderItem[] = input.items.map((item) => {
    const product = currentProducts.find((p) => p.id === item.productId)!
    const lineTotal = item.quantity * product.price
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      total: lineTotal,
    }
  })

  const totalAmount = resolvedItems.reduce((sum, item) => sum + item.total, 0)

  return {
    ok: true,
    resolvedItems,
    totalAmount,
  }
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const { products: liveProducts } = useInventoryStore()

  const store = useMemo<OrdersStore>(() => {
    return {
      orders,
      createOrder: (input) => {
        const validation = validateOrderInput(input, liveProducts)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const { resolvedItems, totalAmount } = validation

        // Generate unique order ID
        const existingNumbers = orders
          .map((o) => {
            const match = o.id.match(/^ORD-(\d+)$/)
            return match ? Number(match[1]) : 0
          })
          .filter(Boolean)
        const nextNumber =
          existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1001
        const id = `ORD-${nextNumber}`

        const today = new Date().toISOString().slice(0, 10)

        const newOrder: Order = {
          id,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail.trim(),
          customerPhone: input.customerPhone.trim(),
          createdAt: today,
          items: resolvedItems,
          totalAmount,
          warehouseId: input.warehouseId,
          status: 'Pending',
          notes: input.notes?.trim() || undefined,
          timeline: [
            {
              id: `tl-${id}-1`,
              status: 'Pending',
              timestamp: new Date().toISOString(),
              note: `Order registered via workspace by ${input.customerName.trim()}.`,
            },
          ],
        }

        setOrders((current) => [newOrder, ...current])
        return { ok: true, id }
      },

      updateOrderStatus: (orderId, nextStatus, reason) => {
        const order = orders.find((o) => o.id === orderId)
        if (!order) {
          return { ok: false, message: 'Order was not found.' }
        }

        const transitionCheck = validateStatusTransition(
          order.status,
          nextStatus,
        )
        if (!transitionCheck.valid) {
          return {
            ok: false,
            message: transitionCheck.message ?? 'Invalid status transition.',
          }
        }

        const newTimelineEvent: OrderTimelineEvent = {
          id: `tl-${orderId}-${Date.now()}`,
          status: nextStatus,
          timestamp: new Date().toISOString(),
          note:
            reason ||
            (nextStatus === 'Processing'
              ? 'Order moved to processing and warehouse queue.'
              : nextStatus === 'Completed'
                ? 'Order marked as completed and fulfilled.'
                : 'Order cancelled.'),
        }

        setOrders((current) =>
          current.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: nextStatus,
                  timeline: [...o.timeline, newTimelineEvent],
                }
              : o,
          ),
        )

        return { ok: true }
      },

      cancelOrder: (orderId, reason) => {
        const order = orders.find((o) => o.id === orderId)
        if (!order) {
          return { ok: false, message: 'Order was not found.' }
        }

        const transitionCheck = validateStatusTransition(
          order.status,
          'Cancelled',
        )
        if (!transitionCheck.valid) {
          return {
            ok: false,
            message:
              transitionCheck.message ?? 'This order cannot be cancelled.',
          }
        }

        const noteText = reason?.trim()
          ? `Order cancelled: ${reason.trim()}`
          : 'Order cancelled by operator.'

        const newTimelineEvent: OrderTimelineEvent = {
          id: `tl-${orderId}-${Date.now()}`,
          status: 'Cancelled',
          timestamp: new Date().toISOString(),
          note: noteText,
        }

        setOrders((current) =>
          current.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'Cancelled',
                  timeline: [...o.timeline, newTimelineEvent],
                }
              : o,
          ),
        )

        return { ok: true }
      },
    }
  }, [orders, liveProducts])

  return (
    <OrdersContext.Provider value={store}>{children}</OrdersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOrdersStore() {
  const store = useContext(OrdersContext)
  if (!store) {
    throw new Error('useOrdersStore must be used inside OrdersProvider')
  }
  return store
}
