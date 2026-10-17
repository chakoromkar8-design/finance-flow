
import { useEffect, useState } from 'react'
import Modal from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Button from '../common/Button.jsx'
import { CATEGORIES } from '../../utils/categories.js'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const EMPTY = { category: CATEGORIES[0], limit: '' }

export default function BudgetModal({ open, onClose, budget = null }) {
  const { addBudget, updateBudget } = useFinance()
  const { notify } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const editing = Boolean(budget)

  useEffect(() => {
    if (open) {
      setForm(
        budget
          ? { category: budget.category, limit: String(budget.limit) }
          : EMPTY,
      )
      setError('')
    }
  }, [open, budget])

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.limit || !Number.isFinite(Number(form.limit)) || Number(form.limit) <= 0) {
      setError('Enter a valid budget amount')
      return
    }

    setSaving(true)
    setError('')

    try {
      const values = {
        category: form.category,
        limit: Number(form.limit),
      }

      if (editing) {
        await updateBudget(budget.id, values)
        notify('Budget updated successfully.', 'success')
      } else {
        await addBudget(values)
        notify('Budget created successfully.', 'success')
      }

      onClose()
    } catch (err) {
      setError(err.message || 'Could not save the budget.')
    } finally {
      setSaving(false)
    }
  }

  const close = () => {
    setError('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? 'Edit Budget' : 'Create Budget'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Category"
          options={CATEGORIES}
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
        />

        <Input
          label="Monthly Limit (₹)"
          type="number"
          min="1"
          step="0.01"
          placeholder="e.g. 5000"
          value={form.limit}
          onChange={(e) => update('limit', e.target.value)}
          error={error}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={close}
          >
            Cancel
          </Button>

          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
