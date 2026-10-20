import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

const TITLES = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/accounts': 'Accounts',
  '/budgets': 'Budgets',
  '/goals': 'Savings Goals',
  '/loans': 'Loans & EMIs',
  '/insurance': 'Insurance',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
}

export default function Navbar({ onMenuClick }) {
  const location = useLocation()
  const title = TITLES[location.pathname] || 'FinanceFlow'

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-navy-100 dark:border-navy-700/60 bg-white/85 dark:bg-navy-900/85 backdrop-blur px-4 sm:px-6 py-3.5">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-navy-500 dark:text-navy-300 hover:text-navy-800 dark:hover:text-white rounded-lg p-1.5 focus-ring"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-base sm:text-lg font-semibold text-navy-900 dark:text-white truncate">
        {title}
      </h1>
    </header>
  )
}