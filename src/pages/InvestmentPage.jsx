
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ChartCandlestick,
  ChartPie,
  CalendarDays,
  Landmark,
  Banknote,
  Boxes,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  TrendingUp,
  Wallet,
  CircleDollarSign,
  AlertCircle,
} from 'lucide-react'
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from '../services/api'

const INVESTMENTS = {
  '/investments/shares': {
    type: 'SHARES',
    title: 'Shares',
    description: 'Track your stock investments and portfolio.',
    icon: ChartCandlestick,
  },
  '/investments/mutual-funds': {
    type: 'MUTUAL_FUND',
    title: 'Mutual Funds',
    description: 'Manage your mutual fund investments.',
    icon: ChartPie,
  },
  '/investments/sip': {
    type: 'SIP',
    title: 'SIP',
    description: 'Track your systematic investment plans.',
    icon: CalendarDays,
  },
  '/investments/bonds': {
    type: 'BOND',
    title: 'Bonds',
    description: 'Manage your bond investments and maturity dates.',
    icon: Landmark,
  },
  '/investments/fd': {
    type: 'FD',
    title: 'Fixed Deposits',
    description: 'Track your fixed deposits and interest rates.',
    icon: Banknote,
  },
  '/investments/commodities': {
    type: 'COMMODITY',
    title: 'Commodities',
    description: 'Track investments such as gold and silver.',
    icon: Boxes,
  },
  '/investments/lic': {
    type: 'LIC',
    title: 'LIC',
    description: 'Manage policies and premium due dates.',
    icon: ShieldCheck,
  },
}

const EMPTY_FORM = {
  name: '',
  status: 'ACTIVE',
  institution: '',
  symbol: '',
  policyNumber: '',
  investedAmount: '',
  currentValue: '',
  quantity: '',
  purchasePrice: '',
  currentPrice: '',
  units: '',
  purchaseNav: '',
  currentNav: '',
  monthlyAmount: '',
  startDate: '',
  nextPaymentDate: '',
  interestRate: '',
  maturityDate: '',
  premiumAmount: '',
  premiumFrequency: 'MONTHLY',
  nextPremiumDate: '',
  notes: '',
}

const MONEY_FIELDS = new Set([
  'investedAmount',
  'currentValue',
  'quantity',
  'purchasePrice',
  'currentPrice',
  'units',
  'purchaseNav',
  'currentNav',
  'monthlyAmount',
  'interestRate',
  'premiumAmount',
])

const FIELD_SECTIONS = {
  SHARES: [
    ['name', 'Company / Share name', 'text', true],
    ['symbol', 'Stock symbol', 'text'],
    ['institution', 'Broker / Platform', 'text'],
    ['quantity', 'Quantity', 'number'],
    ['purchasePrice', 'Purchase price per share (₹)', 'number'],
    ['currentPrice', 'Current price per share (₹)', 'number'],
    ['investedAmount', 'Total amount invested (₹)', 'number', true],
    ['currentValue', 'Current market value (₹)', 'number', true],
    ['startDate', 'Purchase date', 'date'],
  ],
  MUTUAL_FUND: [
    ['name', 'Fund name', 'text', true],
    ['institution', 'AMC / Platform', 'text'],
    ['units', 'Units held', 'number'],
    ['purchaseNav', 'Purchase NAV (₹)', 'number'],
    ['currentNav', 'Current NAV (₹)', 'number'],
    ['investedAmount', 'Total amount invested (₹)', 'number', true],
    ['currentValue', 'Current value (₹)', 'number', true],
    ['startDate', 'Purchase date', 'date'],
  ],
  SIP: [
    ['name', 'SIP / Fund name', 'text', true],
    ['institution', 'AMC / Platform', 'text'],
    ['monthlyAmount', 'Monthly SIP amount (₹)', 'number', true],
    ['investedAmount', 'Total amount invested so far (₹)', 'number', true],
    ['currentValue', 'Current value (₹)', 'number', true],
    ['startDate', 'SIP start date', 'date'],
    ['nextPaymentDate', 'Next payment date', 'date'],
  ],
  BOND: [
    ['name', 'Bond name', 'text', true],
    ['institution', 'Issuer', 'text'],
    ['investedAmount', 'Amount invested (₹)', 'number', true],
    ['currentValue', 'Current value (₹)', 'number', true],
    ['interestRate', 'Interest rate (%)', 'number'],
    ['startDate', 'Purchase date', 'date'],
    ['maturityDate', 'Maturity date', 'date'],
  ],
  FD: [
    ['name', 'FD name', 'text', true],
    ['institution', 'Bank / Institution', 'text'],
    ['investedAmount', 'Principal amount (₹)', 'number', true],
    ['currentValue', 'Current value (₹)', 'number', true],
    ['interestRate', 'Interest rate (%)', 'number'],
    ['startDate', 'Deposit date', 'date'],
    ['maturityDate', 'Maturity date', 'date'],
  ],
  COMMODITY: [
    ['name', 'Commodity name', 'text', true],
    ['institution', 'Broker / Platform', 'text'],
    ['quantity', 'Quantity held', 'number'],
    ['purchasePrice', 'Purchase price per unit (₹)', 'number'],
    ['currentPrice', 'Current price per unit (₹)', 'number'],
    ['investedAmount', 'Total amount invested (₹)', 'number', true],
    ['currentValue', 'Current market value (₹)', 'number', true],
    ['startDate', 'Purchase date', 'date'],
  ],
  LIC: [
    ['name', 'Policy name', 'text', true],
    ['institution', 'Insurance provider', 'text'],
    ['policyNumber', 'Policy number', 'text'],
    ['investedAmount', 'Total premiums paid (₹)', 'number', true],
    ['currentValue', 'Current policy value (₹)', 'number', true],
    ['premiumAmount', 'Premium amount (₹)', 'number', true],
    ['premiumFrequency', 'Premium frequency', 'select'],
    ['startDate', 'Policy start date', 'date'],
    ['nextPremiumDate', 'Next premium due date', 'date'],
    ['maturityDate', 'Policy maturity date', 'date'],
  ],
}

