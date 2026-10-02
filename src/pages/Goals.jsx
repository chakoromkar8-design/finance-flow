import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import GoalCard from '../components/goals/GoalCard.jsx'
import GoalModal from '../components/goals/GoalModal.jsx'

export default function Goals() {
  const { goals } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">Savings Goals</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Track progress toward what matters to you.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Target}
            title="No savings goals yet"
            description="Create a goal to start putting money aside with purpose."
            action={<Button icon={Plus} onClick={() => setModalOpen(true)}>New Goal</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}

      <GoalModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
