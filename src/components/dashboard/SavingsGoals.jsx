import { Link } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext.jsx'
import { formatCurrency, formatDate } from '../../utils/format.js'
import ProgressBar from '../common/ProgressBar.jsx'

export default function SavingsGoals() {
  const { goals } = useFinance()

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Savings Goals</h3>
        <Link
          to="/goals"
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline focus-ring rounded"
        >
          View all goals
        </Link>
      </div>

      {goals.length === 0 ? (
        <p className="mt-4 text-sm text-navy-500 dark:text-navy-400">Create your first savings goal to start tracking progress.</p>
      ) : (
      <ul className="mt-4 space-y-5">
        {goals.map((g) => {
          const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0
          return (
            <li key={g.id}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-navy-700 dark:text-navy-200">{g.name}</span>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{pct}%</span>
              </div>
              <ProgressBar value={g.saved} max={g.target} status="normal" />
              <div className="flex items-center justify-between mt-1.5 text-xs text-navy-400 dark:text-navy-500">
                <span>
                  {formatCurrency(g.saved)} of {formatCurrency(g.target)}
                </span>
                <span>by {formatDate(g.targetDate)}</span>
              </div>
            </li>
          )
        })}
      </ul>
      )}
    </div>
  )
}
