const VARIANTS = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20',
  secondary:
    'bg-navy-100 text-navy-800 hover:bg-navy-200 dark:bg-navy-700 dark:text-navy-100 dark:hover:bg-navy-600',
  ghost:
    'bg-transparent text-navy-600 hover:bg-navy-100 dark:text-navy-300 dark:hover:bg-navy-800',
  danger:
    'bg-expense-500 text-white hover:bg-expense-600 shadow-sm shadow-expense-500/20',
  outline:
    'bg-transparent border border-navy-200 dark:border-navy-600 text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800',
}

const SIZES = {
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-sm px-5 py-3 gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  )
}
