'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Bell,
  SunMedium,
  Wrench,
  Fuel,
  AlertTriangle,
  Clock,
  CheckCircle,
  Droplet,
  Gauge,
  MoreVertical,
  X
} from 'lucide-react'

type MaintenanceStatus = 'overdue' | 'warning' | 'ok'
type MaintenanceItem = {
  id: string
  title: string
  vehicle: string
  type: 'oil' | 'tires' | 'brakes' | 'general' | 'filter'
  currentKm: number
  dueKm: number
  dueDate: string
  status: MaintenanceStatus
}

type FuelRecord = {
  id: string
  vehicle: string
  date: string
  liters: number
  price: number
  odometer: number
  fuelType: 'gasoline' | 'diesel' | 'ethanol'
}

const maintenanceItems: MaintenanceItem[] = [
  {
    id: 'm1',
    title: 'Troca de óleo',
    vehicle: 'Fiorino #01',
    type: 'oil',
    currentKm: 125430,
    dueKm: 130000,
    dueDate: '14 de fev. de 2024',
    status: 'ok'
  },
  {
    id: 'm2',
    title: 'Rodízio de pneus',
    vehicle: 'Truck #02',
    type: 'tires',
    currentKm: 354210,
    dueKm: 360000,
    dueDate: '24 de jan. de 2024',
    status: 'warning'
  },
  {
    id: 'm3',
    title: 'Revisão de freios',
    vehicle: 'Moto #03',
    type: 'brakes',
    currentKm: 45890,
    dueKm: 50000,
    dueDate: '29 de fev. de 2024',
    status: 'ok'
  },
  {
    id: 'm4',
    title: 'Revisão completa',
    vehicle: 'Truck #06',
    type: 'general',
    currentKm: 567890,
    dueKm: 560000,
    dueDate: '09 de jan. de 2024',
    status: 'overdue'
  },
  {
    id: 'm5',
    title: 'Troca de filtros',
    vehicle: 'Tractor #04',
    type: 'filter',
    currentKm: 8450,
    dueKm: 9000,
    dueDate: '31 de jan. de 2024',
    status: 'ok'
  }
]

const typeIcon = {
  oil: Droplet,
  tires: Gauge,
  brakes: AlertTriangle,
  general: Wrench,
  filter: Wrench
}

const statusColor = {
  overdue: { bar: '#ef4444', pill: 'text-[#ef4444] border-[#ef4444]' },
  warning: { bar: '#f59e0b', pill: 'text-[#f59e0b] border-[#f59e0b]' },
  ok: { bar: '#22d3ee', pill: 'text-emerald-400 border-emerald-400' }
}

const fuelRecords: FuelRecord[] = [
  {
    id: 'f1',
    vehicle: 'Fiorino #01',
    date: '19/01/2024 · Posto Shell Centro',
    liters: 45,
    price: 5.89,
    odometer: 125430,
    fuelType: 'gasoline'
  },
  {
    id: 'f2',
    vehicle: 'Truck #02',
    date: '18/01/2024 · Posto Ipiranga BR-101',
    liters: 280,
    price: 6.15,
    odometer: 354210,
    fuelType: 'diesel'
  },
  {
    id: 'f3',
    vehicle: 'Moto #03',
    date: '17/01/2024 · Posto Ale Jardins',
    liters: 12,
    price: 5.79,
    odometer: 45890,
    fuelType: 'gasoline'
  },
  {
    id: 'f4',
    vehicle: 'Truck #06',
    date: '16/01/2024 · Posto BR Rodovia',
    liters: 320,
    price: 6.2,
    odometer: 567890,
    fuelType: 'diesel'
  }
]

