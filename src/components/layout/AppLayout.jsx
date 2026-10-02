import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import MobileNav from './MobileNav.jsx'
import { useFinance } from '../../context/FinanceContext.jsx'
import Button from '../common/Button.jsx'
import { StatCardSkeleton, ChartSkeleton } from '../common/Skeleton.jsx'

// Shows a loading skeleton while data is fetched, and an error card with a
// Retry button if the API can't be reached. Never shows fake data.
function DataGate() {
  const { status, error, reload } = useFinance()
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <p className="text-sm text-navy-500 dark:text-navy-400">Loading your finances…</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="card p-8 max-w-md mx-auto text-center space-y-4 animate-fade-in">
        <h2 className="text-lg font-semibold text-navy-900 dark:text-white">Unable to load your data</h2>
        <p className="text-sm text-navy-500 dark:text-navy-400">{error}</p>
        <Button onClick={reload}>Try again</Button>
      </div>
    )
  }
  return <Outlet />
}

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-[1400px] w-full mx-auto">
          <DataGate />
        </main>
      </div>
    </div>
  )
}
