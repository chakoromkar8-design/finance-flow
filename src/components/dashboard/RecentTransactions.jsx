import { Link } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext.jsx'
import { getCategoryIcon } from '../../utils/categoryIcons.js'
import { formatCurrency, formatShortDate } from '../../utils/format.js'
import EmptyState from '../common/EmptyState.jsx'
import { Receipt } from 'lucide-react'

export default function RecentTransactions() {
  const { transactions } = useFinance()
  const recent = transactions.slice(0, 6)

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Recent Transactions</h3>
        <Link
          to="/transactions"
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline focus-ring rounded"
        >
          View all transactions
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Start tracking your finances by adding your first transaction."
        />
      ) : (
        <ul className="mt-3 divide-y divide-navy-100 dark:divide-navy-700/60">
          {recent.map((tx) => {
            const Icon = getCategoryIcon(tx.category)
            const isIncome = tx.type === 'income'
            return (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isIncome
                      ? 'bg-income-50 text-income-600 dark:bg-income-500/10 dark:text-income-400'
                      : 'bg-navy-100 text-navy-500 dark:bg-navy-700 dark:text-navy-300'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-800 dark:text-navy-100 truncate">{tx.name}</p>
                  <p className="text-xs text-navy-400 dark:text-navy-500 truncate">
                    {tx.category} · {formatShortDate(tx.date)} · {tx.account}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums shrink-0 ${
                    isIncome ? 'text-income-600 dark:text-income-400' : 'text-navy-700 dark:text-navy-200'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
