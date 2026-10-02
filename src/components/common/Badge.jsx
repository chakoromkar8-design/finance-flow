const TONES = {
  neutral: 'bg-navy-100 text-navy-600 dark:bg-navy-700 dark:text-navy-200',
  income: 'bg-income-50 text-income-600 dark:bg-income-500/10 dark:text-income-400',
  expense: 'bg-expense-50 text-expense-600 dark:bg-expense-500/10 dark:text-expense-400',
  warn: 'bg-warn-50 text-warn-600 dark:bg-warn-500/10 dark:text-warn-400',
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
}

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
