import { useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Input from '../components/common/Input.jsx'
import Select from '../components/common/Select.jsx'
import Button from '../components/common/Button.jsx'

function SettingsSection({ title, description, children }) {
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-navy-900 dark:text-white">{title}</h3>
      {description && <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-navy-700 dark:text-navy-200">{label}</p>
        {description && <p className="text-xs text-navy-400 dark:text-navy-500">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-ring ${
          checked ? 'bg-brand-500' : 'bg-navy-200 dark:bg-navy-600'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

export default function Settings() {
  const { mode, setMode } = useTheme()
  const { notify } = useToast()

  const [profile, setProfile] = useState({ name: 'Darshil', email: 'darshil@example.com', phone: '+91 98765 43210' })
  const [prefs, setPrefs] = useState({ currency: 'INR (₹)', dateFormat: 'DD MMM YYYY' })
  const [notifs, setNotifs] = useState({ email: true, budgetAlerts: true, paymentReminders: false })

  const saveSection = (name) => {
    notify(`${name} saved successfully.`, 'success')
  }

  const THEMES = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white">Settings</h2>
        <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">Manage your profile and preferences.</p>
      </div>

      <SettingsSection title="Profile" description="This is demo information — no account is created yet.">
        <Input label="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        <Input
          label="Email"
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
        />
        <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        <Button size="sm" onClick={() => saveSection('Profile')}>
          Save Profile
        </Button>
      </SettingsSection>

      <SettingsSection title="Preferences">
        <Select
          label="Currency"
          options={['INR (₹)', 'USD ($)', 'EUR (€)']}
          value={prefs.currency}
          onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
        />
        <Select
          label="Date Format"
          options={['DD MMM YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']}
          value={prefs.dateFormat}
          onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
        />
        <Button size="sm" onClick={() => saveSection('Preferences')}>
          Save Preferences
        </Button>
      </SettingsSection>

      <SettingsSection title="Appearance" description="Choose how FinanceFlow looks on your device.">
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-sm font-medium transition-colors focus-ring ${
                mode === value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'border-navy-200 dark:border-navy-600 text-navy-500 dark:text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <Toggle
          label="Email notifications"
          description="Get a weekly summary of your finances."
          checked={notifs.email}
          onChange={(v) => setNotifs({ ...notifs, email: v })}
        />
        <Toggle
          label="Budget alerts"
          description="Notify me when I'm close to a budget limit."
          checked={notifs.budgetAlerts}
          onChange={(v) => setNotifs({ ...notifs, budgetAlerts: v })}
        />
        <Toggle
          label="Payment reminders"
          description="Remind me before an EMI is due."
          checked={notifs.paymentReminders}
          onChange={(v) => setNotifs({ ...notifs, paymentReminders: v })}
        />
        <Button size="sm" onClick={() => saveSection('Notification settings')}>
          Save Notifications
        </Button>
      </SettingsSection>
    </div>
  )
}
