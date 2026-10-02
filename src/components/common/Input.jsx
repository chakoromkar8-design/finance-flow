export default function Input({ label, id, error, className = '', ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-navy-700 dark:text-navy-200">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white dark:bg-navy-900 px-3.5 py-2.5 text-sm text-navy-900 dark:text-navy-50 placeholder:text-navy-400 focus-ring transition-colors ${
          error ? 'border-expense-400' : 'border-navy-200 dark:border-navy-600'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-expense-500">{error}</p>}
    </div>
  )
}
