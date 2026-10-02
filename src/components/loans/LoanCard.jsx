import { useFinance } from '../../context/FinanceContext.jsx';
import { Banknote } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format.js'
import ProgressBar from '../common/ProgressBar.jsx'

export default function LoanCard({ loan }) {
  const { updateLoan } = useFinance();

  const handlePayEmi = async () => {
    // Prevents the balance from dropping below zero
    const newOutstanding = Math.max(0, loan.outstanding - loan.emi);
    await updateLoan(loan.id, { ...loan, outstandingAmount: newOutstanding });
  };

  // Convert to pure numbers to prevent Math and ProgressBar crashes
  const principal = Number(loan.principal) || 0;
  const outstanding = Number(loan.outstanding) || 0;
  
  // Calculate the correct percentage 
  const paidPct = principal > 0 ? Math.round(((principal - outstanding) / principal) * 100) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-300">
          <Banknote size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-800 dark:text-navy-100">{loan.name}</p>
          <p className="text-xs text-navy-400 dark:text-navy-500">{loan.interestRate}% interest rate</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-navy-400 dark:text-navy-500">Principal</p>
          <p className="text-sm font-semibold text-navy-800 dark:text-navy-100 mt-0.5">
            {formatCurrency(loan.principal)}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy-400 dark:text-navy-500">Outstanding</p>
          <p className="text-sm font-semibold text-navy-800 dark:text-navy-100 mt-0.5">
            {formatCurrency(loan.outstanding)}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy-400 dark:text-navy-500">Monthly EMI</p>
          <p className="text-sm font-semibold text-navy-800 dark:text-navy-100 mt-0.5">
            {formatCurrency(loan.emi)}
          </p>
        </div>
        <div className="flex flex-col items-start">
          <p className="text-xs text-navy-400 dark:text-navy-500"></p>
          
          {/* Only render the date if it actually exists, hiding the dash */}
          {loan.nextPayment && (
            <p className="text-sm font-semibold text-navy-800 dark:text-navy-100 mt-0.5">
              {formatDate(loan.nextPayment)}
            </p>
          )}

          <button 
           onClick={handlePayEmi}
           className="mt-2 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors"
           >
           Pay EMI 
          </button>
        </div>
      </div>

      <ProgressBar value={principal - outstanding} max={principal} status="normal" />
      <p className="text-xs text-navy-400 dark:text-navy-500 mt-1.5">{paidPct}% paid</p>
    </div>
  )
}