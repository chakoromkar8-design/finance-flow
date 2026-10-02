import { useState } from 'react';
import { useFinance } from '../context/FinanceContext.jsx';
import { Banknote, Plus } from 'lucide-react';
import EmptyState from '../components/common/EmptyState.jsx';
import LoanSummary from '../components/loans/LoanSummary.jsx';
import LoanCard from '../components/loans/LoanCard.jsx';
// We will uncomment this import once we confirm the modal file exists
 import AddLoanModal from '../components/loans/AddLoanModal.jsx';

export default function Loans() {
  const { loans } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section updated to be a flex container with the Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">Loans & EMIs</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">Keep track of what you owe and when it's due.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Loan
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Banknote}
            title="No loans on record"
            description="Loans and EMIs you add will show up here with payoff progress."
          />
        </div>
      ) : (
        <>
          <LoanSummary loans={loans} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loans.map((l) => (
              <LoanCard key={l.id} loan={l} />
            ))}
          </div>
        </>
      )}

      {
        isModalOpen && <AddLoanModal onClose={() => setIsModalOpen(false)} />
      }
    </div>
  );
}
