import { apiClient } from './client'
import type { IInventoryRepository } from './inventoryService'
import type {
  CategoryResponse,
  InventoryResponse,
  ProductInput,
  ProductRequest,
  ProductResponse,
  RackResponse,
  ServiceResult,
} from './types'
import type { Product } from '@/mocks/inventoryData'

export class HttpInventoryService implements IInventoryRepository {
  async getProducts(): Promise<Product[]> {
    const [backendProducts, inventoryList] = await Promise.all([
      apiClient.get<ProductResponse[]>('/products'),
      apiClient.get<InventoryResponse[]>('/inventory'),
    ])

    return backendProducts.map((p) => {
      const matchingInv = inventoryList.filter((i) => i.productId === p.id)
      const totalStock = matchingInv.reduce((sum, i) => sum + i.quantity, 0)

      const warehouseStock: Record<string, number> = {}
      for (const inv of matchingInv) {
        if (inv.warehouseId) {
          warehouseStock[inv.warehouseId] =
            (warehouseStock[inv.warehouseId] || 0) + inv.quantity
        }
      }

      const primaryWarehouseId = Object.keys(warehouseStock)[0] || ''
      const primaryRackLocation = matchingInv[0]?.rackCode || ''

      const status =
        totalStock === 0
          ? 'Out of Stock'
          : totalStock <= p.threshold
            ? 'Low Stock'
            : 'In Stock'

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.categoryName || 'General',
        price: p.unitPrice,
        stock: totalStock,
        reorderThreshold: p.threshold,
        unit: p.unit || 'PIECE',
        supplierId: p.supplierId || '',
        warehouseId: primaryWarehouseId,
        warehouseStock,
        rackLocation: primaryRackLocation,
        status,
        description: p.description || '',
      } as Product
    })
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const products = await this.getProducts()
    return products.find((p) => p.id === id)
  }

  async createProduct(
    input: ProductInput,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const categories = await apiClient.get<CategoryResponse[]>('/categories')
      const targetCategoryName = input.category?.trim() || 'General'

      let category = categories.find(
        (c) => c.name.toLowerCase() === targetCategoryName.toLowerCase(),
      )

      if (!category) {
        category = await apiClient.post<CategoryResponse>(
          '/categories',
          {
            name: targetCategoryName,
            description: `Auto-created category for ${targetCategoryName}`,
          },
        )
      }

      const anyInput = input as Record<string, unknown>
      const productPayload: ProductRequest = {
        sku: input.sku.trim(),
        name: input.name.trim(),
        categoryId: category.id,
        supplierId: input.supplierId ? input.supplierId : null,
        unit: typeof anyInput.unit === 'string' ? anyInput.unit : 'PIECE',
        unitPrice: input.price,
        threshold: input.reorderThreshold,
        reorderQuantity: 20,
        description:
          typeof anyInput.description === 'string' ? anyInput.description : '',
      }

      const created = await apiClient.post<ProductResponse>(
        '/products',
        productPayload,
      )

      // If initial stock is specified, allocate it to destination rack
      if (input.stock && input.stock > 0) {
        try {
          const racks = await apiClient.get<RackResponse[]>('/racks')
          if (racks.length > 0) {
            const destRack =
              racks.find((r) => r.warehouseId === input.warehouseId) || racks[0]
            await apiClient.post('/stock/transactions/in', {
              productId: created.id,
              destinationRackId: destRack.id,
              quantity: input.stock,
              reference: 'INIT-SEED',
              reason: 'Initial inventory intake',
            })
          }
        } catch (stockErr) {
          console.warn('Initial stock allocation note:', stockErr)
        }
      }

      return { ok: true, data: { id: created.id } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product'
      return { ok: false, message: msg }
    }
  }

  async updateProduct(id: string, input: ProductInput): Promise<ServiceResult> {
    try {
      const categories = await apiClient.get<CategoryResponse[]>('/categories')
      const targetCategoryName = input.category?.trim() || 'General'

      let category = categories.find(
        (c) => c.name.toLowerCase() === targetCategoryName.toLowerCase(),
      )

      if (!category) {
        category = await apiClient.post<CategoryResponse>(
          '/categories',
          {
            name: targetCategoryName,
            description: `Auto-created category for ${targetCategoryName}`,
          },
        )
      }

      const anyInput = input as Record<string, unknown>
      const productPayload: ProductRequest = {
        sku: input.sku.trim(),
        name: input.name.trim(),
        categoryId: category.id,
        supplierId: input.supplierId ? input.supplierId : null,
        unit: typeof anyInput.unit === 'string' ? anyInput.unit : 'PIECE',
        unitPrice: input.price,
        threshold: input.reorderThreshold,
        reorderQuantity: 20,
        description:
          typeof anyInput.description === 'string' ? anyInput.description : '',
      }

      await apiClient.put<ProductResponse>(
        `/products/${id}`,
        productPayload,
      )

      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update product'
      return { ok: false, message: msg }
    }
  }

  async updateProductStock(
    productId: string,
    newStock: number,
  ): Promise<ServiceResult> {
    try {
      const products = await this.getProducts()
      const existing = products.find((p) => p.id === productId)
      if (!existing) {
        return { ok: false, message: 'Product not found' }
      }

      const diff = newStock - existing.stock
      if (diff === 0) return { ok: true }

      const racks = await apiClient.get<RackResponse[]>('/racks')
      const destRack = racks[0]
      if (!destRack) {
        return { ok: false, message: 'No rack available to record stock mutation' }
      }

      if (diff > 0) {
        await apiClient.post('/stock/transactions/in', {
          productId,
          destinationRackId: destRack.id,
          quantity: diff,
          reference: 'MANUAL-ADJ',
          reason: 'Manual stock update',
        })
      } else {
        await apiClient.post('/stock/transactions/out', {
          productId,
          sourceRackId: destRack.id,
          quantity: Math.abs(diff),
          reference: 'MANUAL-ADJ',
          reason: 'Manual stock reduction',
        })
      }

      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update product stock'
      return { ok: false, message: msg }
    }
  }

  async getLowStockProducts(): Promise<Product[]> {
    const products = await this.getProducts()
    return products.filter((p) => p.stock <= p.reorderThreshold)
  }
}

export const httpInventoryService = new HttpInventoryService()
