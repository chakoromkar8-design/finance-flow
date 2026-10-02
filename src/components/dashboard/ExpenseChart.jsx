import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { CATEGORY_COLORS } from '../../utils/categories.js'
import { useFinance } from '../../context/FinanceContext.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { formatCurrency } from '../../utils/format.js'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 px-3.5 py-2.5 shadow-cardHover text-xs">
      <p className="font-semibold text-navy-800 dark:text-navy-100">{d.category}</p>
      <p className="text-navy-500 dark:text-navy-400">{formatCurrency(d.value)} · {d.percent}%</p>
    </div>
  )
}

export default function ExpenseChart() {
  const { analytics } = useFinance()
  const expenseBreakdown = analytics?.expenseBreakdown ?? []

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Where your money goes</h3>
      <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">This month's expense breakdown</p>

      {expenseBreakdown.length === 0 ? (
        <EmptyState icon={PieIcon} title="No expenses this month" description="Your spending breakdown appears here once you add an expense." />
      ) : (
      <>
      <div className="h-48 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={expenseBreakdown}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={2}
              strokeWidth={0}
            >
              {expenseBreakdown.map((entry) => (
                <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#8695C2'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 space-y-2.5">
        {expenseBreakdown.map((item) => (
          <li key={item.category} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-navy-600 dark:text-navy-300">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#8695C2' }}
              />
              {item.category}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-navy-400 dark:text-navy-500 text-xs">{item.percent}%</span>
              <span className="font-medium text-navy-800 dark:text-navy-100 tabular-nums">
                {formatCurrency(item.value)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      </>
      )}
    </div>
  )
}
