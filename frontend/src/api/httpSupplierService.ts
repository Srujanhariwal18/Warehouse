import { apiClient } from './client'
import type { ISupplierRepository } from './supplierService'
import type {
  CreateSupplierInput,
  ProductResponse,
  ServiceResult,
  SupplierRequest,
  SupplierResponse,
} from './types'
import type { Supplier } from '@/mocks/supplierData'

export class HttpSupplierService implements ISupplierRepository {
  async getSuppliers(): Promise<Supplier[]> {
    const [supplierResponses, products] = await Promise.all([
      apiClient.get<SupplierResponse[]>('/suppliers'),
      apiClient.get<ProductResponse[]>('/products'),
    ])

    return supplierResponses.map((s) => {
      const suppliedCount = products.filter((p) => p.supplierId === s.id).length
      const addressParts = (s.address || '').split(',')
      const city = addressParts[0]?.trim() || 'Central City'

      return {
        id: s.id,
        companyName: s.name,
        contactPerson: s.contactPerson || 'Vendor Representative',
        email: s.email || 'vendor@partner.invora.com',
        phone: s.phone || '+1-555-0100',
        address: s.address || 'Industrial Zone',
        city,
        state: 'Logistics Hub',
        postalCode: '400001',
        country: 'India',
        status: 'Active',
        productsSupplied: suppliedCount,
        leadTimeDays: 3,
        rating: 4.8,
        createdAt: s.createdAt,
        updatedAt: s.createdAt || new Date().toISOString(),
      } as Supplier
    })
  }

  async createSupplier(
    input: CreateSupplierInput,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const payload: SupplierRequest = {
        name: input.companyName.trim(),
        contactPerson: input.contactPerson.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        address: `${input.city || ''}, ${input.address || ''}`.trim(),
      }
      const created = await apiClient.post<SupplierResponse>(
        '/suppliers',
        payload,
      )
      return { ok: true, data: { id: created.id } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create supplier'
      return { ok: false, message: msg }
    }
  }

  async updateSupplier(
    id: string,
    input: CreateSupplierInput,
  ): Promise<ServiceResult> {
    try {
      const payload: SupplierRequest = {
        name: input.companyName.trim(),
        contactPerson: input.contactPerson.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        address: `${input.city || ''}, ${input.address || ''}`.trim(),
      }
      await apiClient.put<SupplierResponse>(
        `/suppliers/${id}`,
        payload,
      )
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update supplier'
      return { ok: false, message: msg }
    }
  }

  async deactivateSupplier(id: string): Promise<ServiceResult> {
    try {
      await apiClient.delete(`/suppliers/${id}`)
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate supplier'
      return { ok: false, message: msg }
    }
  }

  async reactivateSupplier(): Promise<ServiceResult> {
    return { ok: true }
  }
}

export const httpSupplierService = new HttpSupplierService()
