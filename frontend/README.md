# Invora frontend

The Invora frontend is the React application for a premium inventory
management system. This Phase 1 foundation establishes the Vite, TypeScript,
Tailwind CSS, ESLint, and Prettier tooling without implementing product
features.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Installation

From this directory:

```bash
npm install
```

## Development

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually
[`http://localhost:5173`](http://localhost:5173).

## Production build

```bash
npm run build
```

## Linting and formatting

```bash
npm run lint
npm run format:check
npm run format
```

## Project structure

- `src/app/` — application-level setup
- `src/components/ui/` — reusable interface primitives
- `src/features/` — feature-oriented modules
- `src/api/` — API client integrations
- `src/lib/` — shared utilities
- `src/mocks/` — development-only mock support
- `src/pages/` — page-level views
- `src/routes/` — route definitions
- `src/styles/` — additional style modules
