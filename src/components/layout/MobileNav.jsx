
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  X,
  Settings,
  Wallet,
  ChevronDown,
  ChartCandlestick,
  ChartPie,
  CalendarDays,
  Landmark,
  Banknote,
  Boxes,
  ShieldCheck,
} from 'lucide-react'
import { NAV_ITEMS, INVESTMENT_ITEMS } from './Sidebar.jsx'

export default function MobileNav({ open, onClose }) {
  const [investmentsOpen, setInvestmentsOpen] = useState(false)
  const location = useLocation()

  if (!open) return null

  const isInvestmentRoute =
    location.pathname.startsWith('/investments')

  const showInvestmentItems =
    investmentsOpen || isInvestmentRoute

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Mobile drawer */}
      <aside
        className="absolute inset-y-0 left-0 flex w-[min(18rem,calc(100vw-2rem))] flex-col overflow-y-auto overscroll-contain bg-navy-900 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white shadow-2xl animate-slide-in-right"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Header */}
        <div className="mb-8 flex shrink-0 items-center justify-between gap-3 px-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500">
              <Wallet size={18} strokeWidth={2.5} />
            </div>
            <span className="truncate text-lg font-bold tracking-tight">
              FinanceFlow
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="shrink-0 rounded-lg p-2 text-navy-300 hover:bg-navy-800 hover:text-white focus-ring"
          >
            <X size={22} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-ring ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}

          {/* Investments dropdown */}
          <button
            type="button"
            onClick={() => setInvestmentsOpen((value) => !value)}
            aria-expanded={showInvestmentItems}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-ring ${
              isInvestmentRoute
                ? 'bg-brand-500 text-white'
                : 'text-navy-300 hover:bg-navy-800 hover:text-white'
            }`}
          >
            <ChartCandlestick size={18} strokeWidth={2} />
            <span className="flex-1 text-left">Investments</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showInvestmentItems ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showInvestmentItems && (
            <div className="ml-4 space-y-1 border-l border-navy-700 pl-3">
              {INVESTMENT_ITEMS.map(
                ({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-ring ${
                        isActive
                          ? 'bg-brand-500 text-white'
                          : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} strokeWidth={2} />
                    {label}
                  </NavLink>
                ),
              )}
            </div>
          )}
        </nav>

        {/* Settings */}
        <div className="mt-4 shrink-0 space-y-1 border-t border-navy-800 pt-4">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-ring ${
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-navy-300 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <Settings size={18} strokeWidth={2} />
            Settings
          </NavLink>
        </div>
      </aside>
    </div>
  )
}
