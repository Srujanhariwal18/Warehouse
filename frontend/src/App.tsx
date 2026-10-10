import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { FoundationPage } from '@/pages/FoundationPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { StockTransactionsPage } from '@/pages/StockTransactionsPage'
import { SuppliersPage } from '@/pages/SuppliersPage'
import { WarehousesPage } from '@/pages/WarehousesPage'

function App() {
  return (
    <Routes>
      <Route element={<FoundationPage />} path="/" />
      <Route element={<AppShell />}>
        <Route element={<DashboardPage />} path="/app/dashboard" />
        <Route element={<InventoryPage />} path="/app/inventory" />
        <Route element={<StockTransactionsPage />} path="/app/transactions" />
        <Route element={<OrdersPage />} path="/app/orders" />
        <Route element={<SuppliersPage />} path="/app/suppliers" />
        <Route element={<WarehousesPage />} path="/app/warehouses" />
      </Route>
      <Route element={<NotFoundPage />} path="*" />
      <Route element={<Navigate replace to="/" />} path="/app" />
    </Routes>
  )
}

export default App
