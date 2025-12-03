'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Download, Loader2, MapPinned, Pause, Play, RotateCw } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import '../leaflet.css'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
)
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
})
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), {
  ssr: false,
})
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false },
)
const Tooltip = dynamic(() => import('react-leaflet').then((mod) => mod.Tooltip), {
  ssr: false,
})
const useMapHook = () => {
  // Inline dynamic hook to avoid SSR issues with server render
  const mod = require('react-leaflet') as typeof import('react-leaflet')
  return mod.useMap()
}

function FitBounds({ positions }: { positions: HistoryPosition[] }) {
  const map = useMapHook()

  useEffect(() => {
    if (!map || positions.length === 0) return
    const bounds = positions.map((p) => [p.latitude, p.longitude] as [number, number])
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, positions])

  return null
}

type DeviceItem = {
  id: number
  name: string
}

type HistoryStats = {
  distance: number
  maxSpeed: number
  averageSpeed: number
  engineHours: number
  fuelUsed: number
}

type HistoryPosition = {
  deviceTime: string
  latitude: number
  longitude: number
  speed: number
}

type DevicesResponse =
  | { success: true; data: DeviceItem[] }
  | { success: false; error: string }

type HistoryResponse =
  | {
      success: true
      data: {
        deviceId: number
        from: string
        to: string
        stats: HistoryStats
        positions: HistoryPosition[]
      }
    }
  | {
      success: false
      error: string
      details?: string
      traccarStatus?: number
    }

type QuickRange = 'custom' | 'today' | 'yesterday' | 'week'

