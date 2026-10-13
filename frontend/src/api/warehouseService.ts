import {
  initialWarehousesSeed,
  initialZones,
  initialRacks,
  type WarehouseRack,
  type WarehouseZone,
} from '@/mocks/warehouseData'
import type { Warehouse } from '@/mocks/inventoryData'
import type {
  CreateRackInput,
  CreateWarehouseInput,
  CreateZoneInput,
  ServiceResult,
  UpdateRackInput,
  UpdateWarehouseInput,
  UpdateZoneInput,
} from './types'

/**
 * Repository interface for Warehouses, Zones, and Racks.
 * In the final phase, this boundary will be implemented by an HTTP/REST
 * client communicating with the Spring Boot backend (`/api/v1/warehouses`).
 */
export interface IWarehouseRepository {
  getWarehouses(): Promise<Warehouse[]>
  createWarehouse(
    input: CreateWarehouseInput,
  ): Promise<ServiceResult<{ id: string }>>
  updateWarehouse(
    id: string,
    input: UpdateWarehouseInput,
  ): Promise<ServiceResult>
  deactivateWarehouse(id: string): Promise<ServiceResult>
  reactivateWarehouse(id: string): Promise<ServiceResult>

  getZones(warehouseId?: string): Promise<WarehouseZone[]>
  createZone(input: CreateZoneInput): Promise<ServiceResult<{ id: string }>>
  updateZone(id: string, input: UpdateZoneInput): Promise<ServiceResult>
  deactivateZone(id: string): Promise<ServiceResult>
  reactivateZone(id: string): Promise<ServiceResult>

  getRacks(zoneId?: string): Promise<WarehouseRack[]>
  createRack(input: CreateRackInput): Promise<ServiceResult<{ id: string }>>
  updateRack(id: string, input: UpdateRackInput): Promise<ServiceResult>
  deactivateRack(id: string): Promise<ServiceResult>
  reactivateRack(id: string): Promise<ServiceResult>
}

export class MockWarehouseService implements IWarehouseRepository {
  private warehouses: Warehouse[]
  private zones: WarehouseZone[]
  private racks: WarehouseRack[]

  constructor(
    warehousesSeed = initialWarehousesSeed,
    zonesSeed = initialZones,
    racksSeed = initialRacks,
  ) {
    this.warehouses = JSON.parse(JSON.stringify(warehousesSeed))
    this.zones = JSON.parse(JSON.stringify(zonesSeed))
    this.racks = JSON.parse(JSON.stringify(racksSeed))
  }

  async getWarehouses(): Promise<Warehouse[]> {
    return [...this.warehouses]
  }

