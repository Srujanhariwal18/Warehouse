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

### Orders management (`/app/orders`)

- **Orders summary**: Real-time KPI summaries for total orders, pending orders,
  orders in processing, completed orders, and mock total order value formatted in INR.
- **Orders table**: Comprehensive listing of ~120 orders displaying Order ID,
  customer name, contact details, creation date, line item count, order total,
  and status badges.
- **Search, filter, and sort**: Fast searching by Order ID or customer, filtering
  by status, date range (7, 30, 90 days, or all time), and warehouse location,
  multi-column sorting (by date, amount, customer, or ID), configurable pagination,
  and instant filter reset.
- **Order inspection drawer**: Slide-out details drawer showing customer contact
  info, fulfillment warehouse, itemized product list with unit prices and line totals,
  order notes, timestamped activity timeline, and valid status transition actions.
- **Order status workflows**: Enforced status transition state machine
  (Pending → Processing / Cancelled; Processing → Completed / Cancelled).
  Order cancellation requires explicit confirmation and logs an optional reason.
- **Create order workflow**: Modal dialog to register customer orders with
  dynamic line items, live inventory stock ceiling validation, automatic line and
  order total calculations, and comprehensive input error feedback.

### Suppliers management (`/app/suppliers`)

- **Suppliers summary**: Real-time KPI summaries for total suppliers, active
  suppliers, inactive suppliers, and suppliers linked to inventory products.
- **Suppliers directory**: Comprehensive vendor registry with Supplier ID, company
  name, primary contact person, email, phone number, location, and active/inactive status badges.
- **Search, filter, and sort**: Fast searching across company name, contact person,
  email, phone, and city; status filtering (All, Active, Inactive); multi-column sorting
  (by company name, contact person, status, or date added); and configurable pagination (10, 20, 40).
- **Supplier inspection drawer**: Slide-out details drawer showing primary contact
  info, email, phone, location address, registered and updated dates, and a reactive list of
  associated inventory products mapped via `supplierId`.
- **Supplier management (Add / Edit)**: Accessible modal dialogs with validation
  for required company name, contact person, valid email format, case-insensitive
  unique email verification, valid phone format, and location address.
- **Deactivation safety**: Confirmation modal required before deactivating a supplier.
  Deactivating or reactivating a supplier never deletes or alters products, inventory
  stock quantities, or orders.

### Warehouse, zone, and rack management (`/app/warehouses`)

- **Warehouse overview**: Real-time KPI summaries for total warehouses, active facilities,
  total storage zones, and total bin/pallet racks across the logistics network.
- **Hierarchical navigation**: Seamless three-tier drill-down hierarchy:
  - **Warehouse level**: Overview of all distribution centers, locations, floor capacities in sq ft,
    zone/rack counts, assigned inventory SKUs, and facility status badges.
  - **Zone level**: Deep-dive into a selected warehouse's segregated sections (cold storage, staging docks,
    bulk pallet areas, fast-moving pick aisles) with zone-specific KPI metrics and rack counts.
  - **Rack level**: Detailed view into a zone's storage structures with shelf levels (tiers), rated unit
    capacities, and assigned stock items.
  - **Accessible breadcrumbs**: Context-aware breadcrumb navigation (`Warehouses > Mumbai Central > Bulk Pallet Storage A`)
    enabling instant navigation back to higher levels.
- **Search, filter, and sort**: Fast client-side filtering by name, identifier, and location across all three tiers,
  status filtering (`All`, `Active`, `Inactive`), multi-column sorting, configurable pagination (10, 20, 40 per page),
  and quick filter resets.
- **Facility inspection drawer**: Slide-out profile drawer displaying facility metadata, address details,
  floor capacity, zone roster, and live products mapped to the warehouse from the inventory catalogue.
- **CRUD operations and validation**:
  - **Warehouse**: Name (required), City (required), case-insensitive unique identifier, optional address/state/postal code,
    and positive integer floor area capacity.
  - **Zone**: Name (required), parent warehouse (validated against existing facilities), zone type, optional description,
    and unique identifier within the warehouse scope.
  - **Rack**: Label/name (required), parent zone (validated against existing zones), shelf levels, and optional positive integer unit capacity.
