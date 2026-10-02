import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Sun, Moon, Monitor, LogOut } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { NAV_ITEMS } from './Sidebar.jsx'

const TITLES = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/accounts': 'Accounts',
  '/budgets': 'Budgets',
  '/goals': 'Savings Goals',
  '/loans': 'Loans & EMIs',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

export default function Navbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { mode, setMode, resolved } = useTheme()
  const title = TITLES[location.pathname] || 'FinanceFlow'

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system']
    setMode(order[(order.indexOf(mode) + 1) % order.length])
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  const ThemeIcon = mode === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-navy-100 dark:border-navy-700/60 bg-white/85 dark:bg-navy-900/85 backdrop-blur px-4 sm:px-6 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-navy-500 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white rounded-lg p-1.5 focus-ring"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-navy-900 dark:text-white truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="hidden sm:flex items-center gap-2 rounded-xl border border-navy-200 dark:border-navy-700 px-3 py-2 text-sm text-navy-400 hover:text-navy-600 dark:hover:text-navy-200 focus-ring"
          aria-label="Search"
        >
          <Search size={16} />
          <span className="text-xs">Search…</span>
        </button>
        <button
          className="sm:hidden text-navy-500 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white rounded-lg p-2 focus-ring"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        <button
          className="relative text-navy-500 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white rounded-lg p-2 focus-ring"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-expense-500" />
        </button>

        <button
          onClick={cycleTheme}
          className="text-navy-500 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white rounded-lg p-2 focus-ring"
          aria-label={`Theme: ${mode}. Click to change.`}
          title={`Theme: ${mode}`}
        >
          <ThemeIcon size={18} />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-navy-100 dark:border-navy-700">
          <div className="h-8 w-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold">
            {(user?.name || '?').trim().charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm font-medium text-navy-700 dark:text-navy-200">{user?.name}</span>
        </div>

        <button
          onClick={handleLogout}
          className="text-navy-500 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white rounded-lg p-2 focus-ring"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
