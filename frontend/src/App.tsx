import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { FoundationPage } from '@/pages/FoundationPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrdersPage } from '@/pages/OrdersPage'

function App() {
  return (
    <Routes>
      <Route element={<FoundationPage />} path="/" />
      <Route element={<AppShell />}>
        <Route element={<DashboardPage />} path="/app/dashboard" />
        <Route element={<InventoryPage />} path="/app/inventory" />
        <Route element={<OrdersPage />} path="/app/orders" />
      </Route>
      <Route element={<NotFoundPage />} path="*" />
      <Route element={<Navigate replace to="/" />} path="/app" />
    </Routes>
  )
}

export default App
