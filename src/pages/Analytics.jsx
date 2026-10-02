import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, PiggyBank, Percent, Trophy } from 'lucide-react'
import { CATEGORY_COLORS } from '../utils/categories.js'
import { useFinance } from '../context/FinanceContext.jsx'
import { getDashboardAnalytics } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import { formatCurrency } from '../utils/format.js'

const RANGES = {
  'Last 3 Months': () => 3,
  'Last 6 Months': () => 6,
  'Last 12 Months': () => 12,
  'This Year': () => new Date().getMonth() + 1,
}

function ChartTooltip({ active, payload, label, prefix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 px-3.5 py-2.5 shadow-cardHover text-xs">
      {label && <p className="font-semibold text-navy-700 dark:text-navy-200 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="text-navy-600 dark:text-navy-300">
          {prefix}
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [range, setRange] = useState('Last 6 Months')
  const { transactions } = useFinance() // changes whenever the user adds/edits/deletes one
  const { notify } = useToast()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    getDashboardAnalytics(RANGES[range]())
      .then((data) => active && setAnalytics(data))
      .catch((err) => active && notify(err.message || 'Unable to load analytics.', 'error'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [range, transactions, notify])

  const cashFlowData = analytics?.cashFlow ?? []
  const monthlySpending = analytics?.monthlySpending ?? []
  const savingsTrend = analytics?.savingsTrend ?? []
  const expenseBreakdown = analytics?.expenseBreakdown ?? []

  const n = cashFlowData.length || 1
  const avgIncome = Math.round(cashFlowData.reduce((s, d) => s + d.income, 0) / n)
  const avgExpense = Math.round(cashFlowData.reduce((s, d) => s + d.expenses, 0) / n)
  const avgSavings = avgIncome - avgExpense
  const savingsRate = avgIncome > 0 ? Math.round((avgSavings / avgIncome) * 100) : 0
  const topCategory = expenseBreakdown[0]

  const summary = [
    { label: 'Avg. Monthly Income', value: formatCurrency(avgIncome), icon: TrendingUp, tone: 'income' },
    { label: 'Avg. Monthly Expense', value: formatCurrency(avgExpense), icon: TrendingDown, tone: 'expense' },
    { label: 'Avg. Savings', value: formatCurrency(avgSavings), icon: PiggyBank, tone: 'brand' },
    { label: 'Savings Rate', value: `${savingsRate}%`, icon: Percent, tone: 'brand' },
    { label: 'Top Category', value: topCategory ? topCategory.category : '—', icon: Trophy, tone: 'warn' },
  ]

  const toneClasses = {
    income: 'bg-income-50 text-income-600 dark:bg-income-500/10 dark:text-income-400',
    expense: 'bg-expense-50 text-expense-600 dark:bg-expense-500/10 dark:text-expense-400',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
    warn: 'bg-warn-50 text-warn-600 dark:bg-warn-500/10 dark:text-warn-400',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">Analytics</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">A deeper look at your financial patterns.</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 px-3.5 py-2.5 text-sm text-navy-700 dark:text-navy-200 focus-ring self-start"
        >
          {Object.keys(RANGES).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2.5 ${toneClasses[tone]}`}>
              <Icon size={15} />
            </div>
            <p className="text-xs text-navy-500 dark:text-navy-400">{label}</p>
            <p className="text-sm font-bold text-navy-900 dark:text-white mt-1 truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Income vs Expense</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F9D6D" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0F9D6D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5484D" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E5484D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F8" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8695C2' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8695C2' }} tickFormatter={(v) => `₹${v / 1000}k`} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#0F9D6D" strokeWidth={2.5} fill="url(#aIncome)" />
                <Area type="monotone" dataKey="expenses" stroke="#E5484D" strokeWidth={2.5} fill="url(#aExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Monthly Spending</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpending} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F8" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8695C2' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8695C2' }} tickFormatter={(v) => `₹${v / 1000}k`} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="amount" fill="#3E63DD" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Category Spending</h3>
          <div className="h-64 mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {expenseBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-800 px-3.5 py-2.5 shadow-cardHover text-xs">
                        <p className="font-semibold text-navy-800 dark:text-navy-100">{d.category}</p>
                        <p className="text-navy-500 dark:text-navy-400">
                          {formatCurrency(d.value)} · {d.percent}%
                        </p>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-navy-900 dark:text-white">Savings Trend</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3E63DD" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3E63DD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F8" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8695C2' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8695C2' }} tickFormatter={(v) => `₹${v / 1000}k`} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="savings" stroke="#3E63DD" strokeWidth={2.5} fill="url(#aSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