- **Accidental loss & dependency protection**:
  - Deactivating a warehouse is blocked if it still contains active zones or assigned inventory records, with clear explanatory feedback.
  - Deactivating a zone is blocked if it contains active child racks or assigned stock items.
  - Deactivating a rack is blocked if active inventory items are assigned to it.
  - Deactivating or editing facilities, zones, or racks never deletes or silently alters product records, inventory stock, or orders.

### Stock transactions and movement history (`/app/transactions`)

- **Operational KPI metrics**: Real-time summaries for total audit events, total stock received
  (inbound units), total stock dispatched (outbound units), and count of adjustments and transfers.
- **Audit movement log**: Comprehensive transaction table and responsive mobile cards displaying
  Transaction ID, timestamp, color-coded transaction type badge, product item and SKU, signed
  movement quantity (+, -, ±, ➔), facility or route, previous-to-resulting stock impact,
  audit reference number, and status.
- **Search, filter, and sort**: Fast client-side filtering by transaction ID, product name, SKU, reference
  number, or reason; filtering by type (`All Types`, `Stock In`, `Stock Out`, `Adjustment`, `Transfer`),
  date range (`All time`, `Today`, `Last 7 days`, `Last 30 days`, `Last 90 days`), warehouse facility,
  and status; multi-column sorting (date/time, quantity, type, product); and configurable pagination (10, 20, 40).
- **Transaction details drawer**: Slide-out audit profile detailing product metadata, unit quantity,
  previous and resulting stock, granular location stock breakdown for transfers, facility routing,
  PO/DO/Audit reference numbers, audit notes, and supplier info for receipts.
- **Create transaction workflows**:
  - **Stock In**: Increases product inventory at the destination warehouse. Validates positive integer quantity,
    existing warehouse, and optional supplier.
  - **Stock Out**: Decreases product inventory from the source warehouse. Rejects if requested quantity
    exceeds available stock or is non-positive.
  - **Adjustment**: Reconciles inventory discrepancies. Requires a mandatory audit reason. Supports both
    quantity delta (+ / -) and target physical count modes, strictly preventing negative inventory.
  - **Transfer**: Relocates stock between different warehouses without altering total product inventory across all locations.
    Enforces different source and destination warehouses, verifies sufficient source stock, and records
    granular source/destination before-and-after stock quantities.
- **Data consistency and auditability**:
  - Coordinated directly with `InventoryProvider` as the single source of truth for product stock.
  - Completed transactions are immutable historical records with stable identifiers.
  - Deterministic initial seed transactions are distinguishable from transactions recorded during the active session.

### Mock data and persistence note

All inventory, warehouse, zone, rack, order, supplier, and transaction data is managed in-memory via
shared React Context stores (`InventoryProvider`, `OrdersProvider`, `SuppliersProvider`, `WarehouseProvider`, and `TransactionProvider`).
Updates made during a browser session (such as adding/editing products, performing stock adjustments,
creating orders, updating order statuses, adding/editing/deactivating suppliers, managing warehouses, or recording stock transactions) update the shared
stores in real time across the workspace.
**These updates are mock data and are not persisted to a real backend or database.**
Creating an order does not deduct inventory stock, and deactivating a facility or supplier does not delete inventory records.
Refreshing or reloading the page resets the state to initial mock data.

## Routes

- `/` — Foundation and landing overview page.
- `/app/dashboard` — Operational dashboard with real-time inventory and pending orders metrics.
- `/app/inventory` — Product catalogue, search, filters, adjustments, and management.
- `/app/transactions` — Stock transactions and movement history audit log, KPI summaries, and transaction creation flow.
- `/app/orders` — Orders management, status workflows, and order creation.
- `/app/suppliers` — Suppliers directory, vendor profiles, contact details, and product links.
- `/app/warehouses` — Warehouse, zone, and rack management with three-tier hierarchical drill-downs.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Installation

From the `frontend/` directory:

```bash
npm install
```

## Development and build commands

Run automated test suites:

```bash
npm test
```

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
