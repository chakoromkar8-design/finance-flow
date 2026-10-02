import { NavLink } from 'react-router-dom'
import { X, Settings, HelpCircle, Wallet } from 'lucide-react'
import { NAV_ITEMS } from './Sidebar.jsx'

export default function MobileNav({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-navy-950/50 animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 bg-navy-900 text-white px-4 py-6 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
              <Wallet size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">FinanceFlow</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-navy-300 hover:text-white rounded-lg p-1 focus-ring"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
                  isActive ? 'bg-brand-500 text-white' : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 pt-4 border-t border-navy-800">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
                isActive ? 'bg-brand-500 text-white' : 'text-navy-300 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <Settings size={18} strokeWidth={2} />
            Settings
          </NavLink>
          <a
            href="#help"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-300 hover:bg-navy-800 hover:text-white transition-colors focus-ring"
          >
            <HelpCircle size={18} strokeWidth={2} />
            Help
          </a>
        </div>
      </div>
    </div>
  )
}
