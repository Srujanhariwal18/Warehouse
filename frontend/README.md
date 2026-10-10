# Invora frontend

The Invora frontend is a React application for modern, high-performance
warehouse and inventory management.

## Functionality overview

### Dashboard (`/app/dashboard`)

- **Operational metrics**: Real-time KPI summaries including total products,
  total inventory valuation in INR, active low-stock alerts, and pending orders.
- **Stock movement chart**: Interactive Recharts line chart illustrating inbound
  and outbound unit flows across dedicated preview ranges:
  - **7 days**: Daily movement points.
  - **30 days**: Multi-day interval movement points.
  - **12 months**: Full year monthly movement points.
- **Recent stock activity**: Log of the latest inbound, outbound, and adjustment
  events across warehouses with formatted dates and product links.
- **Low-stock quick view**: At-a-glance list of items at or below reorder
  thresholds with quick links to the inventory catalogue.

### Inventory catalogue (`/app/inventory`)

- **Catalogue table**: Comprehensive product listings showing SKU, category,
  warehouse location, available stock, unit price, inventory value, and status badges.
- **Search and filtering**: Fast client-side search across product names and SKUs,
  combined with filters for category, warehouse, stock status, and configurable
  page size (10, 20, or 40 items per page).
- **Sorting**: Multi-column sorting by product name, stock quantity, unit price,
  and total valuation.
- **Product detail drawer**: Accessible slide-out drawer providing full product
  specifications and immediate action shortcuts.
- **Product management (Add / Edit)**: Modal dialog with rigorous validation for
  product name, case-insensitive unique SKU, valid warehouse, finite positive
  prices, and non-negative integer stock/threshold quantities.
- **Stock adjustments (Stock In / Stock Out)**: Inline modal operations to adjust
  available inventory and append records to transaction history. Rejects zero,
  negative, fractional, non-finite quantities, and stock-outs exceeding available inventory.

### Mock data and persistence note

All inventory, warehouse, and transaction data is managed in-memory via a shared
React Context store (`InventoryProvider`). Updates made during a browser session
(such as adding products, editing fields, or performing stock in/out operations)
update the shared store across both the Inventory and Dashboard views in real time.
**These updates are mock data and are not persisted to a real backend or database.**
Refreshing or reloading the page resets the state to initial mock data.

## Routes

- `/` — Foundation and landing overview page.
- `/app/dashboard` — Operational dashboard.
- `/app/inventory` — Product catalogue, search, filters, adjustments, and management.
- `/app/orders` — Orders placeholder (reserved for future phases).

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Installation

From the `frontend/` directory:

```bash
npm install
```

## Development and build commands

Start the local Vite development server:

```bash
npm run dev
```

Run TypeScript verification and compile the production build:

```bash
npm run build
```

Run ESLint analysis:

```bash
npm run lint
```

Check code formatting with Prettier:

```bash
npm run format:check
```

Format all code with Prettier:

```bash
npm run format
```

Preview the production build locally:

```bash
npm run preview
```
