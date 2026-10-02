import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'

const TONES = {
  navy: 'bg-white text-navy-900 border border-navy-100 shadow-card dark:bg-navy-900 dark:text-white dark:border-navy-700',
  income: 'bg-white dark:bg-navy-800/60 border border-navy-100 dark:border-navy-700/60',
  expense: 'bg-white dark:bg-navy-800/60 border border-navy-100 dark:border-navy-700/60',
  brand: 'bg-white dark:bg-navy-800/60 border border-navy-100 dark:border-navy-700/60',
}

const ICON_TONES = {
  navy: 'bg-navy-100 text-navy-700 dark:bg-white/10 dark:text-white',
  income: 'bg-income-50 text-income-600 dark:bg-income-500/10 dark:text-income-400',
  expense: 'bg-expense-50 text-expense-600 dark:bg-expense-500/10 dark:text-expense-400',
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
}

export default function StatCard({ title, value, changePct, icon: Icon, tone = 'brand', sub }) {
  const isPositive = changePct >= 0
  const cardBase = tone === 'navy'
  const mutedText = cardBase ? 'text-navy-500 dark:text-navy-300' : 'text-navy-500 dark:text-navy-400'
  const valueText = cardBase ? 'text-navy-900 dark:text-white' : 'text-navy-900 dark:text-white'

  return (
    <div className={`rounded-2xl p-5 shadow-card ${TONES[tone]}`}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-medium ${mutedText}`}>{title}</p>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${ICON_TONES[tone]}`}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${valueText}`}>{formatCurrency(value)}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {typeof changePct === 'number' && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              isPositive ? 'text-income-500' : 'text-expense-500'
            } ${cardBase ? (isPositive ? 'text-income-600 dark:text-income-400' : 'text-expense-600 dark:text-expense-400') : ''}`}
          >
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(changePct)}%
          </span>
        )}
        <span className={`text-xs ${mutedText}`}>{sub || 'from last month'}</span>
      </div>
    </div>
  )
}
