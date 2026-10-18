
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  HeartPulse,
  Car,
  Home,
  UserRound,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Wallet,
} from 'lucide-react'
import {
  getInsurancePolicies,
  createInsurancePolicy,
  updateInsurancePolicy,
  deleteInsurancePolicy,
} from '../services/api'

const TYPES = [
  { value: 'HEALTH', label: 'Health Insurance' },
  { value: 'LIFE', label: 'Life Insurance' },
  { value: 'TERM', label: 'Term Insurance' },
  { value: 'VEHICLE', label: 'Vehicle Insurance' },
  { value: 'HOME', label: 'Home Insurance' },
  { value: 'TRAVEL', label: 'Travel Insurance' },
  { value: 'OTHER', label: 'Other' },
]

const FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half-yearly' },
  { value: 'YEARLY', label: 'Yearly' },
]

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const EMPTY_FORM = {
  name: '',
  type: 'HEALTH',
  provider: '',
  policyNumber: '',
  policyholder: '',
  coverageAmount: '',
  premiumAmount: '',
  frequency: 'YEARLY',
  startDate: '',
  endDate: '',
  renewalDate: '',
  status: 'ACTIVE',
  nominee: '',
  notes: '',
}

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const dateText = (value) => {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const dateInput = (value) =>
  value ? String(value).slice(0, 10) : ''

const typeLabel = (value) =>
  TYPES.find((item) => item.value === value)?.label || value || 'Other'

const statusStyle = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  EXPIRED: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const typeIcon = {
  HEALTH: HeartPulse,
  LIFE: ShieldCheck,
  TERM: ShieldCheck,
  VEHICLE: Car,
  HOME: Home,
  TRAVEL: CalendarDays,
  OTHER: FileText,
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-navy-700 dark:text-navy-200">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-white'

function PolicyModal({ policy, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(policy || {}),
    coverageAmount: policy?.coverageAmount ?? '',
    premiumAmount: policy?.premiumAmount ?? '',
    startDate: dateInput(policy?.startDate),
    endDate: dateInput(policy?.endDate),
    renewalDate: dateInput(policy?.renewalDate),
  }))
  const [error, setError] = useState('')

  const change = (event) => {
    setForm((old) => ({ ...old, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim() || !form.startDate ||
        form.coverageAmount === '' || form.premiumAmount === '') {
      setError('Please complete the policy name, start date, coverage and premium.')
      return
    }

    if (Number(form.coverageAmount) < 0 || Number(form.premiumAmount) < 0) {
      setError('Amounts cannot be negative.')
      return
    }

    if (form.endDate && form.endDate < form.startDate) {
      setError('The end date cannot be before the start date.')
      return
    }

    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        provider: form.provider.trim(),
        policyNumber: form.policyNumber.trim(),
        policyholder: form.policyholder.trim(),
        nominee: form.nominee.trim(),
        notes: form.notes.trim(),
        coverageAmount: Number(form.coverageAmount),
        premiumAmount: Number(form.premiumAmount),
        endDate: form.endDate || null,
        renewalDate: form.renewalDate || null,
      })
    } catch (err) {
      setError(err.message || 'Could not save the policy.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="insurance-modal-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-navy-950 sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 id="insurance-modal-title" className="text-xl font-bold text-navy-900 dark:text-white">
              {policy ? 'Edit insurance policy' : 'Add insurance policy'}
            </h2>
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
              Keep your policy and renewal details in one place.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-navy-800">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Policy name *">
              <input className={inputClass} name="name" value={form.name} onChange={change} placeholder="e.g. Family Health Cover" required />
            </Field>
            <Field label="Insurance type *">
              <select className={inputClass} name="type" value={form.type} onChange={change}>
                {TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Insurance provider">
              <input className={inputClass} name="provider" value={form.provider} onChange={change} placeholder="Provider name" />
            </Field>
            <Field label="Policy number">
              <input className={inputClass} name="policyNumber" value={form.policyNumber} onChange={change} placeholder="Policy reference" />
            </Field>
            <Field label="Policyholder">
              <input className={inputClass} name="policyholder" value={form.policyholder} onChange={change} placeholder="Policyholder name" />
            </Field>
            <Field label="Nominee">
              <input className={inputClass} name="nominee" value={form.nominee} onChange={change} placeholder="Nominee name" />
            </Field>
            <Field label="Coverage amount (₹) *">
              <input className={inputClass} type="number" min="0" step="0.01" name="coverageAmount" value={form.coverageAmount} onChange={change} required />
            </Field>
            <Field label="Premium amount (₹) *">
              <input className={inputClass} type="number" min="0" step="0.01" name="premiumAmount" value={form.premiumAmount} onChange={change} required />
            </Field>
            <Field label="Premium frequency *">
              <select className={inputClass} name="frequency" value={form.frequency} onChange={change}>
                {FREQUENCIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} name="status" value={form.status} onChange={change}>
                {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Start date *">
              <input className={inputClass} type="date" name="startDate" value={form.startDate} onChange={change} required />
            </Field>
            <Field label="End date">
              <input className={inputClass} type="date" name="endDate" value={form.endDate} onChange={change} />
            </Field>
            <Field label="Next renewal date">
              <input className={inputClass} type="date" name="renewalDate" value={form.renewalDate} onChange={change} />
            </Field>
            <Field label="Notes">
              <input className={inputClass} name="notes" value={form.notes} onChange={change} placeholder="Optional notes" />
            </Field>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-navy-800">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-navy-700 dark:hover:bg-navy-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
              {saving ? 'Saving…' : policy ? 'Save changes' : 'Create policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InsurancePage() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const loadPolicies = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const rows = await getInsurancePolicies()
      setPolicies(Array.isArray(rows) ? rows : [])
    } catch (error) {
      setPageError(error.message || 'Unable to load insurance policies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return policies.filter((p) => {
      const matchesType = !typeFilter || p.type === typeFilter
      const matchesStatus = !statusFilter || p.status === statusFilter
      const matchesSearch = !term || [
        p.name, p.provider, p.policyNumber, p.policyholder, p.nominee,
      ].some((value) => String(value || '').toLowerCase().includes(term))
      return matchesType && matchesStatus && matchesSearch
    })
  }, [policies, search, typeFilter, statusFilter])

  const stats = useMemo(() => {
    const active = policies.filter((p) => p.status === 'ACTIVE')
    const upcoming = active.filter((p) => {
      if (!p.renewalDate) return false
      const days = Math.ceil(
        (new Date(`${dateInput(p.renewalDate)}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000,
      )
      return days >= 0 && days <= 30
    })
    return {
      total: policies.length,
      active: active.length,
      coverage: active.reduce((sum, p) => sum + Number(p.coverageAmount || 0), 0),
      premium: active.reduce((sum, p) => {
        const amount = Number(p.premiumAmount || 0)
        const multiplier = {
          MONTHLY: 12,
          QUARTERLY: 4,
          HALF_YEARLY: 2,
          YEARLY: 1,
        }[p.frequency] || 1
        return sum + amount * multiplier
      }, 0),
      upcoming: upcoming.length,
    }
  }, [policies])

  const savePolicy = async (form) => {
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateInsurancePolicy(editing.id, form)
        setPolicies((rows) => rows.map((p) => p.id === editing.id ? updated : p))
      } else {
        const created = await createInsurancePolicy(form)
        setPolicies((rows) => [created, ...rows])
      }
      setModalOpen(false)
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const removePolicy = async (policy) => {
    if (!window.confirm(`Delete "${policy.name}"? This cannot be undone.`)) return
    setPageError('')
    try {
      await deleteInsurancePolicy(policy.id)
      setPolicies((rows) => rows.filter((p) => p.id !== policy.id))
    } catch (error) {
      setPageError(error.message || 'Unable to delete the policy.')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (policy) => {
    setEditing(policy)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400">
            <ShieldCheck size={17} /> Protection overview
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-3xl">
            Insurance
          </h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Organise your policies, track premiums and stay ahead of renewals.
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600">
          <Plus size={18} /> Add policy
        </button>
      </div>

      {pageError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="flex-1">{pageError}</div>
          <button onClick={loadPolicies} className="font-semibold underline">Retry</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-500 dark:text-navy-400">Total policies</span>
            <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><ShieldCheck size={20} /></span>
          </div>
          <p className="mt-4 text-2xl font-bold text-navy-900 dark:text-white">{stats.total}</p>
          <p className="mt-1 text-xs text-navy-500">All recorded policies</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-500 dark:text-navy-400">Active policies</span>
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={20} /></span>
          </div>
          <p className="mt-4 text-2xl font-bold text-navy-900 dark:text-white">{stats.active}</p>
          <p className="mt-1 text-xs text-navy-500">Currently marked active</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-500 dark:text-navy-400">Total coverage</span>
            <span className="rounded-xl bg-sky-50 p-2.5 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"><Wallet size={20} /></span>
          </div>
          <p className="mt-4 text-2xl font-bold text-navy-900 dark:text-white">{money(stats.coverage)}</p>
          <p className="mt-1 text-xs text-navy-500">Combined active-policy coverage</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-navy-500 dark:text-navy-400">Annualised premiums</span>
            <span className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><CalendarDays size={20} /></span>
          </div>
          <p className="mt-4 text-2xl font-bold text-navy-900 dark:text-white">{money(stats.premium)}</p>
          <p className="mt-1 text-xs text-navy-500">Estimated yearly cost of active policies</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-navy-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold text-navy-900 dark:text-white">Your policies</h2>
            <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
              {stats.upcoming} active {stats.upcoming === 1 ? 'policy renews' : 'policies renew'} within 30 days
            </p>
          </div>
          <button onClick={loadPolicies} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-navy-700 dark:hover:bg-navy-800">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-4 dark:border-navy-800 md:grid-cols-[1fr_190px_170px]">
          <div className="relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search policies, providers…" aria-label="Search policies" />
          </div>
          <select className={inputClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by insurance type">
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((n) => <div key={n} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-navy-800" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <ShieldCheck size={27} />
            </span>
            <h3 className="mt-4 font-semibold text-navy-900 dark:text-white">
              {policies.length ? 'No matching policies' : 'No insurance policies yet'}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-navy-500 dark:text-navy-400">
              {policies.length ? 'Try changing your search or filters.' : 'Add your first policy to track coverage, premiums and renewal dates.'}
            </p>
            {policies.length === 0 && (
              <button onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                <Plus size={17} /> Add your first policy
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {filtered.map((policy) => {
              const Icon = typeIcon[policy.type] || ShieldCheck
              const renewal = policy.renewalDate ? dateInput(policy.renewalDate) : ''
              const days = renewal
                ? Math.ceil((new Date(`${renewal}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
                : null
              const needsAttention = policy.status === 'ACTIVE' && days !== null && days >= 0 && days <= 30

              return (
                <article key={policy.id} className="p-4 transition hover:bg-slate-50/70 dark:hover:bg-navy-900/40 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                        <Icon size={23} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-navy-900 dark:text-white">{policy.name}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[policy.status] || statusStyle.PENDING}`}>
                            {STATUSES.find((s) => s.value === policy.status)?.label || policy.status}
                          </span>
                          {needsAttention && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                              Renewal soon
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
                          {typeLabel(policy.type)}{policy.provider ? ` · ${policy.provider}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500 dark:text-navy-400">
                          {policy.policyNumber && <span>Policy: {policy.policyNumber}</span>}
                          {policy.policyholder && <span className="inline-flex items-center gap-1"><UserRound size={12} /> {policy.policyholder}</span>}
                          {policy.nominee && <span>Nominee: {policy.nominee}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:w-[410px] lg:shrink-0">
                      <div>
                        <p className="text-xs text-navy-500 dark:text-navy-400">Coverage</p>
                        <p className="mt-1 font-semibold text-navy-900 dark:text-white">{money(policy.coverageAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-navy-500 dark:text-navy-400">Premium · {FREQUENCIES.find((f) => f.value === policy.frequency)?.label || '—'}</p>
                        <p className="mt-1 font-semibold text-navy-900 dark:text-white">{money(policy.premiumAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-navy-500 dark:text-navy-400">Next renewal</p>
                        <p className={`mt-1 inline-flex items-center gap-1 font-semibold ${needsAttention ? 'text-amber-600 dark:text-amber-400' : 'text-navy-900 dark:text-white'}`}>
                          <CalendarDays size={14} /> {dateText(policy.renewalDate)}
                        </p>
                        {needsAttention && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{days === 0 ? 'Due today' : `${days} days left`}</p>}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2 lg:pl-2">
                      <button onClick={() => openEdit(policy)} aria-label={`Edit ${policy.name}`} title="Edit policy" className="rounded-lg border border-slate-200 p-2.5 text-navy-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => removePolicy(policy)} aria-label={`Delete ${policy.name}`} title="Delete policy" className="rounded-lg border border-slate-200 p-2.5 text-rose-600 transition hover:bg-rose-50 dark:border-navy-700 dark:hover:bg-rose-500/10">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {policy.notes && <p className="mt-3 border-l-2 border-slate-200 pl-3 text-sm text-navy-500 dark:border-navy-700 dark:text-navy-400">{policy.notes}</p>}
                </article>
              )
            })}
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-navy-500 dark:border-navy-800 dark:text-navy-400">
          Showing {filtered.length} of {policies.length} {policies.length === 1 ? 'policy' : 'policies'}
        </div>
      </div>

      {modalOpen && (
        <PolicyModal
          key={editing?.id || 'new-policy'}
          policy={editing}
          saving={saving}
          onClose={() => {
            if (!saving) {
              setModalOpen(false)
              setEditing(null)
            }
          }}
          onSave={savePolicy}
        />
      )}
    </div>
  )
}
