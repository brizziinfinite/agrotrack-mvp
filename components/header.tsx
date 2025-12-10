'use client'

import { Tractor, Activity, Menu, History, Sun, Moon, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = window.localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light'
  })
  const pathname = usePathname()

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
    // O efeito acima cuida de aplicar o tema e persistir
  }

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const linkClass = (path: string) => {
    return `flex items-center gap-2 text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-primary'
        : 'text-muted-foreground hover:text-primary'
    }`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo e Nome */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-400 shadow-lg shadow-primary/30">
              <Tractor className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                AgroTrack
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Fazenda Santa Inês
              </p>
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={linkClass('/')}>
              <Activity className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/dispositivos" className={linkClass('/dispositivos')}>
              <Tractor className="h-4 w-4" />
              Dispositivos
            </Link>
            <Link href="/historico" className={linkClass('/historico')}>
              <History className="h-4 w-4" />
              Histórico
            </Link>
            <Link href="/cercas" className={linkClass('/cercas')}>
              <MapPin className="h-4 w-4" />
              Cercas
            </Link>
          </nav>

          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-gray-700" />}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-emerald-900/30 rounded-full border border-green-200 dark:border-emerald-800">
              <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-emerald-100">Sistema Ativo</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <Link href="/" className={linkClass('/')} onClick={() => setMobileMenuOpen(false)}>
                <Activity className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/dispositivos" className={linkClass('/dispositivos')} onClick={() => setMobileMenuOpen(false)}>
                <Tractor className="h-4 w-4" />
                Dispositivos
              </Link>
              <Link href="/historico" className={linkClass('/historico')} onClick={() => setMobileMenuOpen(false)}>
                <History className="h-4 w-4" />
                Histórico
              </Link>
              <Link href="/cercas" className={linkClass('/cercas')} onClick={() => setMobileMenuOpen(false)}>
                <MapPin className="h-4 w-4" />
                Cercas
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
