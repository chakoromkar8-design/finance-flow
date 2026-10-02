import { Search } from 'lucide-react'
import { CATEGORIES } from '../../utils/categories.js'

export default function TransactionFilters({ filters, setFilters, accounts }) {
  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search transactions…"
          className="w-full rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 pl-9 pr-3.5 py-2.5 text-sm text-navy-900 dark:text-navy-50 placeholder:text-navy-400 focus-ring"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-auto">
        <select
          value={filters.type}
          onChange={(e) => update('type', e.target.value)}
          className="rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2.5 text-sm text-navy-700 dark:text-navy-200 focus-ring"
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => update('category', e.target.value)}
          className="rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2.5 text-sm text-navy-700 dark:text-navy-200 focus-ring"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.account}
          onChange={(e) => update('account', e.target.value)}
          className="rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2.5 text-sm text-navy-700 dark:text-navy-200 focus-ring"
        >
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => update('sort', e.target.value)}
          className="rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2.5 text-sm text-navy-700 dark:text-navy-200 focus-ring"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Amount: high to low</option>
          <option value="amount-asc">Amount: low to high</option>
        </select>
      </div>
    </div>
  )
}
