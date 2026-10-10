import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  initialSuppliers,
  type Supplier,
  type SupplierStatus,
} from '@/mocks/supplierData'

export type CreateSupplierInput = {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export type UpdateSupplierInput = Partial<CreateSupplierInput> & {
  status?: SupplierStatus
}

export type SupplierOperationResult =
  { ok: true; id: string } | { ok: false; message: string }

export type SuppliersStore = {
  suppliers: Supplier[]
  addSupplier: (input: CreateSupplierInput) => SupplierOperationResult
  updateSupplier: (
    id: string,
    input: UpdateSupplierInput,
  ) => SupplierOperationResult
  deactivateSupplier: (id: string, reason?: string) => SupplierOperationResult
  reactivateSupplier: (id: string) => SupplierOperationResult
}

const SuppliersContext = createContext<SuppliersStore | null>(null)

// Email format validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone format validator (at least 7 digits, supports +, spaces, hyphens, parentheses)
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/

// eslint-disable-next-line react-refresh/only-export-components
export function validateSupplierInput(
  input: Partial<CreateSupplierInput>,
  existingSuppliers: Supplier[],
  excludeSupplierId?: string,
): { ok: true } | { ok: false; message: string } {
  // 1. Company name validation
  const companyName = input.companyName?.trim() ?? ''
  if (!companyName) {
    return { ok: false, message: 'Company name is required.' }
  }

  // 2. Contact person validation
  const contactPerson = input.contactPerson?.trim() ?? ''
  if (!contactPerson) {
    return { ok: false, message: 'Contact person is required.' }
  }

  // 3. Email validation
  const email = input.email?.trim() ?? ''
  if (!email) {
    return { ok: false, message: 'Email address is required.' }
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }

  // Case-insensitive duplicate email check
  const normalizedEmail = email.toLowerCase()
  const duplicate = existingSuppliers.find(
    (s) =>
      s.email.trim().toLowerCase() === normalizedEmail &&
      s.id !== excludeSupplierId,
  )
  if (duplicate) {
    return {
      ok: false,
      message: `A supplier with email "${email}" already exists (${duplicate.companyName}).`,
    }
  }

  // 4. Phone validation
  const phone = input.phone?.trim() ?? ''
  if (!phone) {
    return { ok: false, message: 'Phone number is required.' }
  }
  const digitCount = (phone.match(/\d/g) || []).length
  if (!PHONE_REGEX.test(phone) || digitCount < 7) {
    return {
      ok: false,
      message: 'Please enter a valid phone number (at least 7 digits).',
    }
  }

  // 5. Address validation
  const address = input.address?.trim() ?? ''
  if (!address) {
    return { ok: false, message: 'Address is required.' }
  }

  return { ok: true }
}

export function SuppliersProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)

  const store = useMemo<SuppliersStore>(() => {
    return {
      suppliers,

      addSupplier: (input) => {
        const validation = validateSupplierInput(input, suppliers)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        // Generate unique deterministic ID: SUP-<number>
        const existingNumbers = suppliers
          .map((s) => {
            const match = s.id.match(/^SUP-(\d+)$/)
            return match ? Number(match[1]) : 0
          })
          .filter(Boolean)
        const nextNumber =
          existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 101
        const id = `SUP-${nextNumber}`

        const today = new Date().toISOString().slice(0, 10)

        const newSupplier: Supplier = {
          id,
          companyName: input.companyName.trim(),
          contactPerson: input.contactPerson.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          address: input.address.trim(),
          city: input.city?.trim() || 'Unspecified',
          state: input.state?.trim() || undefined,
          postalCode: input.postalCode?.trim() || undefined,
          country: input.country?.trim() || 'India',
          status: 'Active',
          createdAt: today,
          updatedAt: today,
        }

        setSuppliers((prev) => [newSupplier, ...prev])
        return { ok: true, id }
      },

      updateSupplier: (id, input) => {
        const current = suppliers.find((s) => s.id === id)
        if (!current) {
          return { ok: false, message: 'Supplier was not found.' }
        }

        const merged: CreateSupplierInput = {
          companyName: input.companyName ?? current.companyName,
          contactPerson: input.contactPerson ?? current.contactPerson,
          email: input.email ?? current.email,
          phone: input.phone ?? current.phone,
          address: input.address ?? current.address,
          city: input.city ?? current.city,
          state: input.state ?? current.state,
          postalCode: input.postalCode ?? current.postalCode,
          country: input.country ?? current.country,
        }

        const validation = validateSupplierInput(merged, suppliers, id)
        if (!validation.ok) {
          return { ok: false, message: validation.message }
        }

        const today = new Date().toISOString().slice(0, 10)

        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  companyName: merged.companyName.trim(),
                  contactPerson: merged.contactPerson.trim(),
                  email: merged.email.trim(),
                  phone: merged.phone.trim(),
                  address: merged.address.trim(),
                  city: merged.city?.trim() || s.city,
                  state:
                    'state' in input
                      ? input.state?.trim() || undefined
                      : s.state,
                  postalCode:
                    'postalCode' in input
                      ? input.postalCode?.trim() || undefined
                      : s.postalCode,
                  country: merged.country?.trim() || s.country,
                  status: input.status ?? s.status,
                  updatedAt: today,
                }
              : s,
          ),
        )

        return { ok: true, id }
      },

      deactivateSupplier: (id) => {
        const target = suppliers.find((s) => s.id === id)
        if (!target) {
          return { ok: false, message: 'Supplier was not found.' }
        }

        if (target.status === 'Inactive') {
          return {
            ok: false,
            message: `Supplier "${target.companyName}" is already inactive.`,
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: 'Inactive',
                  updatedAt: today,
                }
              : s,
          ),
        )

        return { ok: true, id }
      },

      reactivateSupplier: (id) => {
        const target = suppliers.find((s) => s.id === id)
        if (!target) {
          return { ok: false, message: 'Supplier was not found.' }
        }

        if (target.status === 'Active') {
          return {
            ok: false,
            message: `Supplier "${target.companyName}" is already active.`,
          }
        }

        const today = new Date().toISOString().slice(0, 10)
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: 'Active',
                  updatedAt: today,
                }
              : s,
          ),
        )

        return { ok: true, id }
      },
    }
  }, [suppliers])

  return (
    <SuppliersContext.Provider value={store}>
      {children}
    </SuppliersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSuppliersStore() {
  const store = useContext(SuppliersContext)
  if (!store) {
    throw new Error('useSuppliersStore must be used inside SuppliersProvider')
  }
  return store
}