const CURRENCY = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

function money(value) {
  return CURRENCY.format(Number(value) || 0)
}

function numeric(value) {
  if (value === '' || value == null) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function dateValue(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function investmentToForm(item) {
  const form = { ...EMPTY_FORM }

  for (const key of Object.keys(form)) {
    if (item[key] != null) {
      form[key] = key === 'startDate' ||
        key === 'nextPaymentDate' ||
        key === 'maturityDate' ||
        key === 'nextPremiumDate'
        ? dateValue(item[key])
        : String(item[key])
    }
  }

  return form
}

function formToPayload(form, type) {
  const payload = { type }

  for (const [key, value] of Object.entries(form)) {
    if (key === 'type') continue

    if (MONEY_FIELDS.has(key)) {
      const parsed = numeric(value)
      if (parsed !== undefined) payload[key] = parsed
    } else if (key === 'startDate' ||
      key === 'nextPaymentDate' ||
      key === 'maturityDate' ||
      key === 'nextPremiumDate') {
      payload[key] = value || null
    } else {
      payload[key] = value.trim()
    }
  }

  return payload
}

function Field({ field, form, onChange }) {
  const [key, label, kind, required] = field
  const common = {
    id: key,
    name: key,
    value: form[key] ?? '',
    onChange: (event) => onChange(key, event.target.value),
    required: Boolean(required),
    className:
      'mt-1.5 w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-navy-700 dark:bg-navy-900 dark:text-white',
  }

  return (
    <div>
      <label
        htmlFor={key}
        className="text-sm font-medium text-navy-700 dark:text-navy-200"
      >
        {label}{required ? ' *' : ''}
      </label>

      {kind === 'select' ? (
        <select {...common}>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">Quarterly</option>
          <option value="HALF_YEARLY">Half-yearly</option>
          <option value="YEARLY">Yearly</option>
        </select>
      ) : (
        <input
          {...common}
          type={kind}
          min={kind === 'number' ? 0 : undefined}
          step={kind === 'number' ? 'any' : undefined}
          placeholder={
            kind === 'number' ? 'Enter amount' :
            kind === 'date' ? undefined : `Enter ${label.toLowerCase()}`
          }
        />
      )}
    </div>
  )
}

export default function InvestmentPage() {
  const { pathname } = useLocation()
  const investment = INVESTMENTS[pathname]
  const type = investment?.type
  const Icon = investment?.icon

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const fields = FIELD_SECTIONS[type] || []

  const loadItems = useCallback(async () => {
    if (!type) return

    setLoading(true)
    setError('')

    try {
      const data = await getInvestments(type)
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load investments.')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const totals = useMemo(() => {
    return items.reduce(
      (result, item) => {
        result.invested += Number(item.investedAmount) || 0
        result.current += Number(item.currentValue) || 0
        return result
      },
      { invested: 0, current: 0 },
    )
  }, [items])

  const profit = totals.current - totals.invested
  const profitPercent = totals.invested
    ? (profit / totals.invested) * 100
    : 0

  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setError('')
    setNotice('')
    setFormOpen(true)
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm(investmentToForm(item))
    setError('')
    setNotice('')
    setFormOpen(true)
  }

  function changeField(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    const payload = formToPayload(form, type)

    try {
      if (editingId) {
        await updateInvestment(editingId, payload)
        setNotice('Investment updated successfully.')
      } else {
        await createInvestment(payload)
        setNotice('Investment added successfully.')
      }

      setFormOpen(false)
      setEditingId(null)
      setForm({ ...EMPTY_FORM })
      await loadItems()
    } catch (err) {
      setError(err.message || 'Unable to save this investment.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete "${item.name}" from your ${investment.title} portfolio?`,
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await deleteInvestment(item.id)
      setItems((previous) =>
        previous.filter((record) => record.id !== item.id),
      )
      setNotice('Investment deleted successfully.')
    } catch (err) {
      setError(err.message || 'Unable to delete this investment.')
    }
  }

  if (!investment) {
    return <div className="p-6">Investment page not found.</div>
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
            <Icon size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
              {investment.title}
            </h1>
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
              {investment.description}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadItems}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy-200 px-3 py-2.5 text-sm font-medium text-navy-700 transition hover:bg-navy-50 disabled:opacity-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-800"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            <Plus size={17} />
            Add Investment
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && !error && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total investments"
          value={String(items.length)}
          subtitle={`Active ${investment.title.toLowerCase()} records`}
          icon={Wallet}
        />

        <SummaryCard
          title="Amount invested"
          value={money(totals.invested)}
          subtitle="Total purchase contributions"
          icon={CircleDollarSign}
        />

        <SummaryCard
          title="Current value"
          value={money(totals.current)}
          subtitle="Based on your entered values"
          icon={Banknote}
        />

        <SummaryCard
          title="Profit / Loss"
          value={money(profit)}
          subtitle={
            totals.invested
              ? `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}% overall`
              : 'Add an investment to calculate'
          }
          icon={TrendingUp}
          positive={profit >= 0}
        />
      </div>

      {formOpen && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-navy-100 p-5 dark:border-navy-800">
            <div>
              <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
                {editingId ? 'Edit investment' : 'Add investment'}
              </h2>
              <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
                Enter the details below. Fields marked * are required.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Close form"
              className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-100 dark:hover:bg-navy-800"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {fields.map((field) => (
                <Field
                  key={field[0]}
                  field={field}
                  form={form}
                  onChange={changeField}
                />
              ))}

              <div>
                <label
                  htmlFor="status"
                  className="text-sm font-medium text-navy-700 dark:text-navy-200"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    changeField('status', event.target.value)
                  }
                  className="mt-1.5 w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="MATURED">Matured</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="text-sm font-medium text-navy-700 dark:text-navy-200"
              >
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(event) => changeField('notes', event.target.value)}
                placeholder="Add any useful details..."
                className="mt-1.5 w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-brand-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2 border-t border-navy-100 pt-4 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Save investment'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-navy-100 p-5 dark:border-navy-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy-900 dark:text-white">
              Your portfolio
            </h2>
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
              {items.length} {items.length === 1 ? 'record' : 'records'} saved
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-navy-500 dark:text-navy-400">
            <RefreshCw size={18} className="animate-spin" />
            Loading investments...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
              <Icon size={27} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-navy-900 dark:text-white">
              No {investment.title.toLowerCase()} yet
            </h3>
            <p className="mt-2 max-w-md text-sm text-navy-500 dark:text-navy-400">
              Add your first record to start tracking your investment amount,
              current value and returns.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <Plus size={17} />
              Add your first investment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-navy-50 text-xs uppercase tracking-wide text-navy-500 dark:bg-navy-900/70 dark:text-navy-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Investment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Invested</th>
                  <th className="px-5 py-3 text-right font-semibold">Current value</th>
                  <th className="px-5 py-3 text-right font-semibold">Profit / Loss</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
                {items.map((item) => {
                  const invested = Number(item.investedAmount) || 0
                  const current = Number(item.currentValue) || 0
                  const change = current - invested

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-navy-50/70 dark:hover:bg-navy-900/40"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-navy-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                          {item.symbol || item.institution || item.policyNumber || '—'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {item.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-navy-700 dark:text-navy-200">
                        {money(invested)}
                      </td>

                      <td className="px-5 py-4 text-right font-medium text-navy-900 dark:text-white">
                        {money(current)}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          change >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {change > 0 ? '+' : ''}{money(change)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label={`Edit ${item.name}`}
                            className="rounded-lg p-2 text-navy-500 transition hover:bg-brand-500/10 hover:text-brand-500"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            aria-label={`Delete ${item.name}`}
                            className="rounded-lg p-2 text-navy-500 transition hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ title, value, subtitle, icon: Icon, positive }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy-500 dark:text-navy-400">
            {title}
          </p>
          <p className="mt-2 break-words text-xl font-bold text-navy-900 dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            positive === false
              ? 'bg-red-500/10 text-red-500'
              : 'bg-brand-500/10 text-brand-500'
          }`}
        >
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-xs text-navy-500 dark:text-navy-400">
        {subtitle}
      </p>
    </div>
  )
}

