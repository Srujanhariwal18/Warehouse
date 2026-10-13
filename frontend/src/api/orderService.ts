import {
  initialOrders,
  type Order,
  type OrderStatus,
  type OrderTimelineEvent,
} from '@/mocks/orderData'
import type { Product, Warehouse } from '@/mocks/inventoryData'
import type { CreateOrderInput, ServiceResult } from './types'
import { validateOrderInput } from '@/lib/orderStore'

/**
 * Repository interface for Order Management.
 * In the final phase, this boundary will be implemented by an HTTP/REST
 * client communicating with the Spring Boot backend (`/api/v1/orders`).
 */
export interface IOrderRepository {
  getOrders(): Promise<Order[]>
  createOrder(
    input: CreateOrderInput,
    products: Product[],
    warehouses: Warehouse[],
  ): Promise<ServiceResult<{ id: string; order: Order }>>
  updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    reason?: string,
  ): Promise<ServiceResult<{ order: Order }>>
  cancelOrder(
    orderId: string,
    reason?: string,
  ): Promise<ServiceResult<{ order: Order }>>
}

let orderCounter = 200
function generateOrderId(): string {
  orderCounter += 1
  return `ORD-${orderCounter}`
}

export class MockOrderService implements IOrderRepository {
  private orders: Order[]

  constructor(seed = initialOrders) {
    this.orders = JSON.parse(JSON.stringify(seed))
  }

  async getOrders(): Promise<Order[]> {
    return [...this.orders]
  }

  async createOrder(
    input: CreateOrderInput,
    products: Product[],
    warehouses: Warehouse[],
  ): Promise<ServiceResult<{ id: string; order: Order }>> {
    const val = validateOrderInput(input, products, warehouses)
    if (!val.ok) {
      return { ok: false, message: val.message }
    }

    const today = new Date().toISOString().slice(0, 10)
    const orderId = generateOrderId()

    const initialTimeline: OrderTimelineEvent = {
      id: `evt-${Date.now()}-1`,
      status: 'Pending',
      timestamp: `${today} 09:00`,
      note: 'Order placed by customer via automated portal',
    }

    const newOrder: Order = {
      id: orderId,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim(),
      customerPhone: input.customerPhone.trim(),
      createdAt: today,
      warehouseId: input.warehouseId,
      status: 'Pending',
      items: val.resolvedItems,
      totalAmount: val.totalAmount,
      notes: input.notes?.trim() || undefined,
      timeline: [initialTimeline],
    }

    this.orders.unshift(newOrder)

    return { ok: true, data: { id: orderId, order: newOrder } }
  }

  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    reason?: string,
  ): Promise<ServiceResult<{ order: Order }>> {
    const order = this.orders.find((o) => o.id === orderId)
    if (!order) {
      return { ok: false, message: `Order "${orderId}" was not found.` }
    }

    if (order.status === nextStatus) {
      return {
        ok: false,
        message: `Order is already in ${nextStatus} status.`,
      }
    }

    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return {
        ok: false,
        message: `Order is in terminal status "${order.status}" and cannot be changed.`,
      }
    }

    const now = new Date()
    const timeString = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`

    const eventNote =
      reason?.trim() ||
      (nextStatus === 'Processing'
        ? 'Order marked as Processing in distribution hub'
        : nextStatus === 'Completed'
          ? 'Order dispatch confirmed and marked completed'
          : `Order status transitioned to ${nextStatus}`)

    const newEvent: OrderTimelineEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: nextStatus,
      timestamp: timeString,
      note: eventNote,
    }

    order.status = nextStatus
    order.timeline.push(newEvent)

    return { ok: true, data: { order } }
  }

  async cancelOrder(
    orderId: string,
    reason?: string,
  ): Promise<ServiceResult<{ order: Order }>> {
    return this.updateOrderStatus(
      orderId,
      'Cancelled',
      reason ? `Order cancelled: ${reason}` : 'Order cancelled by operator',
    )
  }
}

export const mockOrderService = new MockOrderService()
