'use client'

import { Tractor, MapPin, Activity, Menu, History } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const linkClass = (path: string) => {
    return `flex items-center gap-2 text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-green-600'
        : 'text-gray-700 hover:text-green-600'
    }`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo e Nome */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg shadow-green-600/30">
              <Tractor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                AgroTrack
              </h1>
              <p className="text-xs text-gray-600 hidden sm:block">
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
            <Link href="/maquinas" className={linkClass('/maquinas')}>
              <Tractor className="h-4 w-4" />
              Máquinas
            </Link>
            <Link href="/historico" className={linkClass('/historico')}>
              <History className="h-4 w-4" />
              Histórico
            </Link>
          </nav>

          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Sistema Ativo</span>
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
              <Link href="/maquinas" className={linkClass('/maquinas')} onClick={() => setMobileMenuOpen(false)}>
                <Tractor className="h-4 w-4" />
                Máquinas
              </Link>
              <Link href="/historico" className={linkClass('/historico')} onClick={() => setMobileMenuOpen(false)}>
                <History className="h-4 w-4" />
                Histórico
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}