'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  UserRound,
  UserRoundX,
  UserRoundCheck,
  Search,
  Bell,
  SunMedium,
  MoreVertical,
  Mail,
  Phone,
  X
} from 'lucide-react'

type DriverStatus = 'ativo' | 'ferias' | 'inativo'

type Driver = {
  id: string
  name: string
  email: string
  phone: string
  license: string
  hireDate: string
  nextVacation: string
  status: DriverStatus
  vehicle: string
  trips: number
}

const mockDrivers: Driver[] = [
  {
    id: 'd1',
    name: 'Carlos Silva',
    email: 'carlos@email.com',
    phone: '(11) 99999-1234',
    license: 'AB',
    hireDate: '14/03/2022',
    nextVacation: '14/03/2026',
    status: 'ativo',
    vehicle: 'Fiorino #01',
    trips: 245
  },
  {
    id: 'd2',
    name: 'João Oliveira',
    email: 'joao@email.com',
    phone: '(11) 99999-5678',
    license: 'CE',
    hireDate: '19/07/2021',
    nextVacation: '19/07/2026',
    status: 'ativo',
    vehicle: 'Truck #02',
    trips: 189
  },
  {
    id: 'd3',
    name: 'Pedro Santos',
    email: 'pedro@email.com',
    phone: '(11) 99999-9012',
    license: 'A',
    hireDate: '09/01/2023',
    nextVacation: '09/01/2026',
    status: 'ativo',
    vehicle: 'Moto #03',
    trips: 320
  }
]

