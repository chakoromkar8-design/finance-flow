import { useFinance } from '../../context/FinanceContext.jsx';
import { Target } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format.js'
import ProgressBar from '../common/ProgressBar.jsx'

export default function GoalCard({ goal }) {
  const pct = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0

  const { updateGoal } = useFinance();

  const handleAddFunds = async () => {
    // Adds the monthly contribution to the saved total, capping it at the target amount
    const newSaved = Math.min(goal.target, (goal.saved || 0) + (goal.monthlyContribution || 0));
    await updateGoal(goal.id, { ...goal, saved: newSaved });
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Target size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-800 dark:text-navy-100">{goal.name}</p>
          <p className="text-xs text-navy-400 dark:text-navy-500">by {formatDate(goal.targetDate)}</p>
        </div>
      </div>

      <div className="flex items-end justify-between mb-1.5">
        <p className="text-xl font-bold text-navy-900 dark:text-white tabular-nums">{formatCurrency(goal.saved)}</p>
        <p className="text-xs text-navy-400 dark:text-navy-500">of {formatCurrency(goal.target)}</p>
      </div>
      <ProgressBar value={goal.saved} max={goal.target} status="normal" />
      <button onClick={handleAddFunds}className="mt-3 text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2 rounded-lg w-full hover:bg-blue-200 transition-colors" >
      Add Monthly Contribution
      </button>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-100 dark:border-navy-700/60 text-xs">
        <span className="text-navy-400 dark:text-navy-500">
          Contributing {formatCurrency(goal.monthlyContribution)}/mo
        </span>
        <span className="font-semibold text-brand-600 dark:text-brand-400">{pct}%</span>
      </div>
    </div>
    
  )
}
