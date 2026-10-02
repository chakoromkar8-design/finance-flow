import { Landmark, Wallet, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format.js'

const ICONS = { landmark: Landmark, wallet: Wallet, 'credit-card': CreditCard }

export default function AccountCard({ account }) {
  const Icon = ICONS[account.icon] || Landmark
  const isNegative = account.balance < 0

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            isNegative
              ? 'bg-expense-50 text-expense-600 dark:bg-expense-500/10 dark:text-expense-400'
              : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300'
          }`}
        >
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-navy-500 dark:text-navy-400">{account.name}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${
          isNegative ? 'text-expense-500' : 'text-navy-900 dark:text-white'
        }`}
      >
        {formatCurrency(account.balance)}
      </p>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-navy-100 dark:border-navy-700/60 text-xs text-navy-400 dark:text-navy-500">
        <span>{account.type}</span>
        <span>Updated {formatDate(account.updatedAt)}</span>
      </div>
    </div>
  )
}
