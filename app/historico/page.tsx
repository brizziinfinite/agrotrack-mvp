"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { History, Loader2, Navigation, Gauge, Clock, PauseCircle, Route, Download } from "lucide-react"
import { getDeviceIcon } from "@/lib/device-icons"
import { useSearchParams } from "next/navigation"

const HistoryMap = dynamic(() => import("@/components/history-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-3xl border border-white/10 bg-[#0b1220]/60 text-slate-400">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Carregando mapa...
    </div>
  ),
})

type Device = {
  id: number
  name: string
  category?: string
  status: string
  attributes?: {
    plate?: string
    m2m?: string
    iccid?: string
    speedIdealMax?: number
    speedHighMax?: number
    speedExtremeName?: string
  }
}

type Position = {
  latitude: number
  longitude: number
  speed: number
  deviceTime: string
}

type TripReport = {
  deviceId: number
  deviceName?: string
  startTime: string
  endTime: string
  startAddress?: string
  endAddress?: string
  distance?: number
  duration?: number
  maxSpeed?: number
  averageSpeed?: number
}

type StopReport = {
  deviceId: number
  deviceName?: string
  startTime: string
  endTime: string
  address?: string
  duration?: number
}

type HistoryData = {
  positions: Position[]
  statistics: {
    totalDistance: number
    totalTime: number
    avgSpeed: number
    maxSpeed: number
    pointCount: number
    idleTime: number
  }
  trips: TripReport[]
  stops: StopReport[]
}

const datePresets = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "last24h", label: "Últimas 24h" },
  { id: "last7d", label: "7 dias" },
  { id: "last30d", label: "30 dias" },
  { id: "custom", label: "Personalizado" },
] as const

type DatePreset = (typeof datePresets)[number]["id"]

