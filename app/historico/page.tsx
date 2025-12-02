'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  History,
  Calendar,
  MapPin,
  Clock,
  TrendingUp,
  Navigation,
  Gauge,
  Tractor,
  Search,
  AlertCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import '../leaflet.css'

// Importar HistoryMap dinamicamente (client-side only)
const HistoryMap = dynamic(() => import('@/components/history-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-lg border bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Carregando mapa...</p>
    </div>
  )
})

interface Device {
  id: number
  name: string
  status: string
}

interface Position {
  latitude: number
  longitude: number
  speed: number
  deviceTime: string
}

interface Statistics {
  totalDistance: number
  totalTime: number
  avgSpeed: number
  maxSpeed: number
  pointCount: number
  currentSpeed?: number
}

interface SpeedConfig {
  low: number
  ideal: number
  high: number
}

interface HistoryData {
  positions: Position[]
  statistics: Statistics
  speedConfig?: SpeedConfig
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'custom'

export default function HistoricoPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devicesLoading, setDevicesLoading] = useState(true)

  // Estados do replay
  const [isReplayMode, setIsReplayMode] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentReplayIndex, setCurrentReplayIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Buscar dispositivos ao carregar
  useEffect(() => {
    fetchDevices()
  }, [])

  // Controlar animação do replay
  useEffect(() => {
    if (!isPlaying || !historyData || !isReplayMode) return

    const interval = setInterval(() => {
      setCurrentReplayIndex((prevIndex) => {
        if (prevIndex >= historyData.positions.length - 1) {
          setIsPlaying(false)
          return prevIndex
        }
        return prevIndex + 1
      })
    }, 1000 / playbackSpeed) // Velocidade ajustável

    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeed, historyData, isReplayMode])

  async function fetchDevices() {
    try {
      const response = await fetch('/api/traccar/devices')
      const result = await response.json()

      if (result.success) {
        setDevices(result.data)
        // Selecionar primeiro dispositivo por padrão
        if (result.data.length > 0) {
          setSelectedDevice(result.data[0].id)
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar dispositivos:', err)
    } finally {
      setDevicesLoading(false)
    }
  }

  // Obter datas baseado no filtro selecionado
  function getDateRange(): { from: string; to: string } {
    const now = new Date()
    let from: Date
    let to: Date = now

    switch (dateFilter) {
      case 'today':
        from = new Date(now.setHours(0, 0, 0, 0))
        to = new Date()
        break
      case 'yesterday':
        from = new Date(now.setDate(now.getDate() - 1))
        from.setHours(0, 0, 0, 0)
        to = new Date(from)
        to.setHours(23, 59, 59, 999)
        break
      case 'week':
        from = new Date(now.setDate(now.getDate() - 7))
        to = new Date()
        break
      case 'custom':
        if (!customDateFrom || !customDateTo) {
          throw new Error('Selecione as datas inicial e final')
        }
        from = new Date(customDateFrom)
        to = new Date(customDateTo)
        to.setHours(23, 59, 59, 999)
        break
      default:
        from = new Date(now.setHours(0, 0, 0, 0))
        to = new Date()
    }

    return {
      from: from.toISOString(),
      to: to.toISOString()
    }
  }

  async function fetchHistory() {
    if (!selectedDevice) {
      setError('Selecione uma máquina')
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
        to
      })

      const response = await fetch(`/api/traccar/history?${params}`)
      const result = await response.json()

      if (result.success) {
        setHistoryData(result.data)
        if (result.data.positions.length === 0) {
          setError('Nenhuma rota encontrada para este período')
        }
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedDeviceName = devices.find(d => d.id === selectedDevice)?.name || ''

  // Funções de controle do replay
  function startReplay() {
    setIsReplayMode(true)
    setCurrentReplayIndex(0)
    setIsPlaying(true)
  }

  function togglePlayPause() {
    setIsPlaying(!isPlaying)
  }

  function resetReplay() {
    setCurrentReplayIndex(0)
    setIsPlaying(false)
  }

  function exitReplay() {
    setIsReplayMode(false)
    setIsPlaying(false)
    setCurrentReplayIndex(0)
  }

  // Calcular estatísticas até o ponto atual do replay
  function getCurrentStats(): Statistics | undefined {
    if (!historyData || !isReplayMode) {
      return historyData?.statistics
    }

    const currentPositions = historyData.positions.slice(0, currentReplayIndex + 1)
    if (currentPositions.length === 0) return historyData.statistics

    // Calcular distância percorrida até agora (proporcional)
    const progress = (currentReplayIndex + 1) / historyData.positions.length
    const currentDistance = historyData.statistics.totalDistance * progress

    // Calcular tempo decorrido
    const firstTime = new Date(historyData.positions[0].deviceTime).getTime()
    const currentTime = new Date(historyData.positions[currentReplayIndex].deviceTime).getTime()
    const currentTotalTime = (currentTime - firstTime) / 1000 / 60 // em minutos

    // Velocidade atual
    const currentSpeed = historyData.positions[currentReplayIndex].speed

    // Velocidade máxima até agora
    let currentMaxSpeed = 0
    for (let i = 0; i <= currentReplayIndex; i++) {
      if (historyData.positions[i].speed > currentMaxSpeed) {
        currentMaxSpeed = historyData.positions[i].speed
      }
    }

    // Velocidade média até agora
    let speedSum = 0
    let speedCount = 0
    for (let i = 0; i <= currentReplayIndex; i++) {
      if (historyData.positions[i].speed > 0) {
        speedSum += historyData.positions[i].speed
        speedCount++
      }
    }
    const currentAvgSpeed = speedCount > 0 ? speedSum / speedCount : 0

    return {
      totalDistance: currentDistance,
      totalTime: currentTotalTime,
      avgSpeed: currentAvgSpeed,
      maxSpeed: currentMaxSpeed,
      pointCount: currentReplayIndex + 1,
      currentSpeed: currentSpeed
    }
  }

  const displayStats = getCurrentStats() || historyData?.statistics

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <History className="h-6 w-6 text-white" />
              </div>
              Histórico de Rotas
            </h2>
            <p className="text-gray-600">
              Visualize e analise as rotas percorridas pelas máquinas
            </p>
          </div>

          {/* Filtros */}
          <Card className="mb-8 border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-green-600" />
                Filtros de Pesquisa
              </CardTitle>
              <CardDescription>
                Selecione a máquina e o período para visualizar o histórico
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seletor de Máquina */}
                <div className="space-y-2">
                  <Label htmlFor="device" className="text-sm font-medium text-gray-700">
                    Máquina
                  </Label>
                  <select
                    id="device"
                    value={selectedDevice || ''}
                    onChange={(e) => setSelectedDevice(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
                    disabled={devicesLoading}
                  >
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro de Data */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={dateFilter === 'today' ? 'default' : 'outline'}
                      onClick={() => setDateFilter('today')}
                      className={
                        dateFilter === 'today'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          : ''
                      }
                    >
                      Hoje
                    </Button>
                    <Button
                      variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                      onClick={() => setDateFilter('yesterday')}
                      className={
                        dateFilter === 'yesterday'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          : ''
                      }
                    >
                      Ontem
                    </Button>
                    <Button
                      variant={dateFilter === 'week' ? 'default' : 'outline'}
                      onClick={() => setDateFilter('week')}
                      className={
                        dateFilter === 'week'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          : ''
                      }
                    >
                      Última Semana
                    </Button>
                    <Button
                      variant={dateFilter === 'custom' ? 'default' : 'outline'}
                      onClick={() => setDateFilter('custom')}
                      className={
                        dateFilter === 'custom'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                          : ''
                      }
                    >
                      Customizado
                    </Button>
                  </div>
                </div>

                {/* Datas customizadas */}
                {dateFilter === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom" className="text-sm font-medium text-gray-700">
                        Data Inicial
                      </Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo" className="text-sm font-medium text-gray-700">
                        Data Final
                      </Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Botão Buscar */}
              <div className="mt-6">
                <Button
                  onClick={fetchHistory}
                  disabled={loading || !selectedDevice}
                  className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-600/30"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar Histórico
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Erro */}
          {error && !loading && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="p-6 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          {historyData && historyData.positions.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Distância Total */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-blue-50">
                      Distância Percorrida
                    </CardTitle>
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Navigation className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">
                      {displayStats?.totalDistance.toFixed(2)} km
                    </div>
                    <p className="text-xs text-blue-100 mt-1">
                      {displayStats?.pointCount} pontos registrados
                    </p>
                  </CardContent>
                </Card>

                {/* Tempo Total */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-purple-50">
                      Tempo Total
                    </CardTitle>
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">
                      {Math.floor((displayStats?.totalTime || 0) / 60)}h {Math.round((displayStats?.totalTime || 0) % 60)}m
                    </div>
                    <p className="text-xs text-purple-100 mt-1">
                      {Math.round(displayStats?.totalTime || 0)} minutos
                    </p>
                  </CardContent>
                </Card>

                {/* Velocidade Média */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-green-50">
                      Velocidade Média
                    </CardTitle>
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">
                      {displayStats?.avgSpeed.toFixed(1)} km/h
                    </div>
                    <p className="text-xs text-green-100 mt-1">
                      {isReplayMode ? `Atual: ${displayStats?.currentSpeed?.toFixed(1)} km/h` : 'Em movimento'}
                    </p>
                  </CardContent>
                </Card>

                {/* Velocidade Máxima */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-orange-50">
                      Velocidade Máxima
                    </CardTitle>
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Gauge className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">
                      {displayStats?.maxSpeed.toFixed(1)} km/h
                    </div>
                    <p className="text-xs text-orange-100 mt-1">
                      {isReplayMode ? 'Até o momento' : 'Pico de velocidade'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Controles de Replay */}
              <Card className="mb-8 border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Controles de Replay
                  </CardTitle>
                  <CardDescription className="text-blue-50">
                    Assista ao movimento da máquina em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {!isReplayMode ? (
                    <div className="text-center py-6">
                      <Button
                        onClick={startReplay}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/30"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Iniciar Replay
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Barra de progresso / Timeline */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>
                            {new Date(historyData.positions[currentReplayIndex].deviceTime).toLocaleTimeString('pt-BR')}
                          </span>
                          <span>
                            {currentReplayIndex + 1} / {historyData.positions.length} pontos
                          </span>
                          <span>
                            {new Date(historyData.positions[historyData.positions.length - 1].deviceTime).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={historyData.positions.length - 1}
                          value={currentReplayIndex}
                          onChange={(e) => setCurrentReplayIndex(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Início</span>
                          <span className="font-semibold text-blue-600">
                            {((currentReplayIndex / (historyData.positions.length - 1)) * 100).toFixed(0)}%
                          </span>
                          <span>Fim</span>
                        </div>
                      </div>

                      {/* Controles */}
                      <div className="flex flex-wrap items-center justify-center gap-4">
                        {/* Play/Pause */}
                        <Button
                          onClick={togglePlayPause}
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-5 w-5 mr-2" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="h-5 w-5 mr-2" />
                              Reproduzir
                            </>
                          )}
                        </Button>

                        {/* Reset */}
                        <Button
                          onClick={resetReplay}
                          variant="outline"
                          size="lg"
                        >
                          <RotateCcw className="h-5 w-5 mr-2" />
                          Reiniciar
                        </Button>

                        {/* Sair do modo replay */}
                        <Button
                          onClick={exitReplay}
                          variant="outline"
                          size="lg"
                        >
                          Sair do Replay
                        </Button>

                        {/* Seletor de velocidade */}
                        <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Velocidade:</span>
                          <div className="flex gap-1">
                            {[1, 2, 4, 8].map((speed) => (
                              <button
                                key={speed}
                                onClick={() => setPlaybackSpeed(speed)}
                                className={`px-3 py-1 rounded text-sm font-semibold transition-all ${
                                  playbackSpeed === speed
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Info atual */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Tempo Atual</p>
                          <p className="text-lg font-bold text-blue-700">
                            {new Date(historyData.positions[currentReplayIndex].deviceTime).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Distância Percorrida</p>
                          <p className="text-lg font-bold text-blue-700">
                            {displayStats?.totalDistance.toFixed(2)} km
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Velocidade</p>
                          <p className="text-lg font-bold text-blue-700">
                            {historyData.positions[currentReplayIndex].speed.toFixed(1)} km/h
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mapa */}
              <Card className="mb-8 border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Rota Percorrida - {selectedDeviceName}
                  </CardTitle>
                  <CardDescription className="text-green-50">
                    Visualização da trajetória no mapa com cores baseadas na velocidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <HistoryMap
                    positions={historyData.positions}
                    deviceName={selectedDeviceName}
                    replayMode={isReplayMode}
                    currentReplayIndex={currentReplayIndex}
                    speedConfig={historyData.speedConfig}
                  />
                </CardContent>
              </Card>

              {/* Legenda */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Legenda de Cores</CardTitle>
                  <CardDescription>
                    As cores da rota representam diferentes velocidades
                    {historyData.speedConfig && ' (personalizadas para este equipamento)'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="h-8 w-8 rounded-full bg-blue-600"></div>
                      <div>
                        <p className="font-semibold text-gray-900">Baixa</p>
                        <p className="text-sm text-gray-600">
                          ≤ {historyData.speedConfig?.low || 8} km/h
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="h-8 w-8 rounded-full bg-green-600"></div>
                      <div>
                        <p className="font-semibold text-gray-900">Ideal</p>
                        <p className="text-sm text-gray-600">
                          {historyData.speedConfig?.low || 8} - {historyData.speedConfig?.ideal || 18} km/h
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="h-8 w-8 rounded-full bg-yellow-500"></div>
                      <div>
                        <p className="font-semibold text-gray-900">Alta</p>
                        <p className="text-sm text-gray-600">
                          {historyData.speedConfig?.ideal || 18} - {historyData.speedConfig?.high || 30} km/h
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="h-8 w-8 rounded-full bg-red-600"></div>
                      <div>
                        <p className="font-semibold text-gray-900">Excesso</p>
                        <p className="text-sm text-gray-600">
                          &gt; {historyData.speedConfig?.high || 30} km/h
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Estado inicial (nenhuma busca feita) */}
          {!historyData && !loading && !error && (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Tractor className="h-10 w-10 text-green-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecione uma máquina e período
                  </h3>
                  <p className="text-gray-600">
                    Use os filtros acima para buscar o histórico de rotas
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
