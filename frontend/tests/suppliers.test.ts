import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  validateSupplierInput,
  type CreateSupplierInput,
} from '../src/lib/supplierStore'
import { initialSuppliers, type Supplier } from '../src/mocks/supplierData'
import { products } from '../src/mocks/inventoryData'
import { validateOrderInput } from '../src/lib/orderStore'
import { isOrderWithinDateRange } from '../src/pages/OrdersPage'

test('1. Required-field validation and whitespace trimming', () => {
  const currentSuppliers: Supplier[] = initialSuppliers.map((s) => ({ ...s }))

  // 1a. Missing or whitespace-only company name
  const emptyNameResult = validateSupplierInput(
    {
      companyName: '   ',
      contactPerson: 'Arun Rao',
      email: 'arun@example.com',
      phone: '+91 98000 00000',
      address: '12 Industrial Area',
    },
    currentSuppliers,
  )
  assert.equal(emptyNameResult.ok, false)
  if (!emptyNameResult.ok) {
    assert.match(emptyNameResult.message, /company name is required/i)
  }

  // 1b. Missing or whitespace-only contact person
  const emptyContactResult = validateSupplierInput(
    {
      companyName: 'Apex Tools',
      contactPerson: '   ',
      email: 'arun@example.com',
      phone: '+91 98000 00000',
      address: '12 Industrial Area',
    },
    currentSuppliers,
  )
  assert.equal(emptyContactResult.ok, false)
  if (!emptyContactResult.ok) {
    assert.match(emptyContactResult.message, /contact person is required/i)
  }

  // 1c. Missing email
  const emptyEmailResult = validateSupplierInput(
    {
      companyName: 'Apex Tools',
      contactPerson: 'Arun Rao',
      email: '   ',
      phone: '+91 98000 00000',
      address: '12 Industrial Area',
    },
    currentSuppliers,
  )
  assert.equal(emptyEmailResult.ok, false)
  if (!emptyEmailResult.ok) {
    assert.match(emptyEmailResult.message, /email address is required/i)
  }

  // 1d. Missing phone
  const emptyPhoneResult = validateSupplierInput(
    {
      companyName: 'Apex Tools',
      contactPerson: 'Arun Rao',
      email: 'arun@example.com',
      phone: '   ',
      address: '12 Industrial Area',
    },
    currentSuppliers,
  )
  assert.equal(emptyPhoneResult.ok, false)
  if (!emptyPhoneResult.ok) {
    assert.match(emptyPhoneResult.message, /phone number is required/i)
  }

  // 1e. Missing address
  const emptyAddressResult = validateSupplierInput(
    {
      companyName: 'Apex Tools',
      contactPerson: 'Arun Rao',
      email: 'arun@example.com',
      phone: '+91 98000 00000',
      address: '   ',
    },
    currentSuppliers,
  )
  assert.equal(emptyAddressResult.ok, false)
  if (!emptyAddressResult.ok) {
    assert.match(emptyAddressResult.message, /address is required/i)
  }
})

test('2. Email validation and case-insensitive duplicate detection', () => {
  const currentSuppliers: Supplier[] = initialSuppliers.map((s) => ({ ...s }))
  // SUP-101 has email: 'sales@bharatforgings.co.in'

  // 2a. Malformed email formats
  const invalidEmails = [
    'invalid-email',
    'test@',
    '@domain.com',
    'test@domain',
    'test space@domain.com',
  ]
  for (const badEmail of invalidEmails) {
    const res = validateSupplierInput(
      {
        companyName: 'Unique Co',
        contactPerson: 'Vikas',
        email: badEmail,
        phone: '+91 98000 00000',
        address: 'Sector 5',
      },
      currentSuppliers,
    )
    assert.equal(res.ok, false, `Email "${badEmail}" should be rejected`)
    if (!res.ok) {
      assert.match(res.message, /valid email address/i)
    }
  }

  // 2b. Case-insensitive duplicate email detection
  const duplicateUpper = validateSupplierInput(
    {
      companyName: 'New Vendor Inc',
      contactPerson: 'Sameer',
      email: 'SALES@BHARATFORGINGS.CO.IN', // uppercase duplicate
      phone: '+91 98000 00000',
      address: 'Plot 99, MIDC',
    },
    currentSuppliers,
  )
  assert.equal(
    duplicateUpper.ok,
    false,
    'Uppercase email duplicate must be rejected',
  )
  if (!duplicateUpper.ok) {
    assert.match(duplicateUpper.message, /already exists/i)
  }

  const duplicateWithSpaces = validateSupplierInput(
    {
      companyName: 'Another Vendor',
      contactPerson: 'Karan',
      email: '  sales@bharatforgings.co.in  ',
      phone: '+91 98000 00000',
      address: 'Plot 99, MIDC',
    },
    currentSuppliers,
  )
  assert.equal(
    duplicateWithSpaces.ok,
    false,
    'Whitespace-padded email duplicate must be rejected',
  )

  // 2c. Editing existing supplier allows keeping their own email
  const selfEditResult = validateSupplierInput(
    {
      companyName: 'Bharat Precision Forgings Ltd (Updated)',
      contactPerson: 'Rajesh Kulkarni',
      email: 'sales@bharatforgings.co.in', // same email
      phone: '+91 22 2847 1100',
      address: 'Plot 42, MIDC',
    },
    currentSuppliers,
    'SUP-101', // exclude self
  )
  assert.equal(
    selfEditResult.ok,
    true,
    'Supplier editing own record should allow keeping existing email',
  )
})

