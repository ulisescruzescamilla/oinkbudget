# OinkBudget - AI Coding Instructions

## Architecture Overview

**React Native Budget App** built with Expo Router, SQLite, and NativeWind for cross-platform personal finance management.

### Core Stack
- **Expo Router**: File-based routing with tabs layout in `app/(tabs)/`
- **SQLite**: Local database with `expo-sqlite` and custom repository pattern
- **NativeWind**: Tailwind CSS for React Native styling
- **GluestackUI**: Component library with custom theme integration
- **TypeScript**: Strongly typed throughout with custom interfaces

### Data Architecture

**Database Layer** (`database/`):
- Centralized connection via `getDBConnection()` singleton pattern
- Repository pattern: `*Repository.ts` files with async CRUD operations
- Transaction handling in `balanceRepository.ts` for complex operations
- Schema defined in `database/index.ts` with foreign key constraints

**Key Tables**:
- `balances`: Financial transaction history (income/expense)
- `accounts`: User bank accounts and cash
- `budgets`: Spending categories with limits and progress tracking
- `expenses`: Detailed expense records linked to budgets

**Type System** (`types/`):
- Interface-driven with nullable IDs for new entities
- `BalanceType`: Union type for 'income' | 'expense' transactions
- All DB interactions use typed interfaces, never raw SQL

### Component Architecture

**Component Hierarchy**:
```
components/
├── mine/           # Custom business components
│   ├── actions/    # Modal forms (AddIncome, AddExpense)
│   ├── forms/      # Reusable form inputs
│   └── index.ts    # Barrel exports
└── ui/             # GluestackUI components
```

**Form Pattern**:
- Action components (`AddIncome.tsx`, `AddExpense.tsx`) use modal overlays
- Validation state per field with `isInvalid` props
- Reset functions clear all form state
- Toast notifications on success: `ToastAndroid.show()`

### Key Patterns

**Financial Transactions**:
- All money operations go through `balanceRepository.insertToBalance()`
- Uses database transactions to maintain data consistency
- Updates account balances and creates expense records atomically
- Date handling: Convert JS Date to ISO string for SQLite storage

**Navigation & State**:
- Tab navigation with custom icons via `react-native-iconify`
- Modal state managed at parent component level
- No global state management - local useState for forms

**Styling Conventions**:
- NativeWind classes preferred: `className="flex flex-row gap-4"`
- Custom StyleSheet only for complex layouts requiring precise positioning
- Gradient backgrounds using `LinearGradient` component
- Color system extends Tailwind with semantic tokens

## Development Workflow

**Start Development**:
```bash
npm start          # Expo development server
npm run android    # Android emulator
npm run ios        # iOS simulator
```

**Database Debugging**:
- Drizzle Studio integration via `useDrizzleStudio(db)` in `_layout.tsx`
- Access at development URL when running
- Test queries in `database/index.ts` `testDB()` function

**Code Organization**:
- Barrel exports in `components/mine/index.ts` for clean imports
- TypeScript strict mode - always type component props
- Absolute imports configured: `@/components`, `@/database`, `@/types`

**Common Gotchas**:
- SQLite date storage as ISO strings, parse when reading
- Form validation requires manual state management per field
- ActionCard components expect `open` boolean and `handleClose` callback
- Repository functions return promises - always await database calls