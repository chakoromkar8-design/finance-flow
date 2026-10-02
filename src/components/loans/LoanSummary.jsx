import { Landmark, TrendingDown, CalendarClock, Banknote } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format.js'

export default function LoanSummary({ loans }) {
  const totalLoan = loans.reduce((s, l) => s + l.principal, 0)
  const outstanding = loans.reduce((s, l) => s + l.outstanding, 0)
  const monthlyEmi = loans.reduce((s, l) => s + l.emi, 0)
  
  // Dynamically calculate the next payment date if the database didn't provide one
  const nextPayment = loans
    .filter(l => l.outstanding > 0) // Only consider loans that aren't fully paid off
    .map((l) => {
      if (l.nextPayment) return l.nextPayment;
      if (l.startDate) {
        const date = new Date(l.startDate);
        date.setMonth(date.getMonth() + 1); // Add 1 month to the start date
        return date.toISOString().split('T')[0];
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b))[0]

  const cards = [
    { label: 'Total Loan', value: formatCurrency(totalLoan), icon: Landmark },
    { label: 'Outstanding', value: formatCurrency(outstanding), icon: TrendingDown },
    { label: 'Monthly EMI', value: formatCurrency(monthlyEmi), icon: Banknote },
    // If all loans are paid off, it will show "None" instead of a dash
    { label: 'Next Payment', value: nextPayment ? formatDate(nextPayment) : 'None', icon: CalendarClock },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-navy-500 dark:text-navy-400">{label}</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
              <Icon size={16} />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-navy-900 dark:text-white tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  )
}