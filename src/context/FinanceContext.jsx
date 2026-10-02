import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../services/api.js'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'

const FinanceContext = createContext(null)

const EMPTY = { accounts: [], transactions: [], budgets: [], goals: [], loans: [], summary: null, analytics: null }

// Holds everything loaded from the API. The database is the source of truth:
// after every change we ask the server for fresh numbers (balances, budget
// "spent", dashboard totals, charts) instead of recalculating them in the browser.
export function FinanceProvider({ children }) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [data, setData] = useState(EMPTY)
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState('')
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setStatus('loading')
    setError('')
    try {
      const fresh = await api.fetchFinanceData()
      if (id !== requestId.current) return
      setData(fresh)
      setStatus('ready')
    } catch (err) {
      if (id !== requestId.current) return
      setError(err.message || 'Unable to load your data.')
      setStatus('error')
    }
  }, [])

  // Quiet refresh after a change. No spinner; the page keeps showing its data.
  const refresh = useCallback(async () => {
    const id = ++requestId.current
    try {
      const fresh = await api.fetchFinanceData()
      if (id === requestId.current) setData(fresh)
    } catch {
      if (id === requestId.current) notify('Saved, but we could not refresh your data. Please reload the page.', 'error')
    }
  }, [notify])

  useEffect(() => {
    if (user) load()
    else {
      requestId.current += 1
      setData(EMPTY) // never keep one user's data around after logout
      setStatus('idle')
    }
  }, [user, load])

  // Runs an API call, then refreshes. Errors are thrown so the calling form can show them.
  const mutate = useCallback(
    async (fn) => {
      const result = await fn()
      await refresh()
      return result
    },
    [refresh],
  )

  const actions = useMemo(
    () => ({
      addTransaction: (tx) => mutate(() => api.createTransaction(tx)),
      updateTransaction: (id, tx) => mutate(() => api.updateTransaction(id, tx)),
      deleteTransaction: (id) => mutate(() => api.deleteTransaction(id)),
      addAccount: (a) => mutate(() => api.createAccount(a)),
      updateAccount: (id, a) => mutate(() => api.updateAccount(id, a)),
      deleteAccount: (id, opts) => mutate(() => api.deleteAccount(id, opts)),
      addBudget: (b) => mutate(() => api.createBudget(b)),
      updateBudget: (id, b) => mutate(() => api.updateBudget(id, b)),
      deleteBudget: (id) => mutate(() => api.deleteBudget(id)),
      addGoal: (g) => mutate(() => api.createGoal(g)),
      updateGoal: (id, g) => mutate(() => api.updateGoal(id, g)),
      deleteGoal: (id) => mutate(() => api.deleteGoal(id)),
      addLoan: (l) => mutate(() => api.createLoan(l)),
      updateLoan: (id, l) => mutate(() => api.updateLoan(id, l)),
      deleteLoan: (id) => mutate(() => api.deleteLoan(id)),
      payNextEmi: (loan) => mutate(() => api.payNextEmi(loan)),
    }),
    [mutate],
  )

  const totals = useMemo(() => {
    const t = data.summary?.totals
    return {
      totalBalance: t?.balance ?? 0,
      totalIncome: t?.income ?? 0,
      totalExpenses: t?.expenses ?? 0,
      totalSavings: t?.savings ?? 0,
      savingsRate: t?.savingsRate ?? 0,
    }
  }, [data.summary])

  const value = { ...data, ...actions, totals, status, error, loading: status === 'loading' || status === 'idle', reload: load, refresh }
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
