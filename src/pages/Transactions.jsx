import { useMemo, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Button from '../components/common/Button.jsx'
import TransactionFilters from '../components/transactions/TransactionFilters.jsx'
import TransactionTable from '../components/transactions/TransactionTable.jsx'
import TransactionModal from '../components/transactions/TransactionModal.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'

const PAGE_SIZE = 6

export default function Transactions() {
  const { transactions, accounts, deleteTransaction } = useFinance()
  const { notify } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    account: 'all',
    sort: 'date-desc',
  })

  const filtered = useMemo(() => {
    let list = transactions.filter((tx) => {
      if (filters.search && !tx.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      if (filters.type !== 'all' && tx.type !== filters.type) return false
      if (filters.category !== 'all' && tx.category !== filters.category) return false
      if (filters.account !== 'all' && tx.accountId !== filters.account) return false
      return true
    })

    const [key, dir] = filters.sort.split('-')
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (key === 'date') cmp = new Date(a.date) - new Date(b.date)
      if (key === 'amount') cmp = a.amount - b.amount
      return dir === 'asc' ? cmp : -cmp
    })

    return list
  }, [transactions, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilters = (updater) => {
    setPage(1)
    setFilters(updater)
  }

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (tx) => {
    setEditing(tx)
    setModalOpen(true)
  }
  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteTransaction(toDelete.id)
      notify('Transaction deleted successfully.', 'success')
      setToDelete(null)
    } catch (err) {
      notify(err.message || 'Unable to delete the transaction.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">Transactions</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Track every rupee coming in and going out.
          </p>
        </div>
        <Button icon={Plus} onClick={openAdd}>
          Add Transaction
        </Button>
      </div>

      <div className="card p-5 sm:p-6 space-y-5">
        <TransactionFilters filters={filters} setFilters={handleFilters} accounts={accounts} />
        <TransactionTable transactions={paginated} onDelete={setToDelete} onEdit={openEdit} />

        {filtered.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-navy-100 dark:border-navy-700/60 text-sm">
            <p className="text-navy-500 dark:text-navy-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-navy-200 dark:border-navy-600 text-navy-500 dark:text-navy-300 disabled:opacity-40 focus-ring"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-navy-600 dark:text-navy-300 text-xs px-1">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-navy-200 dark:border-navy-600 text-navy-500 dark:text-navy-300 disabled:opacity-40 focus-ring"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} transaction={editing} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete transaction?"
        message={toDelete ? `“${toDelete.name}” will be removed and your balances and charts will update.` : ''}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
