import { Trash2, Pencil } from 'lucide-react'
import { getCategoryIcon } from '../../utils/categoryIcons.js'
import { formatCurrency, formatDate } from '../../utils/format.js'
import Badge from '../common/Badge.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { Receipt } from 'lucide-react'

export default function TransactionTable({ transactions, onDelete, onEdit }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions found"
        description="Try adjusting your filters, or add a new transaction to get started."
      />
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-navy-400 dark:text-navy-500 uppercase tracking-wide">
              <th className="font-medium px-4 py-2.5">Date</th>
              <th className="font-medium px-4 py-2.5">Description</th>
              <th className="font-medium px-4 py-2.5">Category</th>
              <th className="font-medium px-4 py-2.5">Account</th>
              <th className="font-medium px-4 py-2.5">Type</th>
              <th className="font-medium px-4 py-2.5 text-right">Amount</th>
              <th className="font-medium px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100 dark:divide-navy-700/60">
            {transactions.map((tx) => {
              const Icon = getCategoryIcon(tx.category)
              const isIncome = tx.type === 'income'
              return (
                <tr key={tx.id} className="hover:bg-navy-50/60 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="px-4 py-3 text-navy-500 dark:text-navy-400 whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-300 shrink-0">
                        <Icon size={14} />
                      </div>
                      <span className="font-medium text-navy-800 dark:text-navy-100">{tx.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-500 dark:text-navy-400">{tx.category}</td>
                  <td className="px-4 py-3 text-navy-500 dark:text-navy-400">{tx.account}</td>
                  <td className="px-4 py-3">
                    <Badge tone={isIncome ? 'income' : 'neutral'}>{isIncome ? 'Income' : 'Expense'}</Badge>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      isIncome ? 'text-income-600 dark:text-income-400' : 'text-navy-800 dark:text-navy-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onEdit(tx)}
                      className="text-navy-400 hover:text-brand-600 rounded-lg p-1.5 focus-ring"
                      aria-label={`Edit ${tx.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(tx)}
                      className="text-navy-400 hover:text-expense-500 rounded-lg p-1.5 focus-ring"
                      aria-label={`Delete ${tx.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => {
          const Icon = getCategoryIcon(tx.category)
          const isIncome = tx.type === 'income'
          return (
            <div key={tx.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-300 shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-800 dark:text-navy-100 truncate">{tx.name}</p>
                    <p className="text-xs text-navy-400 dark:text-navy-500">{formatDate(tx.date)} · {tx.account}</p>
                  </div>
                </div>
                <div className="flex shrink-0">
                <button
                  onClick={() => onEdit(tx)}
                  className="text-navy-400 hover:text-brand-600 rounded-lg p-1.5 focus-ring"
                  aria-label={`Edit ${tx.name}`}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onDelete(tx)}
                  className="text-navy-400 hover:text-expense-500 rounded-lg p-1.5 focus-ring"
                  aria-label={`Delete ${tx.name}`}
                >
                  <Trash2 size={15} />
                </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-100 dark:border-navy-700/60">
                <Badge tone={isIncome ? 'income' : 'neutral'}>{tx.category}</Badge>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    isIncome ? 'text-income-600 dark:text-income-400' : 'text-navy-800 dark:text-navy-100'
                  }`}
                >
                  {isIncome ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
