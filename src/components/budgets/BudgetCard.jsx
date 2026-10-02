import { getCategoryIcon } from '../../utils/categoryIcons.js'
import { formatCurrency } from '../../utils/format.js'
import ProgressBar from '../common/ProgressBar.jsx'
import Badge from '../common/Badge.jsx'

const STATUS_LABEL = {
  normal: 'On track',
  warning: 'Watch spending',
  near: 'Near limit',
  exceeded: 'Exceeded',
}

const STATUS_TONE = {
  normal: 'income',
  warning: 'warn',
  near: 'warn',
  exceeded: 'expense',
}

export default function BudgetCard({ budget }) {
  const Icon = getCategoryIcon(budget.category)
  const pct = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0
  const status = pct >= 100 ? 'exceeded' : pct >= 85 ? 'near' : pct >= 60 ? 'warning' : 'normal'
  const remaining = budget.limit - budget.spent

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-300">
            <Icon size={16} />
          </div>
          <span className="text-sm font-semibold text-navy-800 dark:text-navy-100">{budget.category}</span>
        </div>
        <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
      </div>

      <ProgressBar value={budget.spent} max={budget.limit} status={status} />

      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-navy-500 dark:text-navy-400">
          {formatCurrency(budget.spent)} <span className="text-navy-300 dark:text-navy-600">/</span>{' '}
          {formatCurrency(budget.limit)}
        </span>
        <span className={remaining < 0 ? 'text-expense-500 font-medium' : 'text-navy-400 dark:text-navy-500'}>
          {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
        </span>
      </div>
    </div>
  )
}
