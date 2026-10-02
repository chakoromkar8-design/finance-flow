import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import Button from '../common/Button.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const TYPES = ['Savings Account', 'Current Account', 'Cash Wallet', 'Credit Card']
const ICON_BY_TYPE = {
  'Savings Account': 'landmark',
  'Current Account': 'landmark',
  'Cash Wallet': 'wallet',
  'Credit Card': 'credit-card',
}

const EMPTY = { name: '', type: TYPES[0], balance: '' }

export default function AccountModal({ open, onClose }) {
  const { addAccount } = useFinance()
  const { notify } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Account name is required')
      return
    }
    addAccount({
      name: form.name.trim(),
      type: form.type,
      balance: Number(form.balance) || 0,
      icon: ICON_BY_TYPE[form.type],
    })
    notify('Account added successfully.', 'success')
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
    <Modal open={open} onClose={close} title="Add Account" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Account Name"
          placeholder="e.g. SBI Bank"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          error={error}
        />
        <Select label="Account Type" options={TYPES} value={form.type} onChange={(e) => update('type', e.target.value)} />
        <Input
          label="Opening Balance (₹)"
          type="number"
          placeholder="0"
          value={form.balance}
          onChange={(e) => update('balance', e.target.value)}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Add Account
          </Button>
        </div>
      </form>
    </Modal>
  )
}
