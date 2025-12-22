'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tractor,
  Plus,
  Trash2,
  Loader2,
  MapPin,
  Car,
  AlertCircle,
  Search,
  Navigation,
  Fuel,
  Lock,
  MoreVertical,
  Play,
  Pause,
  WifiOff,
  Gauge,
  Wrench,
  TrendingUp,
  BadgeDollarSign,
  SunMedium,
  Bell
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip
} from 'recharts'

interface Device {
  id: number
  name: string
  uniqueId: string
  status: string
  category: string
  model?: string
  attributes?: {
    m2m?: string
    plate?: string
    color?: string
    iccid?: string
    speedIdealMax?: number
    speedHighMax?: number
    speedExtremeName?: string
    blocked?: boolean
    driver?: string
  }
}

export default function MaquinasPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmingDevice, setConfirmingDevice] = useState<Device | null>(null)
  const [confirmationText, setConfirmationText] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [fuelRange, setFuelRange] = useState<'semana' | 'mes' | 'ano'>('mes')

  useEffect(() => {
    fetchDevices()
  }, [])

  async function fetchDevices() {
    try {
      const response = await fetch('/api/traccar/devices')
      const result = await response.json()

      if (result.success) {
        setDevices(result.data as Device[])
      } else {
        setError('Erro ao carregar dispositivos')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dispositivos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function askDelete(device: Device) {
    setConfirmingDevice(device)
    setConfirmationText('')
    setConfirmError(null)
  }

  async function handleDelete() {
    if (!confirmingDevice) return
    if (confirmationText.trim() !== confirmingDevice.name) {
      setConfirmError('Digite exatamente o nome do dispositivo para confirmar.')
      return
    }

    setConfirmError(null)
    setDeletingId(confirmingDevice.id)

    try {
      const response = await fetch('/api/traccar/devices/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: confirmingDevice.id })
      })

      const result = await response.json()

      if (result.success) {
        // Remover da lista
        setDevices(devices.filter(d => d.id !== confirmingDevice.id))
        setConfirmingDevice(null)
        setConfirmationText('')
      } else {
        alert('Erro ao deletar: ' + result.error)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar dispositivo'
      alert('Erro ao deletar: ' + message)
    } finally {
      setDeletingId(null)
    }
  }

  function getCategoryIcon(category?: string) {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      tractor: Tractor,
      harvester: Tractor,
      sprayer: Tractor,
      truck: Car,
      car: Car,
      van: Car,
      default: Car
    }
    return icons[category || ''] || icons.default
  }

  const onlineCount = devices.filter((device) => device.status === 'online').length
  const offlineCount = devices.filter((device) => device.status !== 'online').length
  const blockedCount = 0
  const speedingCount = 0
  const maintenanceCount = 0

  const mockFuelData = [
    { name: 'Seg 1', atual: 240, anterior: 250 },
    { name: 'Seg 2', atual: 260, anterior: 255 },
    { name: 'Seg 3', atual: 255, anterior: 248 },
    { name: 'Seg 4', atual: 270, anterior: 260 },
    { name: 'Seg 5', atual: 265, anterior: 255 },
    { name: 'Seg 6', atual: 275, anterior: 268 },
    { name: 'Seg 7', atual: 280, anterior: 270 }
  ]
  const filteredDevices = devices.filter((device) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true

    return (
      device.name.toLowerCase().includes(term) ||
      device.uniqueId.toLowerCase().includes(term) ||
      device.attributes?.plate?.toLowerCase().includes(term) ||
      device.attributes?.m2m?.toLowerCase().includes(term)
    )
  })

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,rgba(34,197,94,0.08),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.08),transparent_28%),#050814] flex items-center justify-center text-slate-200">
          <div className="text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
            </div>
            <p className="text-sm text-slate-400">Carregando dispositivos...</p>
          </div>
        </div>
      </>
    )
  }

  const noDevices = filteredDevices.length === 0

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="min-h-screen bg-[#0a111c] text-foreground">
        <div className="w-full">
          {/* Top bar estilo Lovable */}
          <div className="sticky top-0 z-30 w-full bg-[#0c141f] border-b border-[#141c2a] shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
            <div className="max-w-[1700px] mx-auto px-6 lg:px-10 h-16 flex items-center gap-4">
              <div className="relative flex-1 max-w-[520px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            {/* Cabeçalho */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-400/90">FROTA</p>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-400 shadow-lg shadow-emerald-500/30">
                      <Tractor className="h-5 w-5 text-slate-950" />
                    </span>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-semibold text-slate-50">Gestão de Frota</h1>
                      <p className="text-sm text-slate-400">Gerencie todos os veículos da sua frota</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/dispositivos/nova')}
                  className="gap-2 rounded-xl bg-[#0bc2d8] text-slate-950 hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  Novo veículo
                </Button>
              </div>
            </div>

            {/* Busca simples */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, placa ou motorista..."
                  className="pl-11 h-[56px] text-lg bg-[#0b1320] border border-[#1f2735] text-slate-100 placeholder:text-slate-500 rounded-2xl"
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <Card className="border border-rose-500/40 bg-rose-500/10 text-rose-100 rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Faixa de status (cards finos) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {[
                { label: 'Em movimento', value: onlineCount, icon: Play, border: 'border-[#1aa2c8]', text: 'text-[#1aa2c8]', iconBg: 'bg-[#1aa2c8]/10' },
                { label: 'Parados', value: 3, icon: Pause, border: 'border-[#c28f1a]', text: 'text-[#c28f1a]', iconBg: 'bg-[#c28f1a]/10' },
                { label: 'Offline', value: offlineCount, icon: WifiOff, border: 'border-[#4f596a]', text: 'text-[#ced3dd]', iconBg: 'bg-[#4f596a]/10' },
                { label: 'Total', value: devices.length, icon: Navigation, border: 'border-[#27a35c]', text: 'text-[#27a35c]', iconBg: 'bg-[#27a35c]/10' },
                { label: 'Bloqueados', value: blockedCount, icon: Lock, border: 'border-[#c44646]', text: 'text-[#c44646]', iconBg: 'bg-[#c44646]/10' },
                { label: 'Excesso de velocidade', value: speedingCount, icon: Gauge, border: 'border-[#c27a1a]', text: 'text-[#c27a1a]', iconBg: 'bg-[#c27a1a]/10' },
                { label: 'Manutenção pendente', value: maintenanceCount, icon: Wrench, border: 'border-[#c7a341]', text: 'text-[#c7a341]', iconBg: 'bg-[#c7a341]/10' }
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border bg-[#111926] px-6 py-5 text-slate-200 ${item.border}`}
                  >
                    <div className={`h-12 w-12 rounded-xl ${item.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${item.text}`} />
                    </div>
                    <p className={`text-3xl font-semibold ${item.text}`}>{item.value}</p>
                    <p className="text-sm text-slate-300">{item.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Gráfico de consumo */}
            <Card className="border border-[#0f1725] bg-[#0c1220] rounded-2xl shadow-inner shadow-black/30">
              <CardHeader className="pb-2 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-slate-100 text-2xl">Consumo de Combustível</CardTitle>
                    <CardDescription className="text-slate-400">
                      Comparação com período anterior
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0b1320] p-1 rounded-full border border-white/5">
                    {[
                      { label: 'Semana', value: 'semana' },
                      { label: 'Mês', value: 'mes' },
                      { label: 'Ano', value: 'ano' }
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setFuelRange(item.value as typeof fuelRange)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          fuelRange === item.value
                            ? 'bg-[#0bc2d8] text-slate-950'
                            : 'text-slate-300 hover:text-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6 bg-[#0d1525] border border-white/5 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-[#0bc2d8]/12 flex items-center justify-center text-[#0bc2d8]">
                      <Fuel className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">Total</p>
                      <p className="text-lg font-semibold text-slate-50">1.410 L</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-rose-500/12 flex items-center justify-center text-rose-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">vs Mês Anterior</p>
                      <p className="text-lg font-semibold text-rose-400">+6.0%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-amber-500/12 flex items-center justify-center text-amber-400">
                      <BadgeDollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">Custo Estimado</p>
                      <p className="text-lg font-semibold text-slate-50">R$ 8.460</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-80 space-y-3">
                <div className="flex justify-end gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full border border-white/40 bg-slate-500" />
                      <span className="w-8 border-t border-dashed border-slate-400" />
                    </span>
                    <span>Mês Anterior</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full border border-[#0bc2d8] bg-[#0bc2d8]" />
                      <span className="w-8 h-[2px] rounded-full bg-[#0bc2d8]" />
                    </span>
                    <span>Este Mês</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockFuelData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0bc2d8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0bc2d8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#0b1320',
                        border: '1px solid #1f2937',
                        borderRadius: 12
                      }}
                      labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="anterior"
                      stroke="#94a3b8"
                      strokeDasharray="6 6"
                      fill="url(#colorAnterior)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="atual"
                      stroke="#0bc2d8"
                      fill="url(#colorAtual)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lista de Dispositivos */}
            {noDevices ? (
              <Card className="bg-card border rounded-2xl shadow-sm">
                <CardContent className="p-10 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
                    <Tractor className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {devices.length === 0 ? 'Nenhum dispositivo cadastrado' : 'Nenhum resultado encontrado'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {devices.length === 0
                        ? 'Comece adicionando seu primeiro dispositivo para monitorar a frota.'
                        : 'Ajuste a busca para localizar o dispositivo desejado.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/dispositivos/nova')}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 hover:shadow-[0_12px_30px_-12px_rgba(16,185,129,0.7)]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar dispositivo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredDevices.map((device, idx) => {
                  const isOnline = device.status === 'online'
                  const isOffline = device.status === 'offline'
                  const isBlocked = device.status === 'blocked' || device.attributes?.blocked === true
                  const statusLabel = isOnline ? 'Em movimento' : isOffline ? 'Offline' : 'Parado'
                  const statusTone = isOnline
                    ? 'bg-[#0bc2d8] text-slate-950'
                    : isOffline
                      ? 'bg-[#e11d48] text-white'
                      : 'bg-slate-500/30 text-slate-100'

                  // mock metrics para exibição visual
                  const seed = (Number(device.id) + idx * 13) || idx + 1
                  const kmValue = 20000 + ((seed * 173) % 600000)
                  const fuelPct = 15 + ((seed * 29) % 70)
                  const driverName = device.attributes?.driver || 'Motorista não atribuído'
                  const driverInitial = driverName.trim().charAt(0).toUpperCase() || 'M'

                  const VehicleIcon = getCategoryIcon(device.category)

                  return (
                    <div
                      key={device.id}
                      className={`flex items-center gap-4 rounded-2xl border px-4 py-3 bg-[#0d1523] transition hover:shadow-md ${
                        isBlocked ? 'border-red-600/70 bg-[#1a1014]' : 'border-[#161d2a]'
                      }`}
                    >
                      {/* Coluna: veículo e placa */}
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isBlocked ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                          <VehicleIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-50 truncate">{device.name}</p>
                            {isBlocked && <Lock className="h-4 w-4 text-red-400" />}
                          </div>
                          <p className="text-sm text-slate-400 truncate">{device.attributes?.plate || device.uniqueId}</p>
                        </div>
                      </div>

                      {/* Motorista */}
                      <div className="flex items-center gap-3 min-w-[170px]">
                        <div className="h-8 w-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-semibold">
                          {driverInitial}
                        </div>
                        <p className="text-slate-100 truncate">{driverName}</p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusTone}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* KM */}
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <p className="text-slate-100 font-semibold">{kmValue.toLocaleString('pt-BR')} km</p>
                      </div>

                      {/* Combustível */}
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <Fuel className="h-4 w-4 text-slate-300" />
                        <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(fuelPct, 100)}%` }}
                          />
                        </div>
                        <p className="text-slate-100 text-sm font-semibold">{fuelPct}%</p>
                      </div>

                      {/* Ações */}
                      <div className="ml-auto flex items-center gap-2">
                        {[
                          { icon: Navigation, label: 'Seguir', color: 'text-[#3b82f6]' },
                          { icon: MapPin, label: 'Cerca', color: 'text-[#8b5cf6]' },
                          { icon: Lock, label: isBlocked ? 'Desbloquear' : 'Bloquear', color: isBlocked ? 'text-emerald-400' : 'text-red-400' },
                          { icon: Fuel, label: 'Abastecer', color: 'text-amber-400' }
                        ].map((action) => {
                          const ActionIcon = action.icon
                          return (
                            <Button
                              key={action.label}
                              variant="ghost"
                              size="icon"
                              title={action.label}
                              onClick={() => console.log(`${action.label} dispositivo ${device.id}`)}
                              className="h-10 w-10 rounded-full"
                            >
                              <ActionIcon className={`h-5 w-5 ${action.color}`} />
                            </Button>
                          )
                        })}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Mais ações"
                          onClick={() => askDelete(device)}
                          className="h-10 w-10 rounded-full text-slate-300"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-2xl">
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-destructive">
                  <div className="h-10 w-10 rounded-xl border border-destructive/30 bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  Confirmar exclusão
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Esta ação remove o dispositivo <strong>{confirmingDevice.name}</strong> e não pode ser desfeita.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Para continuar, digite o nome exato do dispositivo.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground/80">
                    Digite: {confirmingDevice.name}
                  </label>
                  <Input
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Nome do dispositivo"
                  />
                  {confirmError && (
                    <p className="text-xs text-destructive">{confirmError}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConfirmingDevice(null)
                      setConfirmationText('')
                      setConfirmError(null)
                    }}
                    className="rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={
                      deletingId === confirmingDevice.id ||
                      confirmationText.trim() !== confirmingDevice.name
                    }
                  >
                    {deletingId === confirmingDevice.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      'Confirmar exclusão'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
