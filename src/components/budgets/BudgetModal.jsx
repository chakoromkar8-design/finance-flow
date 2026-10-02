import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Button from '../common/Button.jsx'
import { CATEGORIES } from '../../utils/categories.js'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const EMPTY = { category: CATEGORIES[0], limit: '' }

export default function BudgetModal({ open, onClose }) {
  const { addBudget } = useFinance()
  const { notify } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.limit || Number(form.limit) <= 0) {
      setError('Enter a valid budget amount')
      return
    }
    addBudget({ category: form.category, limit: Number(form.limit) })
    notify('Budget created successfully.', 'success')
    setForm(EMPTY)
    setError('')
    onClose()
  }

  const close = () => {
    setForm(EMPTY)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title="Create Budget" size="sm">
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
          placeholder="e.g. 5000"
          value={form.limit}
          onChange={(e) => update('limit', e.target.value)}
          error={error}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Create Budget
          </Button>
        </div>
      </form>
    </Modal>
  )
}