  async createWarehouse(
    input: CreateWarehouseInput,
  ): Promise<ServiceResult<{ id: string }>> {
    const trimmedId = input.id.trim()
    const trimmedName = input.name.trim()
    const trimmedCity = input.city.trim()

    if (!trimmedId) {
      return { ok: false, message: 'Facility ID is required.' }
    }
    if (!trimmedName) {
      return { ok: false, message: 'Facility name is required.' }
    }
    if (!trimmedCity) {
      return { ok: false, message: 'Operating city is required.' }
    }

    const dup = this.warehouses.some(
      (w) => w.id.toLowerCase() === trimmedId.toLowerCase(),
    )
    if (dup) {
      return {
        ok: false,
        message: `A warehouse with ID "${trimmedId}" already exists.`,
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    const newWarehouse: Warehouse = {
      ...input,
      id: trimmedId,
      name: trimmedName,
      city: trimmedCity,
      status: 'Active',
      createdAt: today,
      updatedAt: today,
    }

    this.warehouses.push(newWarehouse)
    return { ok: true, data: { id: trimmedId } }
  }

  async updateWarehouse(
    id: string,
    input: UpdateWarehouseInput,
  ): Promise<ServiceResult> {
    const existing = this.warehouses.find((w) => w.id === id)
    if (!existing) {
      return { ok: false, message: `Warehouse "${id}" does not exist.` }
    }

    const trimmedName = input.name.trim()
    const trimmedCity = input.city.trim()
    if (!trimmedName || !trimmedCity) {
      return { ok: false, message: 'Name and city are required.' }
    }

    const today = new Date().toISOString().slice(0, 10)
    Object.assign(existing, {
      ...input,
      name: trimmedName,
      city: trimmedCity,
      updatedAt: today,
    })

    return { ok: true }
  }

  async deactivateWarehouse(id: string): Promise<ServiceResult> {
    const existing = this.warehouses.find((w) => w.id === id)
    if (!existing) {
      return { ok: false, message: `Warehouse "${id}" does not exist.` }
    }

    const hasActiveZones = this.zones.some(
      (z) => z.warehouseId === id && z.status === 'Active',
    )
    if (hasActiveZones) {
      return {
        ok: false,
        message:
          'Cannot deactivate facility with active storage zones. Please deactivate all zones first.',
      }
    }

    existing.status = 'Inactive'
    existing.updatedAt = new Date().toISOString().slice(0, 10)
    return { ok: true }
  }

  async reactivateWarehouse(id: string): Promise<ServiceResult> {
    const existing = this.warehouses.find((w) => w.id === id)
    if (!existing) {
      return { ok: false, message: `Warehouse "${id}" does not exist.` }
    }

    existing.status = 'Active'
    existing.updatedAt = new Date().toISOString().slice(0, 10)
    return { ok: true }
  }

  async getZones(warehouseId?: string): Promise<WarehouseZone[]> {
    if (warehouseId) {
      return this.zones.filter((z) => z.warehouseId === warehouseId)
    }
    return [...this.zones]
  }

  async createZone(
    input: CreateZoneInput,
  ): Promise<ServiceResult<{ id: string }>> {
    const trimmedId = input.id.trim()
    const trimmedName = input.name.trim()

    if (!trimmedId || !trimmedName) {
      return { ok: false, message: 'Zone ID and name are required.' }
    }

    const dup = this.zones.some(
      (z) =>
        z.warehouseId === input.warehouseId &&
        z.id.toLowerCase() === trimmedId.toLowerCase(),
    )
    if (dup) {
      return {
        ok: false,
        message: `Zone ID "${trimmedId}" already exists in this facility.`,
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    const newZone: WarehouseZone = {
      ...input,
      id: trimmedId,
      name: trimmedName,
      status: 'Active',
      createdAt: today,
      updatedAt: today,
    }

    this.zones.push(newZone)
    return { ok: true, data: { id: trimmedId } }
  }

  async updateZone(id: string, input: UpdateZoneInput): Promise<ServiceResult> {
    const existing = this.zones.find((z) => z.id === id)
    if (!existing) {
      return { ok: false, message: `Zone "${id}" does not exist.` }
    }

    existing.name = input.name.trim()
    existing.type = input.type
    existing.description = input.description
    existing.updatedAt = new Date().toISOString().slice(0, 10)

    return { ok: true }
  }

  async deactivateZone(id: string): Promise<ServiceResult> {
    const existing = this.zones.find((z) => z.id === id)
    if (!existing) {
      return { ok: false, message: `Zone "${id}" does not exist.` }
    }

    const hasActiveRacks = this.racks.some(
      (r) => r.zoneId === id && r.status === 'Active',
    )
    if (hasActiveRacks) {
      return {
        ok: false,
        message:
          'Cannot deactivate zone with active storage racks. Please deactivate all racks first.',
      }
    }

    existing.status = 'Inactive'
    existing.updatedAt = new Date().toISOString().slice(0, 10)
    return { ok: true }
  }

  async reactivateZone(id: string): Promise<ServiceResult> {
    const existing = this.zones.find((z) => z.id === id)
    if (!existing) {
      return { ok: false, message: `Zone "${id}" does not exist.` }
    }

    existing.status = 'Active'
    existing.updatedAt = new Date().toISOString().slice(0, 10)
    return { ok: true }
  }

  async getRacks(zoneId?: string): Promise<WarehouseRack[]> {
    if (zoneId) {
      return this.racks.filter((r) => r.zoneId === zoneId)
    }
    return [...this.racks]
  }

  async createRack(
    input: CreateRackInput,
  ): Promise<ServiceResult<{ id: string }>> {
    const trimmedId = input.id.trim()
    const trimmedName = input.name.trim()

    if (!trimmedId || !trimmedName) {
      return { ok: false, message: 'Rack ID and name are required.' }
    }

    const dup = this.racks.some(
      (r) =>
        r.zoneId === input.zoneId &&
        r.id.toLowerCase() === trimmedId.toLowerCase(),
    )
    if (dup) {
      return {
        ok: false,
        message: `Rack ID "${trimmedId}" already exists in this zone.`,
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    const newRack: WarehouseRack = {
      ...input,
      id: trimmedId,
      name: trimmedName,
      status: 'Active',
      createdAt: today,
      updatedAt: today,
    }

    this.racks.push(newRack)
    return { ok: true, data: { id: trimmedId } }
  }

  async updateRack(id: string, input: UpdateRackInput): Promise<ServiceResult> {
    const existing = this.racks.find((r) => r.id === id)
    if (!existing) {
      return { ok: false, message: `Rack "${id}" does not exist.` }
    }

    existing.name = input.name.trim()
    if (input.capacity !== undefined) existing.capacity = input.capacity
    if (input.levels !== undefined) existing.levels = input.levels
    existing.updatedAt = new Date().toISOString().slice(0, 10)

    return { ok: true }
  }

  async deactivateRack(id: string): Promise<ServiceResult> {
    const existing = this.racks.find((r) => r.id === id)
    if (!existing) {
      return { ok: false, message: `Rack "${id}" does not exist.` }
    }

    existing.status = 'Inactive'
    existing.updatedAt = new Date().toISOString().slice(0, 10)
    return { ok: true }
  }

  async reactivateRack(id: string): Promise<ServiceResult> {
    const existing = this.racks.find((r) => r.id === id)
    if (!existing) {
      return { ok: false, message: `Rack "${id}" does not exist.` }
    }

    existing.status = 'Active'
    existing.updatedAt = new Date().toISOString().slice(0, 10)
    return { ok: true }
  }
}

export const mockWarehouseService = new MockWarehouseService()