const formatDateTime = (iso: string) => {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatDuration = (seconds?: number | null) => {
  if (!seconds && seconds !== 0) return "—"
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes} min`
  return `${hours}h ${minutes}min`
}

const formatDistance = (km?: number) => {
  if (!km) return "—"
  return `${km.toFixed(2)} km`
}

const formatSpeed = (speed?: number) => {
  if (speed === undefined || speed === null) return "—"
  return `${speed.toFixed(1)} km/h`
}

const formatHour = (iso: string) => {
  if (!iso) return "--:--"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "--:--"
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export default function HistoricoPage() {
  const searchParams = useSearchParams()
  const initialDeviceId = searchParams.get("deviceId")
  const initialDeviceName = searchParams.get("deviceName") || ""

  const [devices, setDevices] = useState<Device[]>([])
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [deviceSearch, setDeviceSearch] = useState("")
  const [selectedDevice, setSelectedDevice] = useState<number | null>(() => {
    if (!initialDeviceId) return null
    const parsed = Number(initialDeviceId)
    return Number.isNaN(parsed) ? null : parsed
  })
  const [selectedDeviceName, setSelectedDeviceName] = useState(initialDeviceName)
  const [dateFilter, setDateFilter] = useState<DatePreset>("today")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    if (!selectedDevice) return
    const found = devices.find((device) => device.id === selectedDevice)
    if (found) {
      setSelectedDeviceName(found.name)
    }
  }, [devices, selectedDevice])

  async function fetchDevices() {
    try {
      const response = await fetch("/api/traccar/devices")
      const result = await response.json()
      if (result.success) {
        setDevices(result.data as Device[])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao buscar dispositivos"
      console.error("Erro ao buscar dispositivos:", message)
    } finally {
      setDevicesLoading(false)
    }
  }

  const filteredDevices = useMemo(() => {
    const term = deviceSearch.trim().toLowerCase()
    if (!term) return devices
    return devices.filter((device) => {
      const plate = (device.attributes?.plate || "").toLowerCase()
      const m2m = (device.attributes?.m2m || "").toLowerCase()
      const iccid = (device.attributes?.iccid || "").toLowerCase()
      return (
        device.name.toLowerCase().includes(term) ||
        plate.includes(term) ||
        m2m.includes(term) ||
        iccid.includes(term) ||
        device.id.toString().includes(term)
      )
    })
  }, [deviceSearch, devices])

  function getDateRange() {
    const now = new Date()
    let from = new Date(now)
    let to = new Date(now)

    switch (dateFilter) {
      case "today":
        from = new Date(now)
        from.setHours(0, 0, 0, 0)
        to = new Date()
        break
      case "yesterday":
        from = new Date(now)
        from.setDate(now.getDate() - 1)
        from.setHours(0, 0, 0, 0)
        to = new Date(from)
        to.setHours(23, 59, 59, 999)
        break
      case "last24h":
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        to = new Date()
        break
      case "last7d":
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        to = new Date()
        break
      case "last30d":
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        to = new Date()
        break
      case "custom":
        if (!customDateFrom || !customDateTo) {
          throw new Error("Informe a data inicial e final.")
        }
        from = new Date(customDateFrom)
        to = new Date(customDateTo)
        break
      default:
        from = new Date(now)
        from.setHours(0, 0, 0, 0)
        to = new Date()
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    }
  }

  const fetchHistory = useCallback(async () => {
    if (!selectedDevice) {
      setError("Selecione um dispositivo para continuar.")
      return
    }
    setLoading(true)
    setError(null)
    setHistoryData(null)
    try {
      const { from, to } = getDateRange()
      const params = new URLSearchParams({
        deviceId: selectedDevice.toString(),
        from,
        to,
      })
      const response = await fetch(`/api/traccar/history?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setHistoryData(result.data as HistoryData)
        if (!result.data.positions || result.data.positions.length === 0) {
          setError("Nenhum dado encontrado para este período.")
        }
      } else {
        setError(result.error || "Falha ao carregar histórico.")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar histórico."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [selectedDevice, dateFilter, customDateFrom, customDateTo])

  function handleDeviceChange(value: string) {
    if (!value) {
      setSelectedDevice(null)
      setSelectedDeviceName("")
      setHistoryData(null)
      setError(null)
      return
    }
    const id = Number(value)
    if (Number.isNaN(id)) return
    setSelectedDevice(id)
    const found = devices.find((device) => device.id === id)
    setSelectedDeviceName(found?.name ?? "")
    setHistoryData(null)
    setError(null)
  }

  function handleExportCsv() {
    if (!selectedDevice) {
      setError("Selecione um dispositivo para exportar.")
      return
    }
    try {
      const { from, to } = getDateRange()
      const params = new URLSearchParams({
        deviceId: selectedDevice.toString(),
        from,
        to,
        download: "1",
      })
      const url = `/api/traccar/history?${params.toString()}`
      window.open(url, "_blank")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao gerar exportação."
      setError(message)
    }
  }

  useEffect(() => {
    if (!selectedDevice) return
    if (dateFilter === "custom") return
    fetchHistory()
  }, [dateFilter, selectedDevice, fetchHistory])

  function handleClearFilters() {
    setDateFilter("today")
    setCustomDateFrom("")
    setCustomDateTo("")
    setHistoryData(null)
    setError(null)
  }

  const selectedDeviceData = useMemo(
    () => devices.find((device) => device.id === selectedDevice),
    [devices, selectedDevice]
  )
  const selectedDeviceIcon = getDeviceIcon(selectedDeviceData?.category)

  const resumoPeriodo = useMemo(() => {
    if (!historyData) return null
    const movimento = historyData.trips.reduce((acc, trip) => acc + (trip.duration || 0), 0)
    const parado = historyData.stops.reduce((acc, stop) => acc + (stop.duration || 0), 0)
    return {
      distancia: historyData.statistics.totalDistance,
      tempoMovimento: movimento,
      tempoParado: parado,
      velocidadeMedia: historyData.statistics.avgSpeed,
      velocidadeMaxima: historyData.statistics.maxSpeed,
      marchaLenta: historyData.statistics.idleTime,
    }
  }, [historyData])

  const timeline = useMemo(() => {
    if (!historyData) return []
    return historyData.positions.slice(0, 120)
  }, [historyData])

  return (
    <div className="flex h-dvh flex-col bg-[#050816] text-slate-100">
      <Header />
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-10">
        <div className="mx-auto w-full max-w-6xl space-y-6 pb-16">
          <section className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Histórico</p>
                <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">
                    {selectedDeviceIcon.emoji}
                  </span>
                  {selectedDeviceName || "Selecione um dispositivo"}
                </h1>
                <p className="text-sm text-slate-400">
                  Analise rotas, eventos e desempenho do dispositivo no período escolhido.
                </p>
              </div>
              {selectedDeviceName && (
                <Badge className="w-fit rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-1 text-emerald-100">
                  {selectedDeviceName}
                </Badge>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-6 backdrop-blur-xl">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-[0.3em] text-slate-400">Dispositivo</Label>
                <Input
                  placeholder="Buscar por nome, placa ou ID"
                  value={deviceSearch}
                  onChange={(event) => setDeviceSearch(event.target.value)}
                  className="border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-400"
                />
                <div className="relative">
                  <select
                    value={selectedDevice ?? ""}
                    onChange={(event) => handleDeviceChange(event.target.value)}
                    disabled={devicesLoading}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                  >
                    <option value="" className="bg-[#0b1220] text-slate-900">
                      {devicesLoading ? "Carregando dispositivos..." : "Selecione um dispositivo"}
                    </option>
                    {filteredDevices.map((device) => (
                      <option key={device.id} value={device.id} className="bg-[#0b1220] text-white">
                        {device.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-[0.3em] text-slate-400">Período</Label>
                <div className="flex flex-wrap gap-2">
                  {datePresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setDateFilter(preset.id)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        dateFilter === preset.id
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-100"
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {dateFilter === "custom" && (
                  <div className="mt-2 grid gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs text-slate-400">Início</Label>
                      <Input
                        type="datetime-local"
                        value={customDateFrom}
                        onChange={(event) => setCustomDateFrom(event.target.value)}
                        className="border-white/10 bg-white/5 text-sm text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs text-slate-400">Fim</Label>
                      <Input
                        type="datetime-local"
                        value={customDateTo}
                        onChange={(event) => setCustomDateTo(event.target.value)}
                        className="border-white/10 bg-white/5 text-sm text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={fetchHistory}
                disabled={loading || !selectedDevice}
                className="h-11 rounded-2xl bg-emerald-500/90 px-6 text-white hover:bg-emerald-400/80"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando
                  </>
                ) : (
                  <>
                    <History className="mr-2 h-4 w-4" />
                    Aplicar filtros
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearFilters}
                className="h-11 rounded-2xl border border-white/10 bg-transparent px-6 text-slate-200 hover:bg-white/5"
              >
                Limpar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportCsv}
                disabled={!selectedDevice}
                className="h-11 rounded-2xl border border-white/15 bg-white/5 px-6 text-slate-200 hover:bg-white/10 disabled:opacity-40"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </section>

          {error && !loading && (
            <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}

          {!selectedDevice && !loading && (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-300">
              <p className="text-lg font-semibold text-white">Selecione um dispositivo no mapa</p>
              <p className="mt-2 text-sm text-slate-400">
                Use a lupa do mapa e toque em “Histórico” para carregar automaticamente o dispositivo aqui.
              </p>
            </div>
          )}

          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                Processando dados do período selecionado...
              </div>
            </div>
          )}

  {historyData && (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={<Navigation className="h-4 w-4 text-emerald-300" />}
          title="Distância"
          value={formatDistance(resumoPeriodo?.distancia)}
          detail={`${historyData.statistics.pointCount} pontos`}
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4 text-cyan-300" />}
          title="Em movimento"
          value={formatDuration(resumoPeriodo?.tempoMovimento)}
          detail="Tempo rodando"
        />
        <SummaryCard
          icon={<PauseCircle className="h-4 w-4 text-amber-300" />}
          title="Parado"
          value={formatDuration(resumoPeriodo?.tempoParado)}
          detail="Paradas detectadas"
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4 text-blue-300" />}
          title="Marcha lenta"
          value={formatDuration(resumoPeriodo?.marchaLenta)}
          detail="Motor ligado sem movimento"
        />
        <SummaryCard
          icon={<Gauge className="h-4 w-4 text-rose-300" />}
          title="Velocidades"
          value={formatSpeed(resumoPeriodo?.velocidadeMedia)}
          detail={`Máxima ${formatSpeed(resumoPeriodo?.velocidadeMaxima)}`}
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#0b1220]/80">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Trajetória</p>
            <p className="text-sm text-slate-400">Playback completo do período</p>
          </div>
          <Badge className="rounded-full border border-white/10 bg-white/5 text-xs text-slate-200">
            {selectedDeviceName || "—"}
          </Badge>
        </div>
        <div className="p-0">
          <HistoryMap
            positions={historyData.positions}
            deviceName={selectedDeviceName}
            icon={selectedDeviceIcon}
            speedRules={{
              ideal: selectedDeviceData?.attributes?.speedIdealMax,
              high: selectedDeviceData?.attributes?.speedHighMax,
              extremeName: selectedDeviceData?.attributes?.speedExtremeName,
            }}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Eventos do período</h3>
            <Badge className="rounded-full border border-white/10 bg-white/5 text-xs text-slate-300">
              {timeline.length} registros
            </Badge>
          </div>
          <div className="mt-4 max-h-[420px] overflow-y-auto pr-2">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Horário</th>
                  <th className="py-2">Velocidade</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((position, index) => {
                  const status = position.speed > 1 ? "Em movimento" : "Parado"
                  return (
                    <tr key={`${position.deviceTime}-${index}`} className="border-b border-white/5 last:border-none">
                      <td className="py-2 text-slate-300">{formatHour(position.deviceTime)}</td>
                      <td className="py-2 font-semibold text-white">{formatSpeed(position.speed)}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            status === "Em movimento"
                              ? "bg-emerald-500/15 text-emerald-100"
                              : "bg-slate-500/15 text-slate-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Route className="h-4 w-4 text-emerald-300" />
                Viagens detectadas
              </h3>
              <Badge className="rounded-full border border-emerald-400/30 bg-emerald-500/20 text-emerald-100">
                {historyData.trips.length} viagens
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              {historyData.trips.length === 0 && (
                <p className="text-sm text-slate-400">Nenhuma viagem encontrada para este período.</p>
              )}
              {historyData.trips.map((trip, index) => (
                <div key={`${trip.startTime}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Viagem {index + 1}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs">
                      {formatDuration(trip.duration)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <p>Início: {formatDateTime(trip.startTime)}</p>
                    <p>Fim: {formatDateTime(trip.endTime)}</p>
                    <p>Distância: {formatDistance((trip.distance ?? 0) / 1000)}</p>
                    <p>Velocidade média: {formatSpeed(trip.averageSpeed ? trip.averageSpeed * 1.852 : undefined)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <PauseCircle className="h-4 w-4 text-amber-300" />
                Paradas
              </h3>
              <Badge className="rounded-full border border-amber-400/30 bg-amber-500/20 text-amber-100">
                {historyData.stops.length} paradas
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              {historyData.stops.length === 0 && (
                <p className="text-sm text-slate-400">Nenhuma parada foi registrada.</p>
              )}
              {historyData.stops.map((stop, index) => (
                <div key={`${stop.startTime}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
                  <p className="text-sm font-semibold text-white">Parada {index + 1}</p>
                  <p className="mt-2 text-slate-400">Início: {formatDateTime(stop.startTime)}</p>
                  <p className="text-slate-400">Fim: {formatDateTime(stop.endTime)}</p>
                  <p className="text-slate-400">Duração: {formatDuration(stop.duration)}</p>
                  <p className="text-slate-400">Local: {stop.address || "Endereço indisponível"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )}

          {!historyData && !loading && selectedDevice && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
              <p className="text-lg font-semibold text-white">Selecione um período e clique em “Aplicar filtros”.</p>
              <p className="mt-2 text-sm text-slate-400">O playback será exibido assim que os dados forem carregados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: React.ReactNode
  title: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      {detail && <p className="text-xs text-slate-500">{detail}</p>}
    </div>
  )
}
