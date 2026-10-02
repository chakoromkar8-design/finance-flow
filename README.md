# FinanceFlow — Personal Finance Dashboard (Frontend)

*"Take control of your money."*

A polished, responsive personal finance dashboard built as a college mini project. This stage is **frontend-only** — everything runs on mock data and React state. No backend, database, or authentication is implemented yet.

## Tech stack

- React 18 + Vite
- JavaScript (no TypeScript)
- Tailwind CSS
- Recharts (charts)
- Lucide React (icons)
- React Router

## Getting started

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/
    layout/       Sidebar, Navbar, MobileNav, AppLayout
    dashboard/     StatCard, CashFlowChart, ExpenseChart, RecentTransactions,
                    BudgetOverview, SavingsGoals
    transactions/  TransactionTable, TransactionModal, TransactionFilters
    accounts/      AccountCard, AccountModal
    budgets/       BudgetCard, BudgetModal
    goals/         GoalCard, GoalModal
    loans/         LoanCard, LoanSummary
    common/        Button, Modal, Input, Select, Badge, ProgressBar,
                    EmptyState, Skeleton
  pages/           Dashboard, Transactions, Accounts, Budgets, Goals,
                    Loans, Analytics, Settings, Login, Register
  context/         ThemeContext, ToastContext, FinanceContext
  data/            mockData.js
  utils/           format.js, categoryIcons.js
```

## Where mock data lives

All sample data — accounts, transactions, budgets, goals, loans, and
chart series — is defined in `src/data/mockData.js`, using realistic
Indian amounts (₹) and categories.

`src/context/FinanceContext.jsx` loads that data into React state on
startup and exposes it (plus `addTransaction`, `deleteTransaction`,
`addAccount`, `addBudget`, `addGoal`, and computed totals) to every
page via the `useFinance()` hook. Adding a transaction through the UI
updates the relevant account balance and budget automatically, all in
memory — nothing is persisted between page reloads.

`ThemeContext` handles light/dark/system mode (persisted to
`localStorage` only, purely a UI preference). `ToastContext` renders
the toast notifications used across the app.

Login and Register are UI-only: submitting either form shows a demo
toast and redirects to the dashboard. No credentials are checked or
stored.

## Connecting a backend later

The frontend is structured so the data layer can be swapped without
touching the UI:

1. Replace the static imports in `mockData.js` with API calls (e.g. in
   a new `src/services/api.js`), and have `FinanceContext` fetch from
   there instead of importing local arrays.
2. Keep the same shapes for transactions, accounts, budgets, goals,
   and loans — components already expect these fields, so the REST
   responses just need to match them.
3. Add real auth (JWT, sessions, etc.) behind `Login`/`Register`, and
   gate the routes in `App.jsx` accordingly.
4. `FinanceContext`'s action functions (`addTransaction`, etc.) are
   the natural place to fire `POST`/`DELETE` requests once a backend
   exists — the calling components won't need to change.

## Notes

- Network access wasn't available while generating this project, so
  `npm install` has not been run or verified here — please run it
  locally before starting the dev server.
- All account numbers, names, and balances are placeholder data.
