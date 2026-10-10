export type Warehouse = {
  id: string
  name: string
  city: string
}

export type Product = {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  reorderThreshold: number
  warehouseId: string
  barcode?: string
}

export type StockTransaction = {
  id: string
  productId: string
  type: 'Inbound' | 'Outbound' | 'Adjustment'
  quantity: number
  warehouseId: string
  date: string
}

export type Order = {
  id: string
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  total: number
}

export type StockHistoryPoint = {
  month: string
  inbound: number
  outbound: number
}

export const warehouses: Warehouse[] = [
  { id: 'wh-mum', name: 'Mumbai Central', city: 'Mumbai' },
  { id: 'wh-del', name: 'Delhi North', city: 'Delhi' },
  { id: 'wh-blr', name: 'Bengaluru South', city: 'Bengaluru' },
]

const names = [
  'Cedar Storage Bin',
  'Atlas Packing Tape',
  'Nimbus Label Printer',
  'Harbor Steel Rack',
  'Orbit Barcode Scanner',
  'Mango Carton Box',
  'Slate Utility Cart',
  'Pine Shipping Labels',
  'Quartz Safety Gloves',
  'Copper Cable Ties',
  'Loom Cotton Gloves',
  'Summit Pallet Wrap',
  'Terra Floor Markers',
  'Ember Thermal Labels',
  'Willow Storage Tray',
  'Nexus Hand Truck',
  'Aster Packing Knife',
  'Drift Bubble Wrap',
  'Fjord Steel Shelf',
  'Kite Inventory Tags',
  'Mica Counting Scale',
  'Saffron Marker Set',
  'Ridge Dock Plate',
  'Cobalt Tote Box',
  'Basil Cleaning Kit',
  'Cove Plastic Pallet',
  'Flint Work Light',
  'Maple Document Wallet',
  'Vega RFID Reader',
  'Olive Stretch Film',
  'Echo Picking Basket',
  'Lumen Headlamp',
  'Canyon Corner Guard',
  'Indigo Packing Paper',
  'Moss Return Label',
  'Nova Shipping Scale',
  'Pearl Cable Organizer',
  'Solace Ear Protection',
  'Tide Warehouse Broom',
  'Amber Safety Vest',
]

const categories = ['Storage', 'Packing', 'Equipment', 'Safety']
const prices = [1850, 420, 12499, 8750, 6999, 18.5, 3200, 275]
const stockLevels = [128, 64, 22, 8, 0, 340, 46, 12, 75, 5]

export const products: Product[] = names.map((name, index) => ({
  id: `product-${index + 1}`,
  name,
  sku: `INV-${String(index + 1).padStart(4, '0')}`,
  category: categories[index % categories.length],
  price: prices[index % prices.length],
  stock: stockLevels[index % stockLevels.length],
  reorderThreshold: index % 5 === 4 ? 10 : 20,
  warehouseId: warehouses[index % warehouses.length].id,
  ...(index % 4 === 0
    ? { barcode: `890100${String(index + 1).padStart(6, '0')}` }
    : {}),
}))

export const stockTransactions: StockTransaction[] = [
  {
    id: 'txn-1',
    productId: 'product-3',
    type: 'Inbound',
    quantity: 24,
    warehouseId: 'wh-mum',
    date: '2026-10-10',
  },
  {
    id: 'txn-2',
    productId: 'product-5',
    type: 'Outbound',
    quantity: 8,
    warehouseId: 'wh-blr',
    date: '2026-10-09',
  },
  {
    id: 'txn-3',
    productId: 'product-11',
    type: 'Adjustment',
    quantity: -3,
    warehouseId: 'wh-del',
    date: '2026-10-08',
  },
  {
    id: 'txn-4',
    productId: 'product-1',
    type: 'Outbound',
    quantity: 16,
    warehouseId: 'wh-mum',
    date: '2026-10-07',
  },
  {
    id: 'txn-5',
    productId: 'product-18',
    type: 'Inbound',
    quantity: 80,
    warehouseId: 'wh-blr',
    date: '2026-10-06',
  },
  {
    id: 'txn-6',
    productId: 'product-21',
    type: 'Outbound',
    quantity: 4,
    warehouseId: 'wh-mum',
    date: '2026-10-05',
  },
  {
    id: 'txn-7',
    productId: 'product-8',
    type: 'Inbound',
    quantity: 120,
    warehouseId: 'wh-del',
    date: '2026-10-04',
  },
  {
    id: 'txn-8',
    productId: 'product-25',
    type: 'Adjustment',
    quantity: 6,
    warehouseId: 'wh-blr',
    date: '2026-10-03',
  },
]

export const orders: Order[] = [
  { id: 'ORD-1048', status: 'Pending', total: 48500 },
  { id: 'ORD-1047', status: 'Processing', total: 12990 },
  { id: 'ORD-1046', status: 'Shipped', total: 76200 },
  { id: 'ORD-1045', status: 'Delivered', total: 3180 },
  { id: 'ORD-1044', status: 'Cancelled', total: 92000 },
  { id: 'ORD-1043', status: 'Pending', total: 6450 },
]

export const stockHistory: StockHistoryPoint[] = [
  { month: 'Nov', inbound: 820, outbound: 680 },
  { month: 'Dec', inbound: 940, outbound: 720 },
  { month: 'Jan', inbound: 760, outbound: 810 },
  { month: 'Feb', inbound: 1080, outbound: 900 },
  { month: 'Mar', inbound: 990, outbound: 860 },
  { month: 'Apr', inbound: 1160, outbound: 1040 },
  { month: 'May', inbound: 1040, outbound: 980 },
  { month: 'Jun', inbound: 1240, outbound: 1110 },
  { month: 'Jul', inbound: 1180, outbound: 1280 },
  { month: 'Aug', inbound: 1360, outbound: 1190 },
  { month: 'Sep', inbound: 1280, outbound: 1240 },
  { month: 'Oct', inbound: 1420, outbound: 1310 },
]

export const lowStockProducts = products.filter(
  (product) => product.stock <= product.reorderThreshold,
)
