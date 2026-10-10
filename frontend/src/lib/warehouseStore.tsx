import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Warehouse, WarehouseStatus } from '@/mocks/inventoryData'
import {
  initialWarehousesSeed,
  initialZones,
  initialRacks,
  type WarehouseZone,
  type WarehouseRack,
  type ZoneStatus,
  type RackStatus,
} from '@/mocks/warehouseData'

export type CreateWarehouseInput = {
  id?: string
  name: string
  city: string
  address?: string
  state?: string
  postalCode?: string
  country?: string
  capacitySqFt?: number
}

export type UpdateWarehouseInput = Partial<CreateWarehouseInput> & {
  status?: WarehouseStatus
}

export type CreateZoneInput = {
  id?: string
  warehouseId: string
  name: string
  type?: string
  description?: string
}

export type UpdateZoneInput = Partial<CreateZoneInput> & {
  status?: ZoneStatus
}

export type CreateRackInput = {
  id?: string
  zoneId: string
  name: string
  capacity?: number
  levels?: number
}

export type UpdateRackInput = Partial<CreateRackInput> & {
  status?: RackStatus
}

export type WarehouseOperationResult =
  { ok: true; id: string } | { ok: false; message: string }

export type WarehouseStore = {
  warehouses: Warehouse[]
  zones: WarehouseZone[]
  racks: WarehouseRack[]
  addWarehouse: (input: CreateWarehouseInput) => WarehouseOperationResult
  updateWarehouse: (
    id: string,
    input: UpdateWarehouseInput,
  ) => WarehouseOperationResult
  deactivateWarehouse: (
    id: string,
    options?: { activeProductCount?: number },
  ) => WarehouseOperationResult
  reactivateWarehouse: (id: string) => WarehouseOperationResult
  addZone: (input: CreateZoneInput) => WarehouseOperationResult
  updateZone: (id: string, input: UpdateZoneInput) => WarehouseOperationResult
  deactivateZone: (
    id: string,
    options?: { activeProductCount?: number },
  ) => WarehouseOperationResult
  reactivateZone: (id: string) => WarehouseOperationResult
  addRack: (input: CreateRackInput) => WarehouseOperationResult
  updateRack: (id: string, input: UpdateRackInput) => WarehouseOperationResult
  deactivateRack: (
    id: string,
    options?: { activeProductCount?: number },
  ) => WarehouseOperationResult
  reactivateRack: (id: string) => WarehouseOperationResult
}

