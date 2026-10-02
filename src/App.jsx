import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import Accounts from './pages/Accounts.jsx'
import Budgets from './pages/Budgets.jsx'
import Goals from './pages/Goals.jsx'
import Loans from './pages/Loans.jsx'
import Analytics from './pages/Analytics.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Button from './components/common/Button.jsx'
import { Skeleton } from './components/common/Skeleton.jsx'

// Shown while we ask the server "is this browser logged in?" (or if it is unreachable).
function SessionGate({ children }) {
  const { status, error, retry } = useAuth()
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950" aria-busy="true">
        <div className="w-64 space-y-3 text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
          <p className="text-sm text-navy-500 dark:text-navy-400">Loading FinanceFlow…</p>
        </div>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950 p-6">
        <div className="card p-6 max-w-sm text-center space-y-4">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white">Can't reach the server</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400">{error}</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      </div>
    )
  }
  return children
}

function ProtectedRoute() {
  const { status } = useAuth()
  return status === 'authed' ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
  const { status } = useAuth()
  return status === 'authed' ? <Navigate to="/" replace /> : <Outlet />
}

export default function App() {
  return (
    <SessionGate>
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </SessionGate>
  )
}