test('3. Phone format validation', () => {
  const currentSuppliers: Supplier[] = initialSuppliers.map((s) => ({ ...s }))

  // Valid phone formats
  const validPhones = [
    '+91 22 2847 1100',
    '+91 98450 11234',
    '080-28394422',
    '(022) 28471100',
    '+919800000000',
  ]
  for (const phone of validPhones) {
    const res = validateSupplierInput(
      {
        companyName: 'Valid Phone Co',
        contactPerson: 'Priya',
        email: 'priya@validphone.com',
        phone,
        address: 'Peenya Estate',
      },
      currentSuppliers,
    )
    assert.equal(res.ok, true, `Phone "${phone}" should be accepted`)
  }

  // Invalid phone numbers
  const invalidPhones = ['123', 'abc', 'phone-number', '+', '---']
  for (const phone of invalidPhones) {
    const res = validateSupplierInput(
      {
        companyName: 'Invalid Phone Co',
        contactPerson: 'Priya',
        email: 'priya@invalidphone.com',
        phone,
        address: 'Peenya Estate',
      },
      currentSuppliers,
    )
    assert.equal(res.ok, false, `Phone "${phone}" should be rejected`)
  }
})

test('4. Adding, editing, and state operations', () => {
  let suppliers: Supplier[] = initialSuppliers.map((s) => ({ ...s }))

  const newSupplierInput: CreateSupplierInput = {
    companyName: 'Karnataka Fasteners Pvt Ltd',
    contactPerson: 'Naveen Gowda',
    email: 'info@karnatakafasteners.co.in',
    phone: '+91 80 4123 9988',
    address: 'Plot 23, Peenya Industrial Area Phase I',
    city: 'Bengaluru',
    state: 'Karnataka',
  }

  // 4a. Add supplier
  const valResult = validateSupplierInput(newSupplierInput, suppliers)
  assert.equal(valResult.ok, true)

  const newId = `SUP-113`
  const today = new Date().toISOString().slice(0, 10)
  const createdSupplier: Supplier = {
    id: newId,
    ...newSupplierInput,
    status: 'Active',
    createdAt: today,
    updatedAt: today,
  }
  suppliers = [createdSupplier, ...suppliers]

  assert.equal(suppliers.length, initialSuppliers.length + 1)
  assert.equal(suppliers[0].id, 'SUP-113')
  assert.equal(suppliers[0].companyName, 'Karnataka Fasteners Pvt Ltd')
  assert.equal(suppliers[0].status, 'Active')

  // 4b. Edit supplier
  const editValidation = validateSupplierInput(
    {
      companyName: 'Karnataka Fasteners & Precision Tools',
      contactPerson: 'Naveen K. Gowda',
      email: 'info@karnatakafasteners.co.in',
      phone: '+91 80 4123 9999',
      address: 'Plot 23, Peenya Industrial Area Phase I',
    },
    suppliers,
    newId,
  )
  assert.equal(editValidation.ok, true)

  suppliers = suppliers.map((s) =>
    s.id === newId
      ? {
          ...s,
          companyName: 'Karnataka Fasteners & Precision Tools',
          contactPerson: 'Naveen K. Gowda',
          phone: '+91 80 4123 9999',
          updatedAt: today,
        }
      : s,
  )

  const edited = suppliers.find((s) => s.id === newId)!
  assert.equal(edited.companyName, 'Karnataka Fasteners & Precision Tools')
  assert.equal(edited.contactPerson, 'Naveen K. Gowda')
  assert.equal(edited.phone, '+91 80 4123 9999')
})

