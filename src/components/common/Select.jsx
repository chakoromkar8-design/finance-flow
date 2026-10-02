export default function Select({ label, id, options = [], className = '', ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-navy-700 dark:text-navy-200">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-900 px-3.5 py-2.5 text-sm text-navy-900 dark:text-navy-50 focus-ring transition-colors ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
