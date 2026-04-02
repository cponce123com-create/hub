# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Wouter routing, Tailwind v4, shadcn/ui, Recharts)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## ControlHub — Enterprise SaaS

**Target**: Peruvian companies (PEN currency, Spanish UI). Multi-tenant, modular architecture.

### Architecture

- `artifacts/controlhub/` — React + Vite frontend (port 24710, preview path `/controlhub`)
- `artifacts/api-server/` — Express API server (port 8080)
- `lib/db/` — Drizzle ORM schema + DB client
- `lib/api-spec/` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks from OpenAPI spec
- `lib/api-zod/` — Generated Zod schemas from OpenAPI spec

### Frontend Pages

- `/` — Dashboard (KPI cards, invoice trend chart, activity feed, alerts)
- `/finance/invoices` — Invoice management (CRUD, filters, status badges)
- `/finance/suppliers` — Supplier directory (CRUD with totals)
- `/hr/employees` — Employee directory (card grid, filters)
- `/hr/employees/:id` — Employee detail (profile, attendance summary, tabs)
- `/attendance` — Daily attendance tareo (table + date filter)
- `/documents` — Document repository (card grid, category filter)
- `/announcements` — Internal communications (priority board)
- `/reports` — Finance/Attendance/HR analytics (Recharts charts + tables)
- `/settings` — Company, profile, modules, roles configuration
- `/login` — Authentication page

### Auth

- Session-based (in-memory sessions + cookie `sessionId`)
- `SESSION_SECRET` env var used as signing secret
- Login checks: `password === "password"` OR `user.passwordHash === password`
- Default demo user: `admin@mineraandina.pe` / `password`

### DB Schema (8 tables)

`companies`, `users`, `employees`, `suppliers`, `invoices`, `attendance`, `documents`, `announcements` (+ `announcement_reads`)

### Theme

Dark navy background (`222 47% 11%`) + indigo primary (`235 86% 65%`) — dark-only, no `.dark` class toggling.

### Seed Data (Company ID: 1)

- Company: "Minera Andina SAC" (mining, Lima)
- Users: admin@mineraandina.pe, rrhh@mineraandina.pe, finanzas@mineraandina.pe (all password: "password")
- 2 suppliers, 4 invoices (PEN/USD, various statuses), 4 employees, 4 attendance records, 4 documents, 3 announcements

### API Proxy

The Vite dev server proxies `/api/*` → `http://localhost:8080` via `vite.config.ts`.
