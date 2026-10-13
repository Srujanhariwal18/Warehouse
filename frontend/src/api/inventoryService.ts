import {
  products as initialProducts,
  type Product,
} from '@/mocks/inventoryData'
import type { ProductInput, ServiceResult } from './types'

/**
 * Repository interface for Inventory Management.
 * In the final phase, this boundary will be implemented by an HTTP/REST
 * client communicating with the Spring Boot backend (`/api/v1/products`).
 */
export interface IInventoryRepository {
  getProducts(): Promise<Product[]>
  getProductById(id: string): Promise<Product | undefined>
  createProduct(input: ProductInput): Promise<ServiceResult<{ id: string }>>
  updateProduct(id: string, input: ProductInput): Promise<ServiceResult>
  updateProductStock(
    productId: string,
    newStock: number,
    locationUpdate?: {
      warehouseId?: string
      warehouseStock?: Record<string, number>
    },
  ): Promise<ServiceResult>
  getLowStockProducts(): Promise<Product[]>
}

export class MockInventoryService implements IInventoryRepository {
  private products: Product[]

  constructor(seedData: Product[] = initialProducts) {
    // Deep clone initial fixture to preserve pristine seed
    this.products = JSON.parse(JSON.stringify(seedData))
  }

  async getProducts(): Promise<Product[]> {
    return [...this.products]
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return this.products.find((p) => p.id === id)
  }

  async createProduct(
    input: ProductInput,
  ): Promise<ServiceResult<{ id: string }>> {
    const trimmedName = input.name?.trim() ?? ''
    const trimmedSku = input.sku?.trim() ?? ''

    if (!trimmedName) {
      return { ok: false, message: 'Product name is required.' }
    }
    if (!trimmedSku) {
      return { ok: false, message: 'SKU is required.' }
    }
    if (!/^[A-Za-z0-9-]+$/.test(trimmedSku)) {
      return {
        ok: false,
        message: 'SKU may only contain letters, numbers, and hyphens.',
      }
    }

    const duplicate = this.products.some(
      (p) => p.sku.trim().toLowerCase() === trimmedSku.toLowerCase(),
    )
    if (duplicate) {
      return {
        ok: false,
        message: `A product with SKU "${trimmedSku}" already exists.`,
      }
    }

    if (!Number.isFinite(input.price) || input.price <= 0) {
      return { ok: false, message: 'Unit price must be a positive number.' }
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

    const id = `product-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newProduct: Product = {
      ...input,
      id,
      name: trimmedName,
      sku: trimmedSku,
    }
    this.products.push(newProduct)

    return { ok: true, data: { id } }
  }

  async updateProduct(id: string, input: ProductInput): Promise<ServiceResult> {
    const existingIndex = this.products.findIndex((p) => p.id === id)
    if (existingIndex === -1) {
      return { ok: false, message: 'Product was not found.' }
    }

    const trimmedName = input.name?.trim() ?? ''
    const trimmedSku = input.sku?.trim() ?? ''

    if (!trimmedName) {
      return { ok: false, message: 'Product name is required.' }
    }
    if (!trimmedSku) {
      return { ok: false, message: 'SKU is required.' }
    }
    if (!/^[A-Za-z0-9-]+$/.test(trimmedSku)) {
      return {
        ok: false,
        message: 'SKU may only contain letters, numbers, and hyphens.',
      }
    }

    const duplicate = this.products.some(
      (p) =>
        p.id !== id && p.sku.trim().toLowerCase() === trimmedSku.toLowerCase(),
    )
    if (duplicate) {
      return {
        ok: false,
        message: `A product with SKU "${trimmedSku}" already exists.`,
      }
    }

    this.products[existingIndex] = {
      ...input,
      id,
      name: trimmedName,
      sku: trimmedSku,
    }

    return { ok: true }
  }

  async updateProductStock(
    productId: string,
    newStock: number,
    locationUpdate?: {
      warehouseId?: string
      warehouseStock?: Record<string, number>
    },
  ): Promise<ServiceResult> {
    const product = this.products.find((p) => p.id === productId)
    if (!product) {
      return { ok: false, message: 'Product was not found.' }
    }

    product.stock = newStock
    if (locationUpdate?.warehouseId) {
      product.warehouseId = locationUpdate.warehouseId
    }
    if (locationUpdate?.warehouseStock) {
      product.warehouseStock = locationUpdate.warehouseStock
    }

    return { ok: true }
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.products.filter((p) => p.stock <= p.reorderThreshold)
  }
}

export const mockInventoryService = new MockInventoryService()
