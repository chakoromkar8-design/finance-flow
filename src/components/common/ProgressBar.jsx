export default function ProgressBar({ value, max, status, className = '' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0

  const autoStatus =
    status ||
    (pct >= 100 ? 'exceeded' : pct >= 85 ? 'near' : pct >= 60 ? 'warning' : 'normal')

  const colors = {
    normal: 'bg-income-500',
    warning: 'bg-warn-400',
    near: 'bg-warn-500',
    exceeded: 'bg-expense-500',
  }

  return (
    <div className={`h-2 w-full rounded-full bg-navy-100 dark:bg-navy-700 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colors[autoStatus]}`}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
