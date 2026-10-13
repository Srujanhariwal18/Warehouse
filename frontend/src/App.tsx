import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { LoadingState } from '@/components/ui/LoadingState'

const FoundationPage = lazy(() =>
  import('@/pages/FoundationPage').then((m) => ({ default: m.FoundationPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const InventoryPage = lazy(() =>
  import('@/pages/InventoryPage').then((m) => ({ default: m.InventoryPage })),
)
const StockTransactionsPage = lazy(() =>
  import('@/pages/StockTransactionsPage').then((m) => ({
    default: m.StockTransactionsPage,
  })),
)
const OrdersPage = lazy(() =>
  import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })),
)
const SuppliersPage = lazy(() =>
  import('@/pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
)
const WarehousesPage = lazy(() =>
  import('@/pages/WarehousesPage').then((m) => ({ default: m.WarehousesPage })),
)
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const AlertsPage = lazy(() =>
  import('@/pages/AlertsPage').then((m) => ({ default: m.AlertsPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-main p-8">
          <LoadingState />
        </div>
      }
    >
      <Routes>
        <Route element={<FoundationPage />} path="/" />
        <Route element={<AppShell />}>
          <Route element={<DashboardPage />} path="/app/dashboard" />
          <Route element={<InventoryPage />} path="/app/inventory" />
          <Route element={<StockTransactionsPage />} path="/app/transactions" />
          <Route element={<OrdersPage />} path="/app/orders" />
          <Route element={<SuppliersPage />} path="/app/suppliers" />
          <Route element={<WarehousesPage />} path="/app/warehouses" />
          <Route element={<ReportsPage />} path="/app/reports" />
          <Route element={<AlertsPage />} path="/app/alerts" />
        </Route>
        <Route element={<NotFoundPage />} path="*" />
        <Route element={<Navigate replace to="/app/dashboard" />} path="/app" />
      </Routes>
    </Suspense>
  )
}

export default App
