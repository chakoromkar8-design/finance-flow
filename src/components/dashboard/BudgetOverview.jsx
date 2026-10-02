import { Link } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency } from '../../utils/format.js'
import ProgressBar from '../common/ProgressBar.jsx'

export default function BudgetOverview() {
  const { budgets } = useFinance()

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Budget Overview</h3>
        <Link
          to="/budgets"
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline focus-ring rounded"
        >
          Manage budgets
        </Link>
      </div>

      {budgets.length === 0 ? (
        <p className="mt-4 text-sm text-navy-500 dark:text-navy-400">No budgets yet. Create your first budget to keep spending in check.</p>
      ) : (
      <ul className="mt-4 space-y-4">
        {budgets.slice(0, 4).map((b) => (
          <li key={b.id}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-navy-700 dark:text-navy-200">{b.category}</span>
              <span className="text-navy-500 dark:text-navy-400 tabular-nums">
                {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
              </span>
            </div>
            <ProgressBar value={b.spent} max={b.limit} />
          </li>
        ))}
      </ul>
      )}
    </div>
  )
}
