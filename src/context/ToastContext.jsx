import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
let idCounter = 0

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message, type = 'success') => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismiss(id), 3500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info
          const tone =
            t.type === 'error'
              ? 'border-expense-500/30 text-expense-600 dark:text-expense-400'
              : t.type === 'info'
                ? 'border-brand-500/30 text-brand-600 dark:text-brand-400'
                : 'border-income-500/30 text-income-600 dark:text-income-400'
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-slide-up flex items-start gap-2.5 rounded-xl border bg-white dark:bg-navy-800 shadow-cardHover px-4 py-3 ${tone}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm text-navy-800 dark:text-navy-100 flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200 focus-ring rounded"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