export default function MotoristasPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    license: '',
    hireDate: ''
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return mockDrivers
    return mockDrivers.filter(
      (driver) =>
        driver.name.toLowerCase().includes(term) ||
        driver.email.toLowerCase().includes(term) ||
        driver.vehicle.toLowerCase().includes(term)
    )
  }, [search])

  const active = mockDrivers.filter((d) => d.status === 'ativo').length
  const inactive = mockDrivers.filter((d) => d.status === 'inativo').length
  const vacation = mockDrivers.filter((d) => d.status === 'ferias').length

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="min-h-screen bg-[#0a111c] text-slate-100">
        <div className="sticky top-0 z-30 w-full bg-[#0c141f] border-b border-[#141c2a] shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
          <div className="max-w-[1700px] mx-auto px-6 lg:px-10 h-16 flex items-center gap-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar veículos, motoristas..."
              className="pl-11 h-[46px] bg-[#0e1726] border border-[#1f2735] text-slate-100 placeholder:text-slate-500 rounded-2xl"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="h-10 w-10 rounded-full bg-[#111a28] border border-[#1f2735] flex items-center justify-center text-slate-300">
              <SunMedium className="h-5 w-5" />
            </button>
            <button className="relative h-10 w-10 rounded-full bg-[#111a28] border border-[#1f2735] flex items-center justify-center text-slate-300">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-[11px] font-semibold text-white flex items-center justify-center">
                5
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-6 lg:px-10 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-50">Motoristas</h1>
            <p className="text-slate-400">Gerencie os motoristas da sua frota</p>
          </div>
          <Button
            className="bg-[#0bc2d8] text-slate-950 hover:brightness-110 rounded-xl"
            onClick={() => setModalOpen(true)}
          >
            + Novo Motorista
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Ativos', value: active, Icon: UserRoundCheck, tone: 'border-emerald-600 bg-[#0e1c17]' },
            { label: 'Inativos', value: inactive, Icon: UserRoundX, tone: 'border-slate-600 bg-[#141820]' },
            { label: 'Férias', value: vacation, Icon: UserRound, tone: 'border-teal-600 bg-[#0e1c20]' }
          ].map((card) => (
            <Card
              key={card.label}
              className={`rounded-2xl border ${card.tone} text-slate-200 shadow-none`}
            >
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-black/30 flex items-center justify-center">
                  <card.Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-semibold">{card.value}</p>
                  <p className="text-sm text-slate-400">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="pl-11 h-[52px] bg-[#0b1320] border border-[#1f2735] text-slate-100 placeholder:text-slate-500 rounded-2xl"
            />
          </div>
        </div>

        <Card className="border border-[#1f2735] bg-[#0c1525] rounded-3xl overflow-hidden shadow-none">
          <CardContent className="p-0">
            <div className="grid grid-cols-8 px-6 py-4 text-sm font-semibold text-slate-300 border-b border-[#1f2735]">
              <span className="col-span-2">Motorista</span>
              <span className="col-span-2">Contato</span>
              <span>CNH</span>
              <span>Contratação</span>
              <span>Próx. Férias</span>
              <span>Status</span>
              <span>Veículo</span>
              <span>Viagens</span>
              <span></span>
            </div>
            <div className="divide-y divide-[#1f2735]">
              {filtered.map((driver) => (
                <div key={driver.id} className="grid grid-cols-8 items-center px-6 py-4 text-sm text-slate-200">
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#0e1726] border border-[#1f2735] flex items-center justify-center text-sm font-semibold">
                      {driver.name
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n.charAt(0).toUpperCase())
                        .join('')}
                    </div>
                    <span className="font-semibold">{driver.name}</span>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1 text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {driver.email}
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {driver.phone}
                    </span>
                  </div>
                  <span className="font-semibold">{driver.license}</span>
                  <span className="text-slate-300">{driver.hireDate}</span>
                  <span className="text-sky-300 font-semibold">{driver.nextVacation}</span>
                  <div>
                    <span className="inline-flex items-center rounded-full bg-[#0bc2d8] text-slate-950 px-3 py-1 text-xs font-semibold">
                      {driver.status === 'ativo' ? 'Ativo' : driver.status === 'ferias' ? 'Férias' : 'Inativo'}
                    </span>
                  </div>
                  <span className="text-slate-200">{driver.vehicle}</span>
                  <span className="text-slate-200">{driver.trips}</span>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-slate-300"
                      onClick={() => console.log(`Ações motorista ${driver.id}`)}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d1523] text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between p-5">
              <div>
                <h2 className="text-2xl font-semibold">Novo Motorista</h2>
                <p className="text-slate-400">Preencha os dados do novo motorista para cadastrá-lo.</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-slate-300"
                onClick={() => setModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="px-5 pb-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driver-name">Nome completo *</Label>
                  <Input
                    id="driver-name"
                    placeholder="Ex: João da Silva"
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver-email">E-mail *</Label>
                  <Input
                    id="driver-email"
                    type="email"
                    placeholder="Ex: joao@email.com"
                    value={driverForm.email}
                    onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                    className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver-phone">Telefone</Label>
                  <Input
                    id="driver-phone"
                    placeholder="Ex: (11) 99999-1234"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver-license">Categoria CNH</Label>
                  <select
                    id="driver-license"
                    value={driverForm.license}
                    onChange={(e) => setDriverForm({ ...driverForm, license: e.target.value })}
                    className="h-12 w-full rounded-xl bg-[#0b1320] border border-[#1f2735] px-3 text-slate-100 placeholder:text-slate-500"
                  >
                    <option value="">Selecione...</option>
                    {['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'].map((lic) => (
                      <option key={lic} value={lic}>
                        Categoria {lic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver-hire">Data de Contratação *</Label>
                  <Input
                    id="driver-hire"
                    type="date"
                    value={driverForm.hireDate}
                    onChange={(e) => setDriverForm({ ...driverForm, hireDate: e.target.value })}
                    className="bg-[#0b1320] border-[#1f2735] text-slate-100 h-12"
                  />
                  <p className="text-xs text-slate-500">A data de férias será calculada anualmente a partir desta data.</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-[#1f2735] mt-6">
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-[#1f2735] text-slate-100 bg-[#0b1320]"
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-[#0bc2d8] text-slate-950 hover:brightness-110"
                  onClick={() => {
                    console.log('Cadastrar motorista', driverForm)
                    setModalOpen(false)
                    setDriverForm({ name: '', email: '', phone: '', license: '', hireDate: '' })
                  }}
                >
                  + Cadastrar Motorista
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
