'use client'

import { Tractor, Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = window.localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
  }

  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b border-white/5 bg-[#020617]/95 backdrop-blur">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 shadow-lg shadow-primary/30">
            <Tractor className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
              AgroTrack
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Fazenda Santa Inês
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-gray-200/60 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-gray-700" />}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-emerald-900/30 rounded-full border border-green-200 dark:border-emerald-800">
            <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-emerald-100">Sistema Ativo</span>
          </div>
        </div>
      </div>
    </header>
  )
}
