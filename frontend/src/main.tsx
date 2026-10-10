import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { InventoryProvider } from '@/lib/inventoryStore'
import { OrdersProvider } from '@/lib/orderStore'
import { SuppliersProvider } from '@/lib/supplierStore'
import { WarehouseProvider } from '@/lib/warehouseStore'
import { TransactionProvider } from '@/lib/transactionStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WarehouseProvider>
        <InventoryProvider>
          <SuppliersProvider>
            <OrdersProvider>
              <TransactionProvider>
                <App />
              </TransactionProvider>
            </OrdersProvider>
          </SuppliersProvider>
        </InventoryProvider>
      </WarehouseProvider>
    </BrowserRouter>
  </StrictMode>,
)
