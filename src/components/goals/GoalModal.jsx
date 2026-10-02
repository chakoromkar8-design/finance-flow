import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Button from '../common/Button.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const EMPTY = { name: '', target: '', targetDate: '', monthlyContribution: '' }

export default function GoalModal({ open, onClose }) {
  const { addGoal } = useFinance()
  const { notify } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.target || Number(form.target) <= 0) {
      setError('Enter a goal name and a valid target amount')
      return
    }
    addGoal({
      name: form.name.trim(),
      target: Number(form.target),
      targetDate: form.targetDate || new Date().toISOString().slice(0, 10),
      monthlyContribution: Number(form.monthlyContribution) || 0,
    })
    notify('Goal created successfully.', 'success')
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
    <Modal open={open} onClose={close} title="New Savings Goal" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal Name"
          placeholder="e.g. New Laptop"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={error}
        />
        <Input
          label="Target Amount (₹)"
          type="number"
          placeholder="e.g. 60000"
          value={form.target}
          onChange={(e) => update('target', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Target Date"
            type="date"
            value={form.targetDate}
            onChange={(e) => update('targetDate', e.target.value)}
          />
          <Input
            label="Monthly Contribution (₹)"
            type="number"
            placeholder="e.g. 5000"
            value={form.monthlyContribution}
            onChange={(e) => update('monthlyContribution', e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Create Goal
          </Button>
        </div>
      </form>
    </Modal>
  )
}
