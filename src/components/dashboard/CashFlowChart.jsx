import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext.jsx'
import EmptyState from '../common/EmptyState.jsx'
import { formatCurrency } from '../../utils/format.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 px-3.5 py-2.5 shadow-cardHover text-xs">
      <p className="font-semibold text-navy-700 dark:text-navy-200 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-navy-500 dark:text-navy-400 capitalize">{p.dataKey}:</span>
          <span className="font-semibold text-navy-800 dark:text-navy-100">{formatCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function CashFlowChart() {
  const { analytics } = useFinance()
  const cashFlowData = analytics?.cashFlow ?? []
  const hasData = cashFlowData.some((m) => m.income > 0 || m.expenses > 0)

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Cash Flow</h3>
          <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">Income vs expenses</p>
        </div>
      </div>
      {!hasData ? (
        <EmptyState icon={BarChart3} title="No cash flow yet" description="Add income and expense transactions to see how money moves each month." />
      ) : (
      <div className="h-72 mt-4 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cashFlowData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0F9D6D" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0F9D6D" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E5484D" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#E5484D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-navy-100 dark:text-navy-700" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8695C2' }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#8695C2' }}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? `₹${Math.round(v / 100) / 10}k` : `₹${v}`)}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: '#8695C2', paddingTop: 12 }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#0F9D6D"
              strokeWidth={2.5}
              fill="url(#incomeGrad)"
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#E5484D"
              strokeWidth={2.5}
              fill="url(#expenseGrad)"
              name="Expenses"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  )
}
