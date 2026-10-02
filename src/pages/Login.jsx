import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, ShieldCheck, PieChart } from 'lucide-react'
import Input from '../components/common/Input.jsx'
import Button from '../components/common/Button.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(form.email, form.password)
      notify('Signed in successfully — welcome back!', 'success')
      navigate('/')
    } catch (err) {
      setError(err.message)
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-navy-950">
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-income-500/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
            <Wallet size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">FinanceFlow</span>
        </div>

        <div className="relative space-y-8 max-w-md">
          <h1 className="text-3xl font-bold leading-tight">Take control of your money.</h1>
          <p className="text-navy-300 text-sm leading-relaxed">
            Track income, expenses, budgets, and savings goals — all in one clean dashboard built for how you
            actually manage money.
          </p>
          <div className="space-y-4">
            {[
              { icon: TrendingUp, text: 'Real-time cash flow insights' },
              { icon: PieChart, text: 'Automatic spending breakdowns' },
              { icon: ShieldCheck, text: 'Your data stays on your device' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <Icon size={16} />
                </div>
                <span className="text-sm text-navy-200">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-navy-400">© 2026 FinanceFlow. Demo product for a college project.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Wallet size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-navy-900 dark:text-white">FinanceFlow</span>
          </div>

          <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Welcome back</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1.5 mb-8">
            Sign in to view your financial dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-navy-600 dark:text-navy-300">
                <input type="checkbox" className="rounded border-navy-300 text-brand-500 focus-ring" />
                Remember me
              </label>
              <a href="#forgot" className="text-brand-600 dark:text-brand-400 font-medium hover:underline focus-ring rounded">
                Forgot password?
              </a>
            </div>

            {error && <p className="text-sm text-expense-600 dark:text-expense-400">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-sm text-navy-500 dark:text-navy-400 mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline focus-ring rounded">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
