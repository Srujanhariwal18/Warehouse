import { initialSuppliers, type Supplier } from '@/mocks/supplierData'
import type { CreateSupplierInput, ServiceResult } from './types'

/**
 * Repository interface for Suppliers.
 * In the final phase, this boundary will be implemented by an HTTP/REST
 * client communicating with the Spring Boot backend (`/api/v1/suppliers`).
 */
export interface ISupplierRepository {
  getSuppliers(): Promise<Supplier[]>
  createSupplier(
    input: CreateSupplierInput,
  ): Promise<ServiceResult<{ id: string }>>
  updateSupplier(id: string, input: CreateSupplierInput): Promise<ServiceResult>
  deactivateSupplier(id: string): Promise<ServiceResult>
  reactivateSupplier(id: string): Promise<ServiceResult>
}

let supplierCounter = 110

export class MockSupplierService implements ISupplierRepository {
  private suppliers: Supplier[]

  constructor(seed = initialSuppliers) {
    this.suppliers = JSON.parse(JSON.stringify(seed))
  }

  async getSuppliers(): Promise<Supplier[]> {
    return [...this.suppliers]
  }

  async createSupplier(
    input: CreateSupplierInput,
  ): Promise<ServiceResult<{ id: string }>> {
    const trimmedCompany = input.companyName.trim()
    const trimmedContact = input.contactPerson.trim()
    const trimmedEmail = input.email.trim()
    const trimmedPhone = input.phone.trim()
    const trimmedAddress = input.address.trim()
    const trimmedCity = input.city.trim()

    if (
      !trimmedCompany ||
      !trimmedContact ||
      !trimmedEmail ||
      !trimmedPhone ||
      !trimmedAddress ||
      !trimmedCity
    ) {
      return { ok: false, message: 'All required fields must be provided.' }
    }

    const emailDuplicate = this.suppliers.some(
      (s) => s.email.toLowerCase() === trimmedEmail.toLowerCase(),
    )
    if (emailDuplicate) {
      return {
        ok: false,
        message: `A supplier with email "${trimmedEmail}" already exists.`,
      }
    }

    supplierCounter += 1
    const id = `SUP-${supplierCounter}`
    const today = new Date().toISOString().slice(0, 10)

    const newSupplier: Supplier = {
      ...input,
      id,
      companyName: trimmedCompany,
      contactPerson: trimmedContact,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: trimmedAddress,
      city: trimmedCity,
      status: 'Active',
      createdAt: today,
      updatedAt: today,
    }

    this.suppliers.push(newSupplier)
    return { ok: true, data: { id } }
  }

  async updateSupplier(
    id: string,
    input: CreateSupplierInput,
  ): Promise<ServiceResult> {
    const existing = this.suppliers.find((s) => s.id === id)
    if (!existing) {
      return { ok: false, message: `Supplier "${id}" does not exist.` }
    }

    const trimmedCompany = input.companyName.trim()
    const trimmedContact = input.contactPerson.trim()
    const trimmedEmail = input.email.trim()
    const trimmedPhone = input.phone.trim()
    const trimmedAddress = input.address.trim()
    const trimmedCity = input.city.trim()

    if (
      !trimmedCompany ||
      !trimmedContact ||
      !trimmedEmail ||
      !trimmedPhone ||
      !trimmedAddress ||
      !trimmedCity
    ) {
      return { ok: false, message: 'All required fields must be provided.' }
    }

    const emailDuplicate = this.suppliers.some(
      (s) =>
        s.id !== id && s.email.toLowerCase() === trimmedEmail.toLowerCase(),
    )
    if (emailDuplicate) {
      return {
        ok: false,
        message: `A supplier with email "${trimmedEmail}" already exists.`,
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    Object.assign(existing, {
      ...input,
      companyName: trimmedCompany,
      contactPerson: trimmedContact,
      email: trimmedEmail,
      phone: trimmedPhone,
      address: trimmedAddress,
      city: trimmedCity,
      updatedAt: today,
    })

    return { ok: true }
  }

  async deactivateSupplier(id: string): Promise<ServiceResult> {
    const existing = this.suppliers.find((s) => s.id === id)
    if (!existing) {
      return { ok: false, message: `Supplier "${id}" does not exist.` }
    }

    existing.status = 'Inactive'
    existing.updatedAt = new Date().toISOString().slice(0, 10)
    return { ok: true }
  }

  async reactivateSupplier(id: string): Promise<ServiceResult> {
    const existing = this.suppliers.find((s) => s.id === id)
    if (!existing) {
      return { ok: false, message: `Supplier "${id}" does not exist.` }
    }

    existing.status = 'Active'
    existing.updatedAt = new Date().toISOString().slice(0, 10)
    return { ok: true }
  }
}

export const mockSupplierService = new MockSupplierService()
