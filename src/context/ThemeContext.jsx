import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function getSystemPref() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('ff-theme') || 'system')

  const resolved = mode === 'system' ? getSystemPref() : mode

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  useEffect(() => {
    localStorage.setItem('ff-theme', mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => document.documentElement.classList.toggle('dark', getSystemPref() === 'dark')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  const toggle = () => setMode(resolved === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
