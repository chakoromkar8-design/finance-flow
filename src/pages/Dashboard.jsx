import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import CashFlowChart from '../components/dashboard/CashFlowChart.jsx'
import ExpenseChart from '../components/dashboard/ExpenseChart.jsx'
import RecentTransactions from '../components/dashboard/RecentTransactions.jsx'
import BudgetOverview from '../components/dashboard/BudgetOverview.jsx'
import SavingsGoals from '../components/dashboard/SavingsGoals.jsx'

export default function Dashboard() {
  const { totals, summary } = useFinance()
  const savingsPct = Math.round(totals.savingsRate)
  const changes = summary?.changes ?? {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">Good morning 👋</h2>
        <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">Here's your financial overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Balance" value={totals.totalBalance} icon={Wallet} tone="navy" sub="across all accounts" />
        <StatCard title="Total Income" value={totals.totalIncome} changePct={changes.income ?? undefined} icon={TrendingUp} tone="income" />
        <StatCard title="Total Expenses" value={totals.totalExpenses} changePct={changes.expenses ?? undefined} icon={TrendingDown} tone="expense" />
        <StatCard
          title="Total Savings"
          value={totals.totalSavings}
          icon={PiggyBank}
          tone="brand"
          sub={`${savingsPct}% savings rate`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CashFlowChart />
        </div>
        <ExpenseChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentTransactions />
        </div>
        <div className="space-y-6">
          <BudgetOverview />
        </div>
      </div>

      <SavingsGoals />
    </div>
  )
}
