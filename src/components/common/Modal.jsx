import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${widths[size]} bg-white dark:bg-navy-800 rounded-t-2xl sm:rounded-2xl shadow-cardHover animate-slide-up max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100 dark:border-navy-700 sticky top-0 bg-white dark:bg-navy-800 rounded-t-2xl">
          <h2 className="text-base font-semibold text-navy-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-navy-400 hover:text-navy-700 dark:hover:text-navy-200 rounded-lg p-1 focus-ring"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
