import { useState } from 'react'
import { Plus, Landmark } from 'lucide-react'
import { useFinance } from '../context/FinanceContext.jsx'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import AccountCard from '../components/accounts/AccountCard.jsx'
import AccountModal from '../components/accounts/AccountModal.jsx'

export default function Accounts() {
  const { accounts } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">Your Accounts</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            All your banks, wallets, and cards in one place.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            description="Add a bank account, wallet, or card to start tracking balances."
            action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add Account</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
      )}

      <AccountModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
