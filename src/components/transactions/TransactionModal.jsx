import { useEffect, useState } from 'react'
import Modal from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Button from '../common/Button.jsx'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories.js'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const today = () => new Date().toISOString().slice(0, 10)
const blank = () => ({ type: 'expense', name: '', amount: '', category: 'Food', accountId: '', date: today(), notes: '' })

// Add a transaction, or edit one when `transaction` is passed.
export default function TransactionModal({ open, onClose, transaction }) {
  const { accounts, addTransaction, updateTransaction } = useFinance()
  const { notify } = useToast()
  const editing = Boolean(transaction)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Fill the form each time the modal opens.
  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      transaction
        ? {
            type: transaction.type,
            name: transaction.name,
            amount: String(transaction.amount),
            category: transaction.category,
            accountId: transaction.accountId,
            date: transaction.date,
            notes: transaction.notes || '',
          }
        : { ...blank(), accountId: accounts.length === 1 ? accounts[0].id : '' },
    )
  }, [open, transaction, accounts])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const setType = (type) => {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    setForm((prev) => ({ ...prev, type, category: list.includes(prev.category) ? prev.category : list[0] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Description is required'
    if (!form.amount || !(Number(form.amount) > 0)) next.amount = 'Please enter a valid amount'
    if (!form.accountId) next.accountId = 'Select an account'
    if (!form.date) next.date = 'Pick a date'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    const payload = { ...form, name: form.name.trim(), amount: Number(form.amount) }
    setSaving(true)
    try {
      if (editing) await updateTransaction(transaction.id, payload)
      else await addTransaction(payload)
      notify(editing ? 'Transaction updated successfully.' : 'Transaction added successfully.', 'success')
      onClose()
    } catch (err) {
      // Server field names -> form field names
      const f = err.fields || {}
      setErrors({ name: f.description, amount: f.amount, accountId: f.accountId, date: f.date, category: f.category })
      notify(err.message || 'Unable to save the transaction.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-navy-100 dark:bg-navy-900 p-1">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg py-2 text-sm font-medium capitalize transition-colors focus-ring ${
                form.type === t ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white shadow-sm' : 'text-navy-500 dark:text-navy-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <Input label="Description" placeholder="e.g. Grocery shopping" value={form.name} onChange={(e) => update('name', e.target.value)} error={errors.name} maxLength={120} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Amount (₹)" type="number" min="0" step="0.01" placeholder="0" value={form.amount} onChange={(e) => update('amount', e.target.value)} error={errors.amount} />
          <Input label="Date" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} error={errors.date} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" options={categories} value={form.category} onChange={(e) => update('category', e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tx-account" className="text-sm font-medium text-navy-700 dark:text-navy-200">
              Account
            </label>
            <select
              id="tx-account"
              value={form.accountId}
              onChange={(e) => update('accountId', e.target.value)}
              className={`w-full rounded-xl border bg-white dark:bg-navy-900 px-3.5 py-2.5 text-sm text-navy-900 dark:text-navy-50 focus-ring ${
                errors.accountId ? 'border-expense-400' : 'border-navy-200 dark:border-navy-600'
              }`}
            >
              <option value="">{accounts.length ? 'Select account' : 'Add an account first'}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            {errors.accountId && <p className="text-xs text-expense-500">{errors.accountId}</p>}
          </div>
        </div>

        <Input label="Notes (optional)" placeholder="Add a note…" value={form.notes} onChange={(e) => update('notes', e.target.value)} maxLength={500} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
