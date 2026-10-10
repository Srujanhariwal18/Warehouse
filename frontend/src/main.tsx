import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { InventoryProvider } from '@/lib/inventoryStore'
import { OrdersProvider } from '@/lib/orderStore'
import { SuppliersProvider } from '@/lib/supplierStore'
import { WarehouseProvider } from '@/lib/warehouseStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <InventoryProvider>
        <OrdersProvider>
          <SuppliersProvider>
            <WarehouseProvider>
              <App />
            </WarehouseProvider>
          </SuppliersProvider>
        </OrdersProvider>
      </InventoryProvider>
    </BrowserRouter>
  </StrictMode>,
)
