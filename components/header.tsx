'use client'

import { Tractor, MapPin, Activity, Menu, History, Plus, ChevronDown, LogOut, Settings, Users, Building2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCustomer } from '@/contexts/customer-context'
import { useProperty } from '@/contexts/property-context'
import { usePermissions } from '@/contexts/permissions-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { customers, selectedCustomer, setSelectedCustomer } = useCustomer()
  const { properties, selectedProperty, setSelectedProperty } = useProperty()
  const { isOwner } = usePermissions()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg shadow-green-600/30">
                <Tractor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                  AgroTrack
                </h1>
              </div>
            </a>
          </div>

          {/* Selectors - Desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-xl">
            {/* Customer Selector */}
            {customers.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 min-w-[180px]">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="truncate flex-1 text-left">
                    {selectedCustomer?.name || 'Selecionar Cliente'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px]">
                  <DropdownMenuLabel>Clientes</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {customers.map((customer) => (
                    <DropdownMenuItem
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={selectedCustomer?.id === customer.id ? 'bg-green-50' : ''}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {customer.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Property Selector */}
            {properties.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 min-w-[180px]">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="truncate flex-1 text-left">
                    {selectedProperty?.name || 'Selecionar Fazenda'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px]">
                  <DropdownMenuLabel>Propriedades</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {properties.map((property) => (
                    <DropdownMenuItem
                      key={property.id}
                      onClick={() => setSelectedProperty(property)}
                      className={selectedProperty?.id === property.id ? 'bg-green-50' : ''}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {property.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              <Activity className="h-4 w-4" />
              Dashboard
            </a>
            <a
              href="/historico"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              <History className="h-4 w-4" />
              Histórico
            </a>
            <a
              href="/maquinas/nova"
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
            >
              <Plus className="h-4 w-4" />
              Novo
            </a>
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.name || 'Usuário'}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isOwner && (
                <>
                  <DropdownMenuItem asChild>
                    <a href="/equipe" className="cursor-pointer">
                      <Users className="h-4 w-4 mr-2" />
                      Equipe
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/propriedades" className="cursor-pointer">
                      <Building2 className="h-4 w-4 mr-2" />
                      Propriedades
                    </a>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem asChild>
                <a href="/configuracoes" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
          <div className="md:hidden py-4 border-t space-y-4">
            {/* Mobile Selectors */}
            <div className="space-y-2">
              {/* Customer Selector Mobile */}
              {customers.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 w-full">
                    <Building2 className="h-4 w-4 text-green-600" />
                    <span className="truncate flex-1 text-left">
                      {selectedCustomer?.name || 'Selecionar Cliente'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)]">
                    <DropdownMenuLabel>Clientes</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {customers.map((customer) => (
                      <DropdownMenuItem
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={selectedCustomer?.id === customer.id ? 'bg-green-50' : ''}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        {customer.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Property Selector Mobile */}
              {properties.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 w-full">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="truncate flex-1 text-left">
                      {selectedProperty?.name || 'Selecionar Fazenda'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)]">
                    <DropdownMenuLabel>Propriedades</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {properties.map((property) => (
                      <DropdownMenuItem
                        key={property.id}
                        onClick={() => setSelectedProperty(property)}
                        className={selectedProperty?.id === property.id ? 'bg-green-50' : ''}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {property.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-2">
              <a
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Activity className="h-4 w-4" />
                Dashboard
              </a>
              <a
                href="/historico"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <History className="h-4 w-4" />
                Histórico
              </a>
              {isOwner && (
                <>
                  <a
                    href="/equipe"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Equipe
                  </a>
                  <a
                    href="/propriedades"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Building2 className="h-4 w-4" />
                    Propriedades
                  </a>
                </>
              )}
              <a
                href="/configuracoes"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </a>
              <a
                href="/maquinas/nova"
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
              >
                <Plus className="h-4 w-4" />
                Novo Rastreador
              </a>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
