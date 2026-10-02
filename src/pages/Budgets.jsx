import { useMemo, useState } from 'react'
import { Plus, PiggyBank } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { formatCurrency } from '../utils/format.js'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import ProgressBar from '../components/common/ProgressBar.jsx'
import BudgetCard from '../components/budgets/BudgetCard.jsx'
import BudgetModal from '../components/budgets/BudgetModal.jsx'

export default function Budgets() {
  const { budgets } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)

  const summary = useMemo(() => {
    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0)
    const spent = budgets.reduce((s, b) => s + b.spent, 0)
    return { totalBudget, spent, remaining: totalBudget - spent }
  }, [budgets])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">Budgets</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">Plan your monthly spending by category.</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          Create Budget
        </Button>
      </div>

      <div className="card p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-navy-900 dark:text-white mb-4">Monthly Budget</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-navy-400 dark:text-navy-500">Total Budget</p>
            <p className="text-lg font-bold text-navy-900 dark:text-white mt-1">{formatCurrency(summary.totalBudget)}</p>
          </div>
          <div>
            <p className="text-xs text-navy-400 dark:text-navy-500">Spent</p>
            <p className="text-lg font-bold text-navy-900 dark:text-white mt-1">{formatCurrency(summary.spent)}</p>
          </div>
          <div>
            <p className="text-xs text-navy-400 dark:text-navy-500">Remaining</p>
            <p
              className={`text-lg font-bold mt-1 ${
                summary.remaining < 0 ? 'text-expense-500' : 'text-income-600 dark:text-income-400'
              }`}
            >
              {formatCurrency(summary.remaining)}
            </p>
          </div>
        </div>
        <ProgressBar value={summary.spent} max={summary.totalBudget} />
      </div>

      {budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={PiggyBank}
            title="No budgets yet"
            description="Create your first budget to start keeping spending in check."
            action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Create Budget</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} />
          ))}
        </div>
      )}

      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
