import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { InventoryProvider } from '@/lib/inventoryStore'
import { OrdersProvider } from '@/lib/orderStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <InventoryProvider>
        <OrdersProvider>
          <App />
        </OrdersProvider>
      </InventoryProvider>
    </BrowserRouter>
  </StrictMode>,
)
