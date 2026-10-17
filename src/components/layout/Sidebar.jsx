
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  Target,
  Banknote,
  BarChart3,
  Settings,
  Wallet,
  ChevronDown,
  ChartCandlestick,
  ChartPie,
  CalendarDays,
  ShieldCheck,
  Boxes,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Savings Goals', icon: Target },
  { to: '/loans', label: 'Loans & EMIs', icon: Banknote },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const INVESTMENT_ITEMS = [
  { to: '/investments/shares', label: 'Shares', icon: ChartCandlestick },
  { to: '/investments/mutual-funds', label: 'Mutual Funds', icon: ChartPie },
  { to: '/investments/sip', label: 'SIP', icon: CalendarDays },
  { to: '/investments/bonds', label: 'Bonds', icon: Landmark },
  { to: '/investments/fd', label: 'FD', icon: Banknote },
  { to: '/investments/commodities', label: 'Commodities', icon: Boxes },
  { to: '/investments/lic', label: 'LIC', icon: ShieldCheck },
]

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
          isActive
            ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
            : 'text-navy-600 hover:bg-navy-100 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white'
        }`
      }
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const [investmentsOpen, setInvestmentsOpen] = useState(false)
  const location = useLocation()

  const isInvestmentRoute = location.pathname.startsWith('/investments')
  const showInvestmentItems = investmentsOpen || isInvestmentRoute

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-white text-navy-900 border-r border-navy-100 px-4 py-6 shadow-sm dark:bg-navy-900 dark:text-white dark:border-navy-800">
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
          <Wallet size={18} strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold tracking-tight">FinanceFlow</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <button
          type="button"
          onClick={() => setInvestmentsOpen((open) => !open)}
          aria-expanded={showInvestmentItems}
          className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
            isInvestmentRoute
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
              : 'text-navy-600 hover:bg-navy-100 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white'
          }`}
        >
          <ChartCandlestick size={18} strokeWidth={2} />
          <span className="flex-1 text-left">Investment</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${showInvestmentItems ? 'rotate-180' : ''}`}
          />
        </button>

        {showInvestmentItems && (
          <div className="ml-4 space-y-1 border-l border-navy-200 pl-3 dark:border-navy-700">
            {INVESTMENT_ITEMS.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
        )}
      </nav>

      <div className="space-y-1 pt-4 border-t border-navy-100 dark:border-navy-800">
        <NavItem to="/settings" label="Settings" icon={Settings} />
      </div>
    </aside>
  )
}

export { NAV_ITEMS, INVESTMENT_ITEMS }
