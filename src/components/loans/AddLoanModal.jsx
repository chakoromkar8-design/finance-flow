import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext.jsx';
import { X } from 'lucide-react';

export default function AddLoanModal({ onClose }) {
  const { addLoan } = useFinance();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    principalAmount: '',
    interestRate: '',
    emiAmount: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
     const payload = {
        name: formData.name,
        principalAmount: Number(formData.principalAmount),
        outstandingAmount: Number(formData.principalAmount),
        interestRate: Number(formData.interestRate),
        emiAmount: Number(formData.emiAmount),
        startDate: formData.startDate,
      };
      
      await addLoan(payload);
      onClose();
    } catch (error) {
      console.error("Failed to add loan:", error);
      alert("Failed to save loan. Check terminal for backend errors.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-navy-700">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white">Add New Loan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Name (e.g. Car Loan)</label>
            <input required type="text" className="w-full rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 p-2.5 text-sm text-navy-900 dark:text-white"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principal Amount</label>
              <input required type="number" step="0.01" min="0" className="w-full rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 p-2.5 text-sm text-navy-900 dark:text-white"
                value={formData.principalAmount} onChange={(e) => setFormData({...formData, principalAmount: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
              <input required type="number" step="0.01" min="0" className="w-full rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 p-2.5 text-sm text-navy-900 dark:text-white"
                value={formData.interestRate} onChange={(e) => setFormData({...formData, interestRate: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly EMI</label>
              <input required type="number" step="0.01" min="0" className="w-full rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 p-2.5 text-sm text-navy-900 dark:text-white"
                value={formData.emiAmount} onChange={(e) => setFormData({...formData, emiAmount: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input required type="date" className="w-full rounded-lg border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 p-2.5 text-sm text-navy-900 dark:text-white"
                value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-navy-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-navy-700 rounded-lg hover:bg-gray-200 dark:hover:bg-navy-600">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}