import { apiClient } from './client'
import type { IWarehouseRepository } from './warehouseService'
import type {
  CreateRackInput,
  CreateWarehouseInput,
  CreateZoneInput,
  InventoryResponse,
  RackRequest,
  RackResponse,
  ServiceResult,
  UpdateRackInput,
  UpdateWarehouseInput,
  UpdateZoneInput,
  WarehouseRequest,
  WarehouseResponse,
  ZoneRequest,
  ZoneResponse,
} from './types'
import type { Warehouse, WarehouseStatus } from '@/mocks/inventoryData'
import type { WarehouseRack, WarehouseZone } from '@/mocks/warehouseData'

export class HttpWarehouseService implements IWarehouseRepository {
  async getWarehouses(): Promise<Warehouse[]> {
    const [whResponses, zones, racks, inventory] = await Promise.all([
      apiClient.get<WarehouseResponse[]>('/warehouses'),
      apiClient.get<ZoneResponse[]>('/zones'),
      apiClient.get<RackResponse[]>('/racks'),
      apiClient.get<InventoryResponse[]>('/inventory'),
    ])

    return whResponses.map((wh) => {
      const whZones = zones.filter((z) => z.warehouseId === wh.id)
      const whRacks = racks.filter((r) => r.warehouseId === wh.id)
      const occupancy = inventory
        .filter((i) => i.warehouseId === wh.id)
        .reduce((sum, i) => sum + i.quantity, 0)

      const city = wh.address ? wh.address.split(',')[0].trim() : 'Central'

      return {
        id: wh.id,
        name: wh.name,
        code: wh.code,
        city,
        address: wh.address || '',
        capacitySqFt: wh.capacity || 15000,
        currentOccupancy: occupancy,
        zonesCount: whZones.length,
        racksCount: whRacks.length,
        status: 'Active' as WarehouseStatus,
        createdAt: wh.createdAt,
        updatedAt: wh.createdAt,
      } as Warehouse
    })
  }

  async createWarehouse(
    input: CreateWarehouseInput,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const payload: WarehouseRequest = {
        name: input.name.trim(),
        code: input.id.trim() || `WH-${Date.now().toString().slice(-4)}`,
        address: `${input.city || ''}, ${input.address || ''}`.trim(),
        capacity: input.capacitySqFt || 10000,
      }
      const created = await apiClient.post<WarehouseResponse>(
        '/warehouses',
        payload,
      )
      return { ok: true, data: { id: created.id } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create warehouse'
      return { ok: false, message: msg }
    }
  }

  async updateWarehouse(
    id: string,
    input: UpdateWarehouseInput,
  ): Promise<ServiceResult> {
    try {
      const existing = await apiClient.get<WarehouseResponse>(`/warehouses/${id}`)
      const payload: WarehouseRequest = {
        name: input.name.trim(),
        code: existing.code,
        address: `${input.city || ''}, ${input.address || ''}`.trim(),
        capacity: input.capacitySqFt || existing.capacity || 10000,
      }
      await apiClient.put<WarehouseResponse>(
        `/warehouses/${id}`,
        payload,
      )
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update warehouse'
      return { ok: false, message: msg }
    }
  }

  async deactivateWarehouse(id: string): Promise<ServiceResult> {
    try {
      await apiClient.delete(`/warehouses/${id}`)
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate warehouse'
      return { ok: false, message: msg }
    }
  }

  async reactivateWarehouse(): Promise<ServiceResult> {
    return { ok: true }
  }

