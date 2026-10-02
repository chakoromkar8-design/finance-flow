export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-100 dark:bg-navy-800 text-navy-400 dark:text-navy-500">
          <Icon size={26} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-navy-800 dark:text-navy-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-navy-500 dark:text-navy-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
