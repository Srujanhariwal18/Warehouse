# Invora Frontend Technology Stack

## Status and scope

This document defines the frontend stack for Invora. It records the approved technologies, design direction, frontend boundaries, quality expectations, and setup decisions to resolve during Phase 1.

The frontend will be developed inside `frontend/`. This document does not authorize changes to Java, Spring Boot, Maven, Supabase PostgreSQL, Flyway, Spring Security, JWT, or any other backend or database configuration.

## Core technology stack

| Area | Technology | Responsibility |
| --- | --- | --- |
| Framework | React with Vite | Frontend application and development server |
| Language | TypeScript with strict mode | Type-safe application code |
| Styling | Tailwind CSS v4 with the official Vite integration | Utility styling and design tokens |
| Routing | React Router | Public, authenticated, unauthorized, and not-found routes |
| Server state | TanStack Query | API-shaped fetching, caching, retries, and invalidation |
| Mock backend | Mock Service Worker (MSW) | Browser and test API responses before Spring Boot integration |
| Forms | React Hook Form | Form state and submission handling |
| Validation | Zod with `@hookform/resolvers` | Shared schemas and actionable validation errors |
| 3D graphics | Three.js, React Three Fiber, and Drei | Landing/login effects and optional warehouse visualization |
| Charts | Recharts | Primarily 2D inventory and sales analytics |
| Icons | Lucide React | Consistent accessible interface icons |
| Animation | Motion for React | Interaction and page transitions with reduced-motion support |
| Unit/component testing | Vitest and React Testing Library | Fast component and behavior tests |
| Browser testing | Playwright | End-to-end login-to-reorder flow |
| Code quality | ESLint and Prettier | Linting and formatting |
| Package manager | npm | Local dependency management and scripts |
| Version control | Git | Small, reviewable commits |

Dependencies should be installed locally in `frontend/`. Global installation is not required.

## Visual and interaction direction

Invora uses a premium dark warehouse-control-center visual language:

- Primary electric teal: `#14B8A6`
- Secondary amber: `#F59E0B`
- Main background: `#161C1B`
- Sidebar background: `#121817`
- Elevated surfaces: `#1D2523`, `#242E2B`, and `#2C3734`
- Sora for branding and display headings
- Geist for interface text
- Geist Mono for technical values
- A custom SVG crate or `I` mark with a Sora wordmark
- Balanced glassmorphism with ambient teal and amber lighting
- A geometric inventory-crate 3D signature
- Visible focus states, keyboard navigation, and WCAG AA contrast
- Responsive behavior at 360, 390, 768, 1024, and 1440 pixel breakpoints

Motion must respect `prefers-reduced-motion`. The strongest 3D treatment belongs on Landing and Login. Operational screens must remain readable, responsive, and fast.

## Initial page scope

Required pages:

1. Landing
2. Login
3. Dashboard
4. Inventory
5. Orders

A separate Products catalogue is optional and must not delay the required pages.

Every screen must provide intentional loading, empty, error, and populated states where applicable. Routes also require:

- Page titles
- Focus management
- Intentional scroll handling
- Friendly route-level error boundaries
- Custom 404 handling
- Unauthorized redirects
- Dark color scheme and themed scrollbars

## Mock data and locale

The initial frontend uses deterministic mock data approximately sized as follows:

- 40 products
- 3 warehouses
- 120 orders
- 12 months of sales data

Fixtures should cover low-stock and zero-stock products, unusual prices, cancelled orders, failed operations, and other realistic edge cases. Mock data must not be embedded directly in page components.

The initial locale and currency are:

- Locale: `en-IN`
- Currency: INR

Numbers, dates, and currency must be formatted consistently through `Intl`. Currency calculations should use integer minor units where practical and convert to display values at the formatting boundary.

## API and backend boundary

The frontend must use a centralized `src/api/` layer. Page and feature components should call typed API functions rather than access MSW handlers or fixture data directly.

MSW is the initial implementation behind those API functions. API shapes should be designed so the mock transport can later be replaced by the actual Spring Boot API without rewriting page components.

Orders are mock-only for this phase. Reorder is a frontend mock operation and must not be described as connected to the real database or backend. Real Orders integration will be planned after the actual API contracts are verified.

The current backend boundary is:

- Java 21
- Spring Boot
- Maven
- Supabase PostgreSQL
- Spring Data JPA
- Flyway
- Spring Security
- JWT

The existing PRD contains legacy MySQL wording. The current Supabase PostgreSQL backend definition is authoritative for future frontend API integration, while the frontend itself remains database-agnostic.

## Project organization

Frontend files belong under `frontend/`, following a feature-oriented structure:

```text
frontend/
├── src/
│   ├── api/
│   ├── app/
│   ├── components/
│   │   └── ui/
│   ├── features/
│   ├── layouts/
│   ├── lib/
│   ├── mocks/
│   ├── pages/
│   ├── routes/
│   └── styles/
├── tests/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── ...
```

The `@/` alias must resolve consistently in TypeScript and Vite. Modules should stay small, reusable, and feature-oriented. Avoid duplicate dependencies, oversized components, and abstractions without a current use case.

## Quality and compatibility requirements

- TypeScript strict mode must remain enabled.
- ESLint and Prettier checks must be available through npm scripts.
- Component tests must cover important states and interactions.
- Playwright must cover the login-to-reorder flow.
- A Lighthouse performance review is required.
- The target browsers are the latest two versions of Chrome, Edge, Firefox, and Safari.
- 3D features must have a graceful non-WebGL or reduced-motion fallback.
- 3D dependencies must be installed as a compatible React, React Three Fiber, Drei, and Three.js set.
- Recharts remains the primary charting library; no additional chart dependency is needed for decorative 3D accents.
- Tailwind CSS v4 should use `@tailwindcss/vite` and the CSS-first configuration approach rather than the legacy PostCSS setup unless a later requirement justifies it.
- Font delivery must be selected deliberately, with self-hosting preferred for predictable local development and performance.

## Phase 1 setup decisions

The following decisions must be confirmed or recorded before implementation expands:

1. React Router API/version approach.
2. Exact compatible React, React Three Fiber, Drei, and Three.js versions.
3. Sora, Geist, and Geist Mono delivery and licensing source.
4. Development login credentials and mock session behavior.
5. Session persistence, expiration, role handling, and unauthorized redirect behavior.
6. Typed API response and error contracts, including pagination and filtering.
7. Whether MSW runs in browser development, Vitest, or both.
8. Exact mock reorder semantics and failure behavior.
9. Whether the dashboard 3D view is included immediately or isolated behind a feature boundary.
10. Accessibility behavior for charts and 3D content.
11. Timezone policy for `en-IN` date formatting.
12. Whether the optional Products catalogue is deferred.

## Explicit exclusions

Until separately authorized, work under this stack definition must not:

- Modify backend source code or configuration.
- Modify database schema or migration files.
- Add real database calls to the frontend.
- Expose credentials, API keys, JWT secrets, or other secrets.
- Claim that mock behavior is connected to the real database.
- Install packages globally.
- Change Git branches without an approved workflow.
- Begin implementation before the current phase is reviewed and approved.