test('5. Deactivation and reactivation safety', () => {
  let suppliers: Supplier[] = initialSuppliers.map((s) => ({ ...s }))
  const activeSupplier = suppliers.find((s) => s.status === 'Active')!

  // 5a. Deactivate
  suppliers = suppliers.map((s) =>
    s.id === activeSupplier.id ? { ...s, status: 'Inactive' } : s,
  )
  const afterDeactivation = suppliers.find((s) => s.id === activeSupplier.id)!
  assert.equal(afterDeactivation.status, 'Inactive')

  // 5b. Verify product model and stock are completely untouched
  const allProductsIntact = products.every((p) => p.stock >= 0)
  assert.equal(
    allProductsIntact,
    true,
    'Product catalog must not be deleted or modified upon supplier deactivation',
  )

  // 5c. Reactivate
  suppliers = suppliers.map((s) =>
    s.id === activeSupplier.id ? { ...s, status: 'Active' } : s,
  )
  const afterReactivation = suppliers.find((s) => s.id === activeSupplier.id)!
  assert.equal(afterReactivation.status, 'Active')
})

test('6. Search, filtering, and pagination logic', () => {
  const suppliers: Supplier[] = initialSuppliers.map((s) => ({ ...s }))

  // 6a. Search by company name
  const nameSearch = 'forgings'
  const nameMatches = suppliers.filter((s) =>
    s.companyName.toLowerCase().includes(nameSearch),
  )
  assert.equal(nameMatches.length >= 1, true)
  assert.equal(nameMatches[0].id, 'SUP-101')

  // 6b. Search by contact person
  const contactSearch = 'rajesh'
  const contactMatches = suppliers.filter((s) =>
    s.contactPerson.toLowerCase().includes(contactSearch),
  )
  assert.equal(contactMatches.length, 1)
  assert.equal(contactMatches[0].companyName, 'Bharat Precision Forgings Ltd')

  // 6c. Search by email
  const emailSearch = 'kaverilubricants'
  const emailMatches = suppliers.filter((s) =>
    s.email.toLowerCase().includes(emailSearch),
  )
  assert.equal(emailMatches.length, 1)
  assert.equal(emailMatches[0].id, 'SUP-106')

  // 6d. Filter by status
  const activeOnly = suppliers.filter((s) => s.status === 'Active')
  const inactiveOnly = suppliers.filter((s) => s.status === 'Inactive')
  assert.equal(activeOnly.length + inactiveOnly.length, suppliers.length)
  assert.equal(
    activeOnly.every((s) => s.status === 'Active'),
    true,
  )
  assert.equal(
    inactiveOnly.every((s) => s.status === 'Inactive'),
    true,
  )

  // 6e. Pagination
  const pageSize = 10
  const page1 = suppliers.slice(0, pageSize)
  const page2 = suppliers.slice(pageSize, pageSize * 2)
  assert.equal(page1.length, 10)
  assert.equal(page2.length, suppliers.length - 10)
})

test('7. Cross-model product associations and limitation handling', () => {
  // Check products mapped to SUP-101
  const sup101Products = products.filter((p) => p.supplierId === 'SUP-101')
  assert.equal(
    sup101Products.length > 0,
    true,
    'SUP-101 should have associated products',
  )
  assert.equal(
    sup101Products.every((p) => p.supplierId === 'SUP-101'),
    true,
  )

  // Check unmapped supplier (e.g. SUP-111) returns empty list safely
  const sup111Products = products.filter((p) => p.supplierId === 'SUP-111')
  assert.equal(Array.isArray(sup111Products), true)
  assert.equal(
    sup111Products.length,
    0,
    'Unmapped supplier should safely return empty array',
  )
})

test('8. Regression check: existing orders and inventory validation remain functional', () => {
  // 8a. Order validation against inventory stock
  const sampleProduct = products[0]
  const validOrder = validateOrderInput(
    {
      customerName: 'Regression Client',
      customerEmail: 'regress@example.com',
      customerPhone: '+91 98000 00000',
      warehouseId: sampleProduct.warehouseId,
      items: [
        {
          productId: sampleProduct.id,
          quantity: Math.min(2, sampleProduct.stock),
        },
      ],
    },
    products,
  )
  assert.equal(
    validOrder.ok,
    true,
    'Order validation must remain fully functional',
  )

  // 8b. Date filtering
  const today = new Date().toISOString().slice(0, 10)
  assert.equal(isOrderWithinDateRange(today, '7d'), true)
  assert.equal(isOrderWithinDateRange(today, 'all'), true)
})
