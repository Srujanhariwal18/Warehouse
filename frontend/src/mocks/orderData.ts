import { products, warehouses } from './inventoryData'

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled'

export type OrderItem = {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  total: number
}

export type OrderTimelineEvent = {
  id: string
  status: OrderStatus
  timestamp: string
  note: string
}

export type Order = {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  createdAt: string
  items: OrderItem[]
  totalAmount: number
  warehouseId: string
  status: OrderStatus
  notes?: string
  timeline: OrderTimelineEvent[]
}

const customerPool = [
  {
    name: 'Apex Logistics Ltd',
    email: 'procurement@apexlogistics.in',
    phone: '+91 98201 44521',
  },
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    phone: '+91 98450 11234',
  },
  {
    name: 'BlueDart Hub Bengaluru',
    email: 'supplies@bluedart-hub.com',
    phone: '+91 80 4123 9000',
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@horizonind.com',
    phone: '+91 99203 88123',
  },
  {
    name: 'Deccan Freight Services',
    email: 'ops@deccanfreight.com',
    phone: '+91 94440 22341',
  },
  {
    name: 'Vikram Malhotra',
    email: 'v.malhotra@retailcraft.in',
    phone: '+91 98112 55432',
  },
  {
    name: 'Omicron Packaging Corp',
    email: 'orders@omicronpack.in',
    phone: '+91 98210 77334',
  },
  {
    name: 'Ananya Deshmukh',
    email: 'ananya.d@westernlogistics.in',
    phone: '+91 97654 32109',
  },
  {
    name: 'Mumbai Warehousing Co.',
    email: 'store@mumbaiwh.com',
    phone: '+91 22 2540 1980',
  },
  {
    name: 'Kavita Sundaram',
    email: 'kavita@sundaramtrade.com',
    phone: '+91 94451 90812',
  },
  {
    name: 'RapidRoute Courier Services',
    email: 'fleet@rapidroute.in',
    phone: '+91 98980 12345',
  },
  {
    name: 'Rohan Mehra',
    email: 'rohan.mehra@fastline.co.in',
    phone: '+91 98300 45678',
  },
  {
    name: 'Ganga Valley Stores',
    email: 'purchase@gangavalley.in',
    phone: '+91 97110 99887',
  },
  {
    name: 'Meera Nambiar',
    email: 'meera.nambiar@kerelogistics.com',
    phone: '+91 94471 23456',
  },
  {
    name: 'Skyline Distribution Hub',
    email: 'dispatch@skylinedist.com',
    phone: '+91 80 2854 3322',
  },
  {
    name: 'Aditya Sen',
    email: 'aditya.sen@kolkatapack.in',
    phone: '+91 98310 77665',
  },
  {
    name: 'Northern Express Cargo',
    email: 'cargo@northernexpress.in',
    phone: '+91 11 4155 7800',
  },
  {
    name: 'Sneha Kulkarni',
    email: 'sneha.k@punesolutions.in',
    phone: '+91 98220 54321',
  },
  {
    name: 'Zodiac Fulfillment Centre',
    email: 'inventory@zodiacfulfil.in',
    phone: '+91 98400 66554',
  },
  {
    name: 'Tanvi Joshi',
    email: 'tanvi.joshi@gujaratbox.com',
    phone: '+91 98790 33221',
  },
]

const optionalNotes = [
  'Urgent dispatch requested before afternoon truck departure.',
  'Fragile items included. Handle carton stacking with care.',
  'Bulk order for Q4 seasonal inventory buildup.',
  'Standard delivery protocol. Call customer prior to arrival.',
  'Customer requested wooden pallet shrink-wrapping.',
  'Replacement shipment for damaged transit cartons.',
  'Pickup arranged via third-party freight contractor.',
  undefined,
  undefined,
  undefined,
]

// Deterministic generator with 120 orders
function generateDeterministicOrders(): Order[] {
  const generated: Order[] = []
  const baseTimestamp = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  for (let i = 1; i <= 120; i++) {
    const orderNumber = 1000 + i
    const id = `ORD-${orderNumber}`
    const customer = customerPool[(i * 7 + 3) % customerPool.length]
    const warehouse = warehouses[i % warehouses.length]

    // Determine status: 25 Pending, 35 Processing, 50 Completed, 10 Cancelled
    let status: OrderStatus
    if (i % 12 === 0) {
      status = 'Cancelled'
    } else if (i % 5 === 0) {
      status = 'Pending'
    } else if (i % 3 === 0) {
      status = 'Processing'
    } else {
      status = 'Completed'
    }

    // Days ago between 1 and 90 days ago
    const daysAgo = Math.floor((121 - i) * 0.75)
    const orderTime = new Date(baseTimestamp - daysAgo * dayMs)
    const createdAt = orderTime.toISOString().slice(0, 10)

    // Select 1 to 3 items deterministically
    const itemCount = (i % 3) + 1
    const items: OrderItem[] = []

    for (let j = 0; j < itemCount; j++) {
      const productIndex = (i * 3 + j * 7) % products.length
      const product = products[productIndex]
      const quantity = ((i + j * 2) % 6) + 1
      const unitPrice = product.price
      const total = quantity * unitPrice

      items.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice,
        total,
      })
    }

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0)
    const notes = optionalNotes[(i * 3) % optionalNotes.length]

    // Build timeline
    const timeline: OrderTimelineEvent[] = [
      {
        id: `tl-${id}-1`,
        status: 'Pending',
        timestamp: `${createdAt}T09:30:00Z`,
        note: `Order placed by ${customer.name}.`,
      },
    ]

    if (status === 'Processing' || status === 'Completed') {
      const processTime = new Date(orderTime.getTime() + 4 * 3600 * 1000)
      timeline.push({
        id: `tl-${id}-2`,
        status: 'Processing',
        timestamp: processTime.toISOString(),
        note: `Order validated and assigned to ${warehouse.name}.`,
      })
    }

    if (status === 'Completed') {
      const completeTime = new Date(orderTime.getTime() + 28 * 3600 * 1000)
      timeline.push({
        id: `tl-${id}-3`,
        status: 'Completed',
        timestamp: completeTime.toISOString(),
        note: 'Order successfully packed and dispatched.',
      })
    }

    if (status === 'Cancelled') {
      const cancelTime = new Date(orderTime.getTime() + 6 * 3600 * 1000)
      timeline.push({
        id: `tl-${id}-c`,
        status: 'Cancelled',
        timestamp: cancelTime.toISOString(),
        note: 'Order cancelled per customer request.',
      })
    }

    generated.push({
      id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      createdAt,
      items,
      totalAmount,
      warehouseId: warehouse.id,
      status,
      notes,
      timeline,
    })
  }

  // Return sorted descending by ID (newest order ORD-1120 first)
  return generated.reverse()
}

export const initialOrders: Order[] = generateDeterministicOrders()