export default function ManutencaoPage() {
  const [tab, setTab] = useState<'maintenance' | 'fuel'>('maintenance')
  const [search, setSearch] = useState('')

  const filteredMaintenance = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return maintenanceItems
    return maintenanceItems.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.vehicle.toLowerCase().includes(term)
    )
  }, [search])

  const overdue = maintenanceItems.filter((m) => m.status === 'overdue').length
  const warning = maintenanceItems.filter((m) => m.status === 'warning').length
  const ok = maintenanceItems.filter((m) => m.status === 'ok').length
  const totalFuelCost = fuelRecords.reduce((acc, r) => acc + r.liters * r.price, 0)
  const totalLiters = fuelRecords.reduce((acc, r) => acc + r.liters, 0)
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicle: '',
    type: '',
    description: '',
    km: '',
    date: ''
  })
  const [maintenanceModal, setMaintenanceModal] = useState(false)
  const [fuelModal, setFuelModal] = useState(false)
  const [fuelForm, setFuelForm] = useState({
    vehicle: '',
    date: '',
    fuelType: '',
    liters: '',
    price: '',
    odometer: '',
    hourmeter: '',
    station: ''
  })

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="min-h-screen bg-[#0a111c] text-slate-100">
        <div className="sticky top-0 z-30 w-full bg-[#0c141f] border-b border-[#141c2a] shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-10 h-16 flex items-center gap-4">
          <div className="relative flex-1 max-w-[520px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar veículos, manutenções..."
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
            <h1 className="text-3xl font-semibold text-slate-50">Manutenção & Abastecimento</h1>
            <p className="text-slate-400">Controle de manutenção e combustível da frota</p>
          </div>
          {tab === 'maintenance' && (
            <Button
              className="bg-[#0bc2d8] text-slate-950 hover:brightness-110 rounded-xl"
              onClick={() => setMaintenanceModal(true)}
            >
              + Novo Serviço
            </Button>
          )}
          {tab === 'fuel' && (
            <Button
              className="bg-[#0bc2d8] text-slate-950 hover:brightness-110 rounded-xl ml-2"
              onClick={() => setFuelModal(true)}
            >
              + Novo Abastecimento
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setTab('maintenance')}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
              tab === 'maintenance'
                ? 'border-[#0bc2d8] text-slate-100 bg-[#0bc2d8]/10'
                : 'border-transparent text-slate-400 bg-[#0d1523]'
            }`}
          >
            <Wrench className="h-4 w-4" />
            Manutenção
          </button>
          <button
            onClick={() => setTab('fuel')}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
              tab === 'fuel'
                ? 'border-[#0bc2d8] text-slate-100 bg-[#0bc2d8]/10'
                : 'border-transparent text-slate-400 bg-[#0d1523]'
            }`}
          >
            <Fuel className="h-4 w-4" />
            Abastecimento
          </button>
        </div>

        {tab === 'maintenance' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#1a1014] border border-rose-800/70 text-rose-200 rounded-2xl">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Vencidos</span>
                  </div>
                  <p className="text-3xl font-semibold">{overdue}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1610] border border-amber-700/70 text-amber-200 rounded-2xl">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Próximos</span>
                  </div>
                  <p className="text-3xl font-semibold">{warning}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0e1c17] border border-emerald-800/70 text-emerald-200 rounded-2xl">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Em dia</span>
                  </div>
                  <p className="text-3xl font-semibold">{ok}</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {filteredMaintenance.map((item) => {
                const Icon = typeIcon[item.type]
                const status = statusColor[item.status]
                const total = item.dueKm
                const progress = Math.min((item.currentKm / total) * 100, 100)

                return (
                  <Card
                    key={item.id}
                    className={`rounded-2xl border ${
                      item.status === 'overdue'
                        ? 'border-rose-800/50 bg-[#1a1014]'
                        : item.status === 'warning'
                          ? 'border-amber-700/50 bg-[#1a1610]'
                          : 'border-[#1f2735] bg-[#0c1525]'
                    }`}
                  >
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-black/30 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-slate-200" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{item.title}</p>
                            <p className="text-sm text-slate-400">{item.vehicle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.pill}`}>
                            {item.status === 'overdue'
                              ? 'Vencido'
                              : item.status === 'warning'
                                ? 'Próximo'
                                : 'Em dia'}
                          </span>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-300">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">Quilometragem</div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${progress}%`, background: status.bar }}
                        />
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.status === 'overdue'
                          ? `${(item.currentKm - item.dueKm).toLocaleString('pt-BR')} km excedidos`
                          : `${(item.dueKm - item.currentKm).toLocaleString('pt-BR')} km restantes`}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>Previsão: {item.dueDate}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {tab === 'fuel' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0e1c17] border border-emerald-800/70 text-emerald-200 rounded-2xl">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4" />
                    <span>Registros</span>
                  </div>
                  <p className="text-3xl font-semibold">{fuelRecords.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#0e1c20] border border-teal-800/70 text-teal-200 rounded-2xl">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Droplet className="h-4 w-4" />
                    <span>Litros</span>
                  </div>
                  <p className="text-3xl font-semibold">{totalLiters}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1610] border border-amber-700/70 text-amber-200 rounded-2xl">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4" />
                    <span>Custo Total</span>
                  </div>
                  <p className="text-3xl font-semibold">
                    {totalFuelCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-[#1f2735] bg-[#0c1525] rounded-3xl overflow-hidden shadow-none">
              <CardContent className="p-0 divide-y divide-[#1f2735]">
                {fuelRecords.map((record) => (
                  <div key={record.id} className="grid grid-cols-12 items-center px-6 py-4 text-sm text-slate-200">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#0e1726] border border-[#1f2735] flex items-center justify-center text-sm font-semibold">
                        <Fuel className="h-5 w-5 text-slate-300" />
                      </div>
                      <div>
                        <p className="font-semibold">{record.vehicle}</p>
                        <p className="text-xs text-slate-400">{record.date}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-xs">
                      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2 py-1">
                        {record.fuelType === 'gasoline' ? 'Gasolina' : record.fuelType === 'diesel' ? 'Diesel' : 'Etanol'}
                      </span>
                      <p className="text-slate-400 mt-1 flex items-center gap-1">
                        <Droplet className="h-3 w-3" />
                        {record.odometer.toLocaleString('pt-BR')} km
                      </p>
                    </div>
                    <div className="col-span-3 text-right">
                      <p className="font-semibold">
                        {(record.liters * record.price).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {record.liters}L x R$ {record.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full text-slate-300"
                        onClick={() => console.log(`Ações abastecimento ${record.id}`)}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {maintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0d1523] text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between p-5">
              <div>
                <h2 className="text-xl font-semibold">Novo Serviço de Manutenção</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-slate-300"
                onClick={() => setMaintenanceModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-200">Veículo *</Label>
                <select
                  value={maintenanceForm.vehicle}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicle: e.target.value })}
                  className="h-12 w-full rounded-xl bg-[#0b1320] border border-[#1f2735] px-3 text-slate-100 placeholder:text-slate-500"
                >
                  <option value="">Selecione o veículo</option>
                  {maintenanceItems.map((m) => (
                    <option key={m.id} value={m.vehicle}>
                      {m.vehicle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-slate-200">Tipo de Serviço *</Label>
                <select
                  value={maintenanceForm.type}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}
                  className="h-12 w-full rounded-xl bg-[#0b1320] border border-[#1f2735] px-3 text-slate-100 placeholder:text-slate-500"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="oil">Óleo</option>
                  <option value="tires">Pneus</option>
                  <option value="brakes">Freios</option>
                  <option value="general">Revisão Geral</option>
                  <option value="filter">Filtros</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-slate-200">Descrição *</Label>
                <Input
                  placeholder="Ex: Troca de óleo e filtro"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-200">Km Prevista</Label>
                  <Input
                    placeholder="Ex: 150000"
                    value={maintenanceForm.km}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, km: e.target.value })}
                    className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-200">Data Prevista</Label>
                  <Input
                    type="date"
                    value={maintenanceForm.date}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                    className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setMaintenanceModal(false)}
                  className="border-[#1f2735] text-slate-100 bg-[#0b1320]"
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-[#0bc2d8] text-slate-950 hover:brightness-110"
                  onClick={() => {
                    console.log('Salvar manutenção', maintenanceForm)
                    setMaintenanceModal(false)
                    setMaintenanceForm({ vehicle: '', type: '', description: '', km: '', date: '' })
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {fuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0d1523] text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between p-5">
              <div>
                <h2 className="text-xl font-semibold">Registrar Abastecimento</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-slate-300"
                onClick={() => setFuelModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-200">Veículo *</Label>
                <select
                  value={fuelForm.vehicle}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicle: e.target.value })}
                  className="h-12 w-full rounded-xl bg-[#0b1320] border border-[#1f2735] px-3 text-slate-100 placeholder:text-slate-500"
                >
                  <option value="">Selecione o veículo</option>
                  {maintenanceItems.map((m) => (
                    <option key={m.id} value={m.vehicle}>
                      {m.vehicle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-200">Data</Label>
                  <Input
                    type="date"
                    value={fuelForm.date}
                    onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                    className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-200">Tipo de Combustível *</Label>
                  <select
                    value={fuelForm.fuelType}
                    onChange={(e) => setFuelForm({ ...fuelForm, fuelType: e.target.value })}
                    className="h-12 w-full rounded-xl bg-[#0b1320] border border-[#1f2735] px-3 text-slate-100 placeholder:text-slate-500"
                  >
                    <option value="">Selecione</option>
                    <option value="gasoline">Gasolina</option>
                    <option value="diesel">Diesel</option>
                    <option value="ethanol">Etanol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-200">Litros *</Label>
                  <Input
                    placeholder="Ex: 45.5"
                    value={fuelForm.liters}
                    onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                    className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-200">Preço/Litro *</Label>
                  <Input
                    placeholder="Ex: 5.89"
                    value={fuelForm.price}
                    onChange={(e) => setFuelForm({ ...fuelForm, price: e.target.value })}
                    className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-200">Odômetro (km)</Label>
                  <Input
                    placeholder="Ex: 125430"
                    value={fuelForm.odometer}
                    onChange={(e) => setFuelForm({ ...fuelForm, odometer: e.target.value })}
                    className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-200">Horímetro (h)</Label>
                  <Input
                    placeholder="Ex: 1250.5"
                    value={fuelForm.hourmeter}
                    onChange={(e) => setFuelForm({ ...fuelForm, hourmeter: e.target.value })}
                    className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-slate-200">Posto</Label>
                <Input
                  placeholder="Ex: Posto Shell Centro"
                  value={fuelForm.station}
                  onChange={(e) => setFuelForm({ ...fuelForm, station: e.target.value })}
                  className="h-12 bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setFuelModal(false)}
                  className="border-[#1f2735] text-slate-100 bg-[#0b1320]"
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-[#0bc2d8] text-slate-950 hover:brightness-110"
                  onClick={() => {
                    console.log('Salvar abastecimento', fuelForm)
                    setFuelModal(false)
                    setFuelForm({
                      vehicle: '',
                      date: '',
                      fuelType: '',
                      liters: '',
                      price: '',
                      odometer: '',
                      hourmeter: '',
                      station: ''
                    })
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  )
}
import { Label } from '@/components/ui/label'