function formatForInput(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${y}-${m}-${day}T${h}:${min}`
}

function getDefaultRange() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 1)
  start.setHours(0, 0, 0, 0)

  return {
    from: formatForInput(start),
    to: formatForInput(now),
  }
}

function toIsoString(localDateTime: string) {
  if (!localDateTime) return ''
  return new Date(localDateTime).toISOString()
}

export default function HistoricoPage() {
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [dateRange, setDateRange] = useState(getDefaultRange)
  const [quickRange, setQuickRange] = useState<QuickRange>('week')

  const [loadingDevices, setLoadingDevices] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [positions, setPositions] = useState<HistoryPosition[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const playbackTimer = useRef<NodeJS.Timeout | null>(null)

  const routePoints = useMemo(
    () => positions.map((p) => [p.latitude, p.longitude] as [number, number]),
    [positions],
  )

  const playbackPosition = positions[playbackIndex]
  const speedOptions = [0.5, 1, 2, 4, 8]

  // ------- BUSCA DEVICES AO MONTAR --------
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoadingDevices(true)
        setError(null)

        const res = await fetch('/api/traccar/devices')
        const json = (await res.json()) as DevicesResponse

        if (!json.success) {
          setError(json.error || 'Falha ao carregar dispositivos')
          setDevices([])
          return
        }

        setDevices(json.data || [])
        if (json.data.length > 0) {
          setSelectedDeviceId(String(json.data[0].id))
        }
      } catch (err) {
        console.error(err)
        setError('Erro ao buscar lista de dispositivos')
      } finally {
        setLoadingDevices(false)
      }
    }

    loadDevices()
  }, [])

  // Controla o timer do replay
  useEffect(() => {
    if (!isPlaying || positions.length === 0) return

    if (playbackTimer.current) clearInterval(playbackTimer.current)

    const interval = Math.max(200, 1000 / playbackSpeed)
    playbackTimer.current = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= positions.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, interval)

    return () => {
      if (playbackTimer.current) clearInterval(playbackTimer.current)
      playbackTimer.current = null
    }
  }, [isPlaying, playbackSpeed, positions.length])

  // Reseta controles quando os pontos mudam
  useEffect(() => {
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current)
      playbackTimer.current = null
    }
    setIsPlaying(false)
    setPlaybackIndex(0)
  }, [positions])

  // Garante que o índice nunca saia do intervalo quando não há dados
  useEffect(() => {
    if (positions.length === 0) {
      setPlaybackIndex(0)
      return
    }
    if (playbackIndex > positions.length - 1) {
      setPlaybackIndex(positions.length - 1)
    }
  }, [playbackIndex, positions.length])

  // ------- ATALHOS DE PERÍODO --------
  const handleQuickRange = (range: QuickRange) => {
    const now = new Date()
    let start = new Date(now)

    if (range === 'today') {
      start.setHours(0, 0, 0, 0)
    } else if (range === 'yesterday') {
      start.setDate(start.getDate() - 1)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setHours(23, 59, 0, 0)
      setDateRange({
        from: formatForInput(start),
        to: formatForInput(end),
      })
      setQuickRange(range)
      return
    } else if (range === 'week') {
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
    }

    setDateRange({
      from: formatForInput(start),
      to: formatForInput(now),
    })
    setQuickRange(range)
  }

  // ------- CARREGA HISTÓRICO --------
  const handleLoadHistory = async () => {
    if (!selectedDeviceId) {
      setError('Selecione um dispositivo para consultar o histórico.')
      return
    }

    try {
      setLoadingHistory(true)
      setError(null)
      setStats(null)
      setPositions([])

      const fromIso = toIsoString(dateRange.from)
      const toIso = toIsoString(dateRange.to)

      const params = new URLSearchParams({
        deviceId: selectedDeviceId,
        from: fromIso,
        to: toIso,
      })

      const res = await fetch(`/api/traccar/history?${params.toString()}`)
      const json = (await res.json()) as HistoryResponse

      if (!json.success) {
        setError(
          json.error ||
            'Não foi possível carregar o histórico. Verifique o período e tente novamente.',
        )
        return
      }

      setPlaybackIndex(0)
      setIsPlaying(false)
      setPlaybackSpeed(1)
      setStats(json.data.stats)
      setPositions(json.data.positions || [])
    } catch (err) {
      console.error(err)
      setError('Erro inesperado ao carregar histórico.')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handlePlay = () => {
    if (positions.length === 0) return
    // Recomeça do início se chegou ao fim
    if (playbackIndex >= positions.length - 1) {
      setPlaybackIndex(0)
    }
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleRestart = () => {
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current)
      playbackTimer.current = null
    }
    setPlaybackIndex(0)
    setIsPlaying(false)
  }

  const exportCsv = () => {
    if (positions.length === 0) return
    const header = 'deviceTime,latitude,longitude,speed_kmh'
    const rows = positions.map(
      (p) =>
        `${p.deviceTime},${p.latitude.toFixed(6)},${p.longitude.toFixed(6)},${p.speed.toFixed(2)}`,
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const filename = `rota_${selectedDeviceName || 'dispositivo'}_${Date.now()}.csv`
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename.replace(/\s+/g, '_')
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const exportGpx = () => {
    if (positions.length === 0) return
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AgroTrack" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${selectedDeviceName || 'Dispositivo'}</name>
    <trkseg>
${positions
  .map(
    (p) =>
      `      <trkpt lat="${p.latitude}" lon="${p.longitude}"><time>${p.deviceTime}</time><speed>${p.speed}</speed></trkpt>`,
  )
  .join('\n')}
    </trkseg>
  </trk>
</gpx>`
    const blob = new Blob([gpx], { type: 'application/gpx+xml;charset=utf-8;' })
    const filename = `rota_${selectedDeviceName || 'dispositivo'}_${Date.now()}.gpx`
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename.replace(/\s+/g, '_')
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const selectedDeviceName =
    devices.find((d) => String(d.id) === selectedDeviceId)?.name ?? ''

  const playbackMax = Math.max(positions.length - 1, 0)
  const playbackProgress =
    positions.length > 1 ? Math.round((playbackIndex / (positions.length - 1)) * 100) : 0
  const startTime = positions[0]?.deviceTime
  const endTime = positions[positions.length - 1]?.deviceTime

  const hasData = !!stats && positions.length > 0

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#ecfdf3_0,#f7fbf8_35%,#f7fbf8_100%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Título da página */}
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            Rotas e telemetria
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Histórico de Rotas
          </h1>
          <p className="text-sm text-slate-600">
            Consulte trajetos, estatísticas e exporte os dados em CSV/GPX.
          </p>
        </div>

        {/* Filtros */}
        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white/80 backdrop-blur">
            <CardTitle className="text-lg font-semibold text-slate-900">Filtros</CardTitle>
            <CardDescription className="text-slate-600">
              Escolha o equipamento e o período desejado para visualizar o histórico.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Dispositivo */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Dispositivo</Label>
                <Select
                  value={selectedDeviceId}
                  onValueChange={(value) => setSelectedDeviceId(value)}
                  disabled={loadingDevices || devices.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingDevices ? 'Carregando dispositivos...' : 'Selecione um dispositivo'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={String(device.id)}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* De */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">De</Label>
                <Input
                  type="datetime-local"
                  value={dateRange.from}
                  onChange={(e) => {
                    setDateRange((prev) => ({
                      ...prev,
                      from: e.target.value,
                    }))
                    setQuickRange('custom')
                  }}
                />
              </div>

              {/* Até */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Até</Label>
                <Input
                  type="datetime-local"
                  value={dateRange.to}
                  onChange={(e) => {
                    setDateRange((prev) => ({
                      ...prev,
                      to: e.target.value,
                    }))
                    setQuickRange('custom')
                  }}
                />
              </div>
            </div>

            {/* Botões rápidos de período */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium text-gray-500 mr-1">
                  Atalhos de período:
                </span>
                <Button
                  type="button"
                  variant={quickRange === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickRange('today')}
                >
                  Hoje
                </Button>
                <Button
                  type="button"
                  variant={quickRange === 'yesterday' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickRange('yesterday')}
                >
                  Ontem
                </Button>
                <Button
                  type="button"
                  variant={quickRange === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickRange('week')}
                >
                  Últimos 7 dias
                </Button>
              </div>

              {quickRange === 'custom' && (
                <span className="text-xs text-gray-500 italic">
                  Período personalizado
                </span>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleLoadHistory}
                disabled={loadingHistory || loadingDevices || !selectedDeviceId}
                className="px-6"
              >
                {loadingHistory && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {loadingHistory ? 'Carregando...' : 'Carregar histórico'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mensagem de erro */}
        {error && (
          <Card className="border-red-200 bg-red-50/80 text-red-800 shadow-sm">
            <CardContent className="py-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Quando não há dados ainda */}
        {!error && !hasData && !loadingHistory && (
          <Card className="border-dashed border-slate-200 bg-white/70">
            <CardContent className="py-8 text-center text-sm text-slate-600">
              Selecione um dispositivo, escolha o período (ou use os atalhos) e clique em{' '}
              <span className="font-medium text-slate-800">“Carregar histórico”</span> para ver as
              rotas.
            </CardContent>
          </Card>
        )}

        {/* Resumo + tabela */}
        {hasData && (
          <div className="space-y-6">
            {/* Resumo */}
            <Card className="border border-slate-100 shadow-md bg-white">
              <CardHeader className="border-b border-slate-100 bg-white">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Resumo — {selectedDeviceName || 'Dispositivo'}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Estatísticas gerais do período selecionado.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">
                      Distância (km)
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {stats?.distance.toFixed(2)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">
                      Velocidade máx.
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {stats?.maxSpeed.toFixed(1)} km/h
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">
                      Velocidade média
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {stats?.averageSpeed.toFixed(1)} km/h
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">
                      Horas motor
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {(stats?.engineHours ?? 0).toFixed(1)} h
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">
                      Combustível
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {(stats?.fuelUsed ?? 0).toFixed(2)} L
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wide">
                      Pontos de rota
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {positions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mapa e replay */}
            <Card className="border border-slate-100 shadow-md bg-white overflow-hidden">
              <CardHeader className="flex flex-col gap-1 border-b border-slate-100 bg-white/80">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-900">
                  <MapPinned className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  Replay no mapa
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Visualize o trajeto completo e reproduza o deslocamento ponto a ponto.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="w-full lg:w-2/3 h-[420px] rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                    <MapContainer
                      center={routePoints[0] || [-15.7797, -47.9297]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap"
                      />
                      {routePoints.length > 0 && (
                        <>
                          <Polyline
                            positions={routePoints}
                            pathOptions={{ color: '#059669', weight: 5, opacity: 0.9 }}
                          />
                          <CircleMarker
                            center={routePoints[0]}
                            radius={8}
                            pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.9 }}
                          >
                            <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
                              Início
                            </Tooltip>
                          </CircleMarker>
                          <CircleMarker
                            center={routePoints[routePoints.length - 1]}
                            radius={8}
                            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.9 }}
                          >
                            <Tooltip direction="top" offset={[0, -4]} opacity={0.9}>
                              Fim
                            </Tooltip>
                          </CircleMarker>
                          {playbackPosition && (
                            <CircleMarker
                              center={[playbackPosition.latitude, playbackPosition.longitude]}
                              radius={10}
                              pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.6 }}
                            >
                              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                                <div className="space-y-0.5">
                                  <p className="font-semibold">Ponto atual</p>
                                  <p className="text-xs">
                                    {new Date(playbackPosition.deviceTime).toLocaleString('pt-BR')}
                                  </p>
                                  <p className="text-xs">
                                    Vel: {Math.round(playbackPosition.speed)} km/h
                                  </p>
                                </div>
                              </Tooltip>
                            </CircleMarker>
                          )}
                          <FitBounds positions={positions} />
                        </>
                      )}
                    </MapContainer>
                  </div>

                  <div className="lg:w-1/3 space-y-4">
                    <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Ponto atual</p>
                          <p className="font-semibold text-gray-900">
                            {playbackPosition
                              ? new Date(playbackPosition.deviceTime).toLocaleString('pt-BR')
                              : '---'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Velocidade</p>
                          <p className="font-semibold text-gray-900">
                            {playbackPosition ? `${Math.round(playbackPosition.speed)} km/h` : '--'}
                          </p>
                        </div>
                      </div>
                      {playbackPosition && (
                        <p className="text-xs text-gray-500">
                          Lat/Lon: {playbackPosition.latitude.toFixed(5)},{' '}
                          {playbackPosition.longitude.toFixed(5)}
                        </p>
                      )}
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-white p-4 space-y-3">
                      <p className="text-sm font-medium text-gray-900">Controles do replay</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={isPlaying ? handlePause : handlePlay}
                          disabled={positions.length === 0}
                          className="flex-1 min-w-[120px]"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" /> Pausar
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" /> Reproduzir
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRestart}
                          disabled={positions.length === 0 || playbackIndex === 0}
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Reiniciar
                        </Button>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">Velocidade</Label>
                        <Select
                          value={String(playbackSpeed)}
                          onValueChange={(value) => setPlaybackSpeed(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Velocidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {speedOptions.map((speed) => (
                              <SelectItem key={speed} value={String(speed)}>
                                {speed}x
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                        <span>Linha do tempo</span>
                        <span className="text-xs text-gray-500">{playbackProgress}%</span>
                      </div>
                      <input
                        type="range"
                        className="w-full accent-emerald-600"
                        min={0}
                        max={playbackMax}
                        step={1}
                        value={playbackIndex}
                        onChange={(e) => setPlaybackIndex(Number(e.target.value))}
                        disabled={positions.length === 0}
                      />
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{startTime ? new Date(startTime).toLocaleString('pt-BR') : '--'}</span>
                        <span>{endTime ? new Date(endTime).toLocaleString('pt-BR') : '--'}</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-white p-4 space-y-2">
                      <p className="text-sm font-medium text-gray-900">Exportar rota</p>
                      <p className="text-xs text-gray-500">
                        Baixe os pontos do período selecionado em CSV ou GPX para usar em outros
                        sistemas.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={exportCsv}
                          disabled={positions.length === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={exportGpx}
                          disabled={positions.length === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          GPX
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de pontos */}
            <Card className="border border-slate-100 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Primeiros pontos da rota
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Lista dos pontos recebidos do Traccar para o período selecionado.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <div className="max-h-[420px] overflow-auto">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Horário</TableHead>
                          <TableHead>Latitude</TableHead>
                          <TableHead>Longitude</TableHead>
                          <TableHead className="text-right whitespace-nowrap">
                            Velocidade (km/h)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positions.map((p, index) => (
                          <TableRow key={`${p.deviceTime}-${index}`}>
                            <TableCell className="whitespace-nowrap text-xs md:text-sm">
                              {new Date(p.deviceTime).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-xs md:text-sm">
                              {p.latitude.toFixed(6)}
                            </TableCell>
                            <TableCell className="text-xs md:text-sm">
                              {p.longitude.toFixed(6)}
                            </TableCell>
                            <TableCell className="text-right text-xs md:text-sm">
                              {Math.round(p.speed)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