const WarehouseContext = createContext<WarehouseStore | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function validateWarehouseInput(
  input: Partial<CreateWarehouseInput>,
  existingWarehouses: Warehouse[],
  excludeId?: string,
): { ok: true } | { ok: false; message: string } {
  const name = input.name?.trim() ?? ''
  if (!name) {
    return { ok: false, message: 'Warehouse name is required.' }
  }

  const city = input.city?.trim() ?? ''
  if (!city) {
    return { ok: false, message: 'City is required.' }
  }

  if (input.id !== undefined && input.id.trim()) {
    const normId = input.id.trim().toLowerCase()
    const duplicate = existingWarehouses.find(
      (w) => w.id.toLowerCase() === normId && w.id !== excludeId,
    )
    if (duplicate) {
      return {
        ok: false,
        message: `A warehouse with identifier "${input.id.trim()}" already exists (${duplicate.name}).`,
      }
    }
  }

  if (input.capacitySqFt !== undefined && input.capacitySqFt !== null) {
    if (
      !Number.isFinite(input.capacitySqFt) ||
      input.capacitySqFt <= 0 ||
      !Number.isInteger(input.capacitySqFt)
    ) {
      return {
        ok: false,
        message: 'Floor capacity must be a positive whole number in sq ft.',
      }
    }
  }

  return { ok: true }
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateZoneInput(
  input: Partial<CreateZoneInput>,
  existingZones: WarehouseZone[],
  existingWarehouses: Warehouse[],
  excludeId?: string,
): { ok: true } | { ok: false; message: string } {
  const name = input.name?.trim() ?? ''
  if (!name) {
    return { ok: false, message: 'Zone name is required.' }
  }

  const warehouseId = input.warehouseId?.trim() ?? ''
  if (!warehouseId) {
    return { ok: false, message: 'Parent warehouse is required.' }
  }

  const parentWarehouse = existingWarehouses.find((w) => w.id === warehouseId)
  if (!parentWarehouse) {
    return {
      ok: false,
      message: `Referenced warehouse "${warehouseId}" does not exist.`,
    }
  }

  if (input.id !== undefined && input.id.trim()) {
    const normId = input.id.trim().toLowerCase()
    const duplicate = existingZones.find(
      (z) =>
        z.warehouseId === warehouseId &&
        z.id.toLowerCase() === normId &&
        z.id !== excludeId,
    )
    if (duplicate) {
      return {
        ok: false,
        message: `A zone with identifier "${input.id.trim()}" already exists in this warehouse.`,
      }
    }
  }

  return { ok: true }
}

// eslint-disable-next-line react-refresh/only-export-components
export function validateRackInput(
  input: Partial<CreateRackInput>,
  existingRacks: WarehouseRack[],
  existingZones: WarehouseZone[],
  excludeId?: string,
): { ok: true } | { ok: false; message: string } {
  const name = input.name?.trim() ?? ''
  if (!name) {
    return { ok: false, message: 'Rack name is required.' }
  }

  const zoneId = input.zoneId?.trim() ?? ''
  if (!zoneId) {
    return { ok: false, message: 'Parent zone is required.' }
  }

  const parentZone = existingZones.find((z) => z.id === zoneId)
  if (!parentZone) {
    return {
      ok: false,
      message: `Referenced zone "${zoneId}" does not exist.`,
    }
  }

  if (input.id !== undefined && input.id.trim()) {
    const normId = input.id.trim().toLowerCase()
    const duplicate = existingRacks.find(
      (r) =>
        r.zoneId === zoneId &&
        r.id.toLowerCase() === normId &&
        r.id !== excludeId,
    )
    if (duplicate) {
      return {
        ok: false,
        message: `A rack with identifier "${input.id.trim()}" already exists in this zone.`,
      }
    }
  }

  if (input.capacity !== undefined && input.capacity !== null) {
    if (
      !Number.isFinite(input.capacity) ||
      input.capacity <= 0 ||
      !Number.isInteger(input.capacity)
    ) {
      return {
        ok: false,
        message: 'Capacity must be a positive whole number.',
      }
    }
  }

  if (input.levels !== undefined && input.levels !== null) {
    if (
      !Number.isFinite(input.levels) ||
      input.levels <= 0 ||
      !Number.isInteger(input.levels)
    ) {
      return {
        ok: false,
        message: 'Shelf levels must be a positive whole number.',
      }
    }
  }

  return { ok: true }
}

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>(
    initialWarehousesSeed,
  )
  const [zonesList, setZonesList] = useState<WarehouseZone[]>(initialZones)
  const [racksList, setRacksList] = useState<WarehouseRack[]>(initialRacks)

  const store = useMemo<WarehouseStore>(() => {
    return {
      warehouses: warehousesList,
      zones: zonesList,
      racks: racksList,

      // -----------------------------------------------------------------------
      // Warehouse Operations
      // -----------------------------------------------------------------------
      addWarehouse: (input) => {
        const validation = validateWarehouseInput(input, warehousesList)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const today = new Date().toISOString().slice(0, 10)
        let id = input.id?.trim()
        if (!id) {
          const citySlug = input.city
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 3)
          const base = `wh-${citySlug || 'fac'}`
          let counter = 1
          id = base
          while (
            warehousesList.some((w) => w.id.toLowerCase() === id?.toLowerCase())
          ) {
            counter += 1
            id = `${base}-${counter}`
          }
        }

        const newWarehouse: Warehouse = {
          id,
          name: input.name.trim(),
          city: input.city.trim(),
          status: 'Active',
          address: input.address?.trim() || undefined,
          state: input.state?.trim() || undefined,
          postalCode: input.postalCode?.trim() || undefined,
          country: input.country?.trim() || 'India',
          capacitySqFt: input.capacitySqFt,
          createdAt: today,
          updatedAt: today,
        }

        setWarehousesList((prev) => [newWarehouse, ...prev])
        return { ok: true, id }
      },

      updateWarehouse: (id, input) => {
        const target = warehousesList.find((w) => w.id === id)
        if (!target) {
          return { ok: false, message: 'Warehouse not found.' }
        }

        const merged: CreateWarehouseInput = {
          name: input.name ?? target.name,
          city: input.city ?? target.city,
          address:
            'address' in input
              ? input.address?.trim() || undefined
              : target.address,
          state:
            'state' in input ? input.state?.trim() || undefined : target.state,
          postalCode:
            'postalCode' in input
              ? input.postalCode?.trim() || undefined
              : target.postalCode,
          country: input.country ?? target.country,
          capacitySqFt:
            'capacitySqFt' in input ? input.capacitySqFt : target.capacitySqFt,
        }

        const validation = validateWarehouseInput(merged, warehousesList, id)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const today = new Date().toISOString().slice(0, 10)
        setWarehousesList((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  name: merged.name.trim(),
                  city: merged.city.trim(),
                  address: merged.address,
                  state: merged.state,
                  postalCode: merged.postalCode,
                  country: merged.country,
                  capacitySqFt: merged.capacitySqFt,
                  status: input.status ?? w.status,
                  updatedAt: today,
                }
              : w,
          ),
        )

        return { ok: true, id }
      },

      deactivateWarehouse: (id, options) => {
        const target = warehousesList.find((w) => w.id === id)
        if (!target) {
          return { ok: false, message: 'Warehouse not found.' }
        }

        if (target.status === 'Inactive') {
          return {
            ok: false,
            message: `Warehouse "${target.name}" is already inactive.`,
          }
        }

        // Dependent records check: protect active child zones
        const activeChildZones = zonesList.filter(
          (z) => z.warehouseId === id && z.status === 'Active',
        )
        if (activeChildZones.length > 0) {
          return {
            ok: false,
            message: `Cannot deactivate warehouse "${target.name}" because it still contains ${activeChildZones.length} active zone(s). Please deactivate dependent zones first.`,
          }
        }

        // Dependent records check: protect assigned active products
        if (options?.activeProductCount && options.activeProductCount > 0) {
          return {
            ok: false,
            message: `Cannot deactivate warehouse "${target.name}" because it currently holds ${options.activeProductCount} active product record(s) in inventory. Please reassign products first.`,
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        setWarehousesList((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'Inactive',
                  updatedAt: today,
                }
              : w,
          ),
        )

        return { ok: true, id }
      },

      reactivateWarehouse: (id) => {
        const target = warehousesList.find((w) => w.id === id)
        if (!target) {
          return { ok: false, message: 'Warehouse not found.' }
        }

        if (target.status === 'Active') {
          return {
            ok: false,
            message: `Warehouse "${target.name}" is already active.`,
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        setWarehousesList((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'Active',
                  updatedAt: today,
                }
              : w,
          ),
        )

        return { ok: true, id }
      },

      // -----------------------------------------------------------------------
      // Zone Operations
      // -----------------------------------------------------------------------
      addZone: (input) => {
        const validation = validateZoneInput(input, zonesList, warehousesList)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const today = new Date().toISOString().slice(0, 10)
        let id = input.id?.trim()
        if (!id) {
          const zoneCount = zonesList.filter(
            (z) => z.warehouseId === input.warehouseId,
          ).length
          const whShort = input.warehouseId.replace(/^wh-/, '')
          id = `zon-${whShort}-${String.fromCharCode(65 + (zoneCount % 26)).toLowerCase()}`
          let counter = 1
          while (
            zonesList.some((z) => z.id.toLowerCase() === id?.toLowerCase())
          ) {
            id = `zon-${whShort}-${counter}`
            counter += 1
          }
        }

        const newZone: WarehouseZone = {
          id,
          warehouseId: input.warehouseId,
          name: input.name.trim(),
          type: input.type?.trim() || 'Storage',
          description: input.description?.trim() || undefined,
          status: 'Active',
          createdAt: today,
          updatedAt: today,
        }

        setZonesList((prev) => [newZone, ...prev])
        return { ok: true, id }
      },

      updateZone: (id, input) => {
        const target = zonesList.find((z) => z.id === id)
        if (!target) {
          return { ok: false, message: 'Zone not found.' }
        }

        const merged: CreateZoneInput = {
          warehouseId: input.warehouseId ?? target.warehouseId,
          name: input.name ?? target.name,
          type: input.type ?? target.type,
          description:
            'description' in input
              ? input.description?.trim() || undefined
              : target.description,
        }

        const validation = validateZoneInput(
          merged,
          zonesList,
          warehousesList,
          id,
        )
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const today = new Date().toISOString().slice(0, 10)
        setZonesList((prev) =>
          prev.map((z) =>
            z.id === id
              ? {
                  ...z,
                  warehouseId: merged.warehouseId,
                  name: merged.name.trim(),
                  type: merged.type?.trim() || z.type,
                  description: merged.description,
                  status: input.status ?? z.status,
                  updatedAt: today,
                }
              : z,
          ),
        )

        return { ok: true, id }
      },

      deactivateZone: (id, options) => {
        const target = zonesList.find((z) => z.id === id)
        if (!target) {
          return { ok: false, message: 'Zone not found.' }
        }

        if (target.status === 'Inactive') {
          return {
            ok: false,
            message: `Zone "${target.name}" is already inactive.`,
          }
        }

        // Dependent records check: protect active child racks
        const activeChildRacks = racksList.filter(
          (r) => r.zoneId === id && r.status === 'Active',
        )
        if (activeChildRacks.length > 0) {
          return {
            ok: false,
            message: `Cannot deactivate zone "${target.name}" because it contains ${activeChildRacks.length} active rack(s). Please deactivate dependent racks first.`,
          }
        }

        // Dependent records check: protect assigned active products
        if (options?.activeProductCount && options.activeProductCount > 0) {
          return {
            ok: false,
            message: `Cannot deactivate zone "${target.name}" because it currently holds ${options.activeProductCount} active product record(s) in inventory. Please reassign products first.`,
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        setZonesList((prev) =>
          prev.map((z) =>
            z.id === id
              ? {
                  ...z,
                  status: 'Inactive',
                  updatedAt: today,
                }
              : z,
          ),
        )

        return { ok: true, id }
      },

      reactivateZone: (id) => {
        const target = zonesList.find((z) => z.id === id)
        if (!target) {
          return { ok: false, message: 'Zone not found.' }
        }

        if (target.status === 'Active') {
          return {
            ok: false,
            message: `Zone "${target.name}" is already active.`,
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        setZonesList((prev) =>
          prev.map((z) =>
            z.id === id
              ? {
                  ...z,
                  status: 'Active',
                  updatedAt: today,
                }
              : z,
          ),
        )

        return { ok: true, id }
      },

      // -----------------------------------------------------------------------
      // Rack Operations
      // -----------------------------------------------------------------------
      addRack: (input) => {
        const validation = validateRackInput(input, racksList, zonesList)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const parentZone = zonesList.find((z) => z.id === input.zoneId)!
        const today = new Date().toISOString().slice(0, 10)

        let id = input.id?.trim()
        if (!id) {
          const zoneRacks = racksList.filter((r) => r.zoneId === input.zoneId)
          const zoneShort = parentZone.id.replace(/^zon-/, '')
          id = `rck-${zoneShort}-${zoneRacks.length + 1}`
          let counter = 1
          while (
            racksList.some((r) => r.id.toLowerCase() === id?.toLowerCase())
          ) {
            id = `rck-${zoneShort}-${counter}`
            counter += 1
          }
        }

        const newRack: WarehouseRack = {
          id,
          zoneId: input.zoneId,
          warehouseId: parentZone.warehouseId,
          name: input.name.trim(),
          capacity: input.capacity,
          levels: input.levels ?? 3,
          status: 'Active',
          createdAt: today,
          updatedAt: today,
        }

        setRacksList((prev) => [newRack, ...prev])
        return { ok: true, id }
      },

      updateRack: (id, input) => {
        const target = racksList.find((r) => r.id === id)
        if (!target) {
          return { ok: false, message: 'Rack not found.' }
        }

        const merged: CreateRackInput = {
          zoneId: input.zoneId ?? target.zoneId,
          name: input.name ?? target.name,
          capacity: 'capacity' in input ? input.capacity : target.capacity,
          levels: 'levels' in input ? input.levels : target.levels,
        }

        const validation = validateRackInput(merged, racksList, zonesList, id)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const parentZone = zonesList.find((z) => z.id === merged.zoneId)!
        const today = new Date().toISOString().slice(0, 10)

        setRacksList((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  zoneId: merged.zoneId,
                  warehouseId: parentZone.warehouseId,
                  name: merged.name.trim(),
                  capacity: merged.capacity,
                  levels: merged.levels,
                  status: input.status ?? r.status,
                  updatedAt: today,
                }
              : r,
          ),
        )

        return { ok: true, id }
      },

      deactivateRack: (id, options) => {
        const target = racksList.find((r) => r.id === id)
        if (!target) {
          return { ok: false, message: 'Rack not found.' }
        }

        if (target.status === 'Inactive') {
          return {
            ok: false,
            message: `Rack "${target.name}" is already inactive.`,
          }
        }

        // Dependent records check: protect assigned active products
        if (options?.activeProductCount && options.activeProductCount > 0) {
          return {
            ok: false,
            message: `Cannot deactivate rack "${target.name}" because it currently holds ${options.activeProductCount} active product record(s) in inventory. Please reassign products first.`,
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        setRacksList((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'Inactive',
                  updatedAt: today,
                }
              : r,
          ),
        )

        return { ok: true, id }
      },

      reactivateRack: (id) => {
        const target = racksList.find((r) => r.id === id)
        if (!target) {
          return { ok: false, message: 'Rack not found.' }
        }

        if (target.status === 'Active') {
          return {
            ok: false,
            message: `Rack "${target.name}" is already active.`,
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        setRacksList((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'Active',
                  updatedAt: today,
                }
              : r,
          ),
        )

        return { ok: true, id }
      },
    }
  }, [warehousesList, zonesList, racksList])

  return (
    <WarehouseContext.Provider value={store}>
      {children}
    </WarehouseContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWarehouseStore() {
  const store = useContext(WarehouseContext)
  if (!store) {
    throw new Error('useWarehouseStore must be used inside WarehouseProvider')
  }
  return store
}