  async getZones(warehouseId?: string): Promise<WarehouseZone[]> {
    const [zones, racks, inventory] = await Promise.all([
      apiClient.get<ZoneResponse[]>('/zones'),
      apiClient.get<RackResponse[]>('/racks'),
      apiClient.get<InventoryResponse[]>('/inventory'),
    ])

    const filtered = warehouseId
      ? zones.filter((z) => z.warehouseId === warehouseId)
      : zones

    return filtered.map((z) => {
      const zoneRacks = racks.filter((r) => r.zoneId === z.id)
      const occupancy = inventory
        .filter((i) => i.zoneId === z.id)
        .reduce((sum, i) => sum + i.quantity, 0)
      const capacity = zoneRacks.reduce((sum, r) => sum + r.capacity, 0) || 5000

      return {
        id: z.id,
        warehouseId: z.warehouseId,
        name: z.name,
        code: z.code,
        type: 'Storage',
        status: 'Active',
        racksCount: zoneRacks.length,
        capacity,
        occupancy,
        createdAt: z.createdAt,
        updatedAt: z.createdAt,
      } as WarehouseZone
    })
  }

  async createZone(input: CreateZoneInput): Promise<ServiceResult<{ id: string }>> {
    try {
      const payload: ZoneRequest = {
        warehouseId: input.warehouseId,
        name: input.name.trim(),
        code: input.id.trim() || `Z-${Date.now().toString().slice(-3)}`,
      }
      const created = await apiClient.post<ZoneResponse>(
        '/zones',
        payload,
      )
      return { ok: true, data: { id: created.id } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create zone'
      return { ok: false, message: msg }
    }
  }

  async updateZone(id: string, input: UpdateZoneInput): Promise<ServiceResult> {
    try {
      const existing = await apiClient.get<ZoneResponse>(`/zones/${id}`)
      const payload: ZoneRequest = {
        warehouseId: existing.warehouseId,
        name: input.name.trim(),
        code: existing.code,
      }
      await apiClient.put<ZoneResponse>(`/zones/${id}`, payload)
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update zone'
      return { ok: false, message: msg }
    }
  }

  async deactivateZone(id: string): Promise<ServiceResult> {
    try {
      await apiClient.delete(`/zones/${id}`)
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate zone'
      return { ok: false, message: msg }
    }
  }

  async reactivateZone(): Promise<ServiceResult> {
    return { ok: true }
  }

  async getRacks(zoneId?: string): Promise<WarehouseRack[]> {
    const [racks, inventory] = await Promise.all([
      apiClient.get<RackResponse[]>('/racks'),
      apiClient.get<InventoryResponse[]>('/inventory'),
    ])

    const filtered = zoneId ? racks.filter((r) => r.zoneId === zoneId) : racks

    return filtered.map((r) => {
      const load = inventory
        .filter((i) => i.rackId === r.id)
        .reduce((sum, i) => sum + i.quantity, 0)

      return {
        id: r.id,
        zoneId: r.zoneId,
        warehouseId: r.warehouseId || '',
        name: r.name,
        code: r.code,
        capacity: r.capacity || 1000,
        currentLoad: load,
        status: 'Active',
        levels: 4,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
      } as WarehouseRack
    })
  }

  async createRack(input: CreateRackInput): Promise<ServiceResult<{ id: string }>> {
    try {
      const payload: RackRequest = {
        zoneId: input.zoneId,
        name: input.name.trim(),
        code: input.id.trim() || `R-${Date.now().toString().slice(-3)}`,
        capacity: input.capacity || 1000,
      }
      const created = await apiClient.post<RackResponse>(
        '/racks',
        payload,
      )
      return { ok: true, data: { id: created.id } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create rack'
      return { ok: false, message: msg }
    }
  }

  async updateRack(id: string, input: UpdateRackInput): Promise<ServiceResult> {
    try {
      const existing = await apiClient.get<RackResponse>(`/racks/${id}`)
      const payload: RackRequest = {
        zoneId: existing.zoneId,
        name: input.name.trim(),
        code: existing.code,
        capacity: input.capacity || existing.capacity || 1000,
      }
      await apiClient.put<RackResponse>(`/racks/${id}`, payload)
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update rack'
      return { ok: false, message: msg }
    }
  }

  async deactivateRack(id: string): Promise<ServiceResult> {
    try {
      await apiClient.delete(`/racks/${id}`)
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate rack'
      return { ok: false, message: msg }
    }
  }

  async reactivateRack(): Promise<ServiceResult> {
    return { ok: true }
  }
}

export const httpWarehouseService = new HttpWarehouseService()
