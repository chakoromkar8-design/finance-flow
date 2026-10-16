import { Landmark, TrendingDown, Banknote, CalendarClock } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format.js'

export default function LoanSummary({ loans }) {
  // Calculate totals for the first three cards
  const totalLoan = loans.reduce((s, l) => s + l.principal, 0)
  const outstanding = loans.reduce((s, l) => s + l.outstanding, 0)
  const monthlyEmi = loans.reduce((s, l) => s + l.emi, 0)
  
  // Extract and format the individual next payment for each active loan
  const upcomingPayments = loans
    .filter(l => l.outstanding > 0)
    .map(l => {
      let nextDate = l.nextPayment;
      // Handle missing due dates gracefully by adding 1 month to the start date
      if (!nextDate && l.startDate) {
        const date = new Date(l.startDate);
        date.setMonth(date.getMonth() + 1);
        nextDate = date.toISOString().split('T')[0];
      }
      return {
        id: l.id,
        name: l.name,
        emi: l.emi,
        date: nextDate
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by closest date

  // Define only the first 3 static metric cards
  const metricCards = [
    { label: 'Total Loan', value: formatCurrency(totalLoan), icon: Landmark },
    { label: 'Outstanding', value: formatCurrency(outstanding), icon: TrendingDown },
    { label: 'Monthly EMI', value: formatCurrency(monthlyEmi), icon: Banknote },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Render the standard metric cards */}
      {metricCards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="card p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-navy-500 dark:text-navy-400">{label}</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
              <Icon size={16} />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-navy-900 dark:text-white tabular-nums">{value}</p>
        </div>
      ))}

      {/* Render the new dynamic Next Payments list in the 4th slot */}
      <div className="card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-navy-500 dark:text-navy-400">Upcoming Payments</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <CalendarClock size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[100px] pr-1">
          {upcomingPayments.length > 0 ? (
            upcomingPayments.map(payment => (
              <div key={payment.id} className="flex justify-between items-center bg-slate-50 dark:bg-navy-900/50 p-2 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-navy-900 dark:text-white">{payment.name}</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    {payment.date ? formatDate(payment.date) : 'Date unavailable'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
                  {formatCurrency(payment.emi)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-navy-500 dark:text-navy-400">No upcoming payments</p>
          )}
        </div>
      </div>
    </div>
  )
}
