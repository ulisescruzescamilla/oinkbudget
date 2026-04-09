1# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Oink Budget** is a cross-platform personal finance app built with React Native (Expo). It's a Spanish-language budgeting app that tracks accounts, budgets, and transactions. Data is stored locally via SQLite and synchronized with a REST API.

## Commands

```bash
npm install          # Install dependencies (uses legacy-peer-deps)
npm start            # Start Expo dev server
npm run android      # Run on Android emulator
npm run ios          # Run on iOS simulator
npm run build        # Build for web (expo export)
npm test             # Run Jest tests
```

To run a single test file:
```bash
npx jest path/to/test.file.ts
```

## Architecture

### Routing
File-based routing via **Expo Router**. All screens live under `app/`. The main UI is a 4-tab layout (`app/(tabs)/`): Dashboard, History, Accounts, Budgets.

### API Layer
HTTP communication via **Axios**. Follows a strict 4-layer separation — screens never call axios directly.

```
api/client.ts          ← Axios instance + request/response interceptors
services/<entity>.ts   ← One file per backend resource (CRUD + custom actions)
hooks/use<Entity>.ts   ← Consumes a service, owns loading/error/data state
utils/tokenStorage.ts  ← expo-secure-store read/write/clear
utils/errorHandler.ts  ← Normalizes any thrown value into AppError
```

**Core rules:**
- `api/` handles HTTP config only — no business logic.
- `services/` map 1:1 to backend resources: `authService`, `accountService`, `budgetService`, `expenseService`.
- `hooks/` expose state + mutation functions to UI: `useAuth`, `useAccounts`, `useBudgets`, `useExpenses`.
- Screens call hooks only — never `fetch`/`axios` directly.
- Auth token is stored in the native keychain via `expo-secure-store` and attached automatically by the request interceptor.

**422 error handling:**
The API returns validation errors in this shape:
```json
{ "message": "...", "errors": { "field": ["message"] } }
```
`normalizeError` extracts `errors` into `AppError.fieldErrors: FieldErrors`. Hooks surface `fieldErrors` in state; form components receive it as a prop and render the first message per field via `getFieldError(fieldErrors, 'fieldName')`. Closing a form calls `clearFieldErrors()` to reset stale errors.

**Environment:**
Set `EXPO_PUBLIC_API_URL` in `.env` to point to the backend. Defaults to `http://localhost/api`.

### Local Data Layer
Raw SQL queries via `expo-sqlite` — no ORM. The `database/` directory contains repository files per entity (used by screens not yet migrated to the API layer):
- `database/index.ts` — DB initialization (called once in `app/_layout.tsx`)
- `database/accountRepository.ts`, `budgetRepository.ts`, `expenseRepository.ts`, `balanceRepository.ts`

**Schema:**
- `budgets` — name, max_limit, expense_amount, percentage_value, color, start_date, end_date
- `accounts` — name, amount, type (`cash | debit_card | credit_card`), hidden
- `expenses` — amount, description, account_id, budget_id, created_at
- `incomes` — amount, description, account_id, created_at
- `balances` — denormalized transaction log (amount, type `expense | income`, current_balance, budget_name, account_name, created_at)

### State Management
No global state library. Each screen fetches its own data via `useFocusEffect` (to refresh on navigation) or the hook's `refresh()` function. Pull-to-refresh is implemented with `RefreshControl` bound to `loading` + `refresh`. Mutations flow through hooks, which update local state optimistically after API success.

### UI Stack
- **GluestackUI** — component library (`components/ui/`)
- **NativeWind** — Tailwind CSS for React Native styling
- Custom app components live in `components/mine/`

Component organization:
- `components/mine/actions/` — modals for adding income/expense/account/budget and transfers
- `components/mine/forms/` — reusable form inputs (text, select, slider, calendar, checkbox)
- `components/mine/accordion/`, `swipeable/`, `progress/`, etc. — UI building blocks

### Styling
Tailwind via NativeWind. Custom theme defined in `tailwind.config.js` with semantic color tokens (primary, secondary, error, success), custom font families (Jakarta, Roboto, Space Mono, Inter), and custom shadows.

### Types
All shared entity interfaces live in `types/` and are the single source of truth across the entire app:
- `types/AccountType.ts` — `AccountType`, `KindOfAccountType`
- `types/BudgetType.ts` — `BudgetType`
- `types/ExpenseType.ts` — `ExpenseType`
- `types/IncomeType.ts` — `IncomeType`
- `types/BalanceType.ts` — `BalanceType`

**Rule:** never define duplicate entity interfaces in `services/`, `hooks/`, or components. Services map API responses to these types; hooks work with them directly. If a new entity is needed, add it to `types/` first.

### Path Aliases
`@/*` maps to the project root (configured in `tsconfig.json` and `babel.config.js`).

## Key Notes

- The app is in Spanish — keep UI strings in Spanish.
- All functions should be documented with TypeDoc comments.
- Currency is formatted as MXN (Mexican Peso) — see `utils/formatting.ts`.
- Date formatting helpers live in `utils/formatting.ts`: use `formatApiDate(date)` to serialize `Date` → `Y-m-d` string before sending in API payloads. Never define date formatters inline in services.
- `components/ui/` contains GluestackUI wrappers — prefer editing `components/mine/` for app-specific logic.
- SQLite is initialized in the root layout; the Drizzle Studio plugin is available for DB inspection during development.
- New React Native Architecture is enabled (`app.json`).
