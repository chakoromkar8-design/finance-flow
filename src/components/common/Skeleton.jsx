export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-navy-100 dark:bg-navy-700/60 ${className}`} />
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function ChartSkeleton({ height = 'h-72' }) {
  return (
    <div className="card p-5 space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className={`w-full ${height}`} />
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-3.5 w-16" />
    </div>
  )
}
