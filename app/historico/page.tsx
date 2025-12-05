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
  Search,
  Navigation,
  Clock,
  TrendingUp,
  Gauge,
  Tractor,
  AlertCircle,
  MapPin
} from 'lucide-react'
import { getDeviceIcon } from '@/lib/device-icons'

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
  category?: string
  status: string
}

interface Position {
  latitude: number
  longitude: number
  speed: number
  deviceTime: string
}

interface HistoryData {
  positions: Position[]
  statistics: {
    totalDistance: number
    totalTime: number
    avgSpeed: number
    maxSpeed: number
    pointCount: number
  }
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

  useEffect(() => {
    fetchDevices()
  }, [])

  async function fetchDevices() {
    try {
      const response = await fetch('/api/traccar/devices')
      const result = await response.json()

      if (result.success) {
        setDevices(result.data)
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
      setError('Selecione um dispositivo')
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

  const selectedDeviceObj = devices.find(d => d.id === selectedDevice)
  const selectedDeviceName = selectedDeviceObj?.name || ''
  const selectedDeviceIcon = getDeviceIcon(selectedDeviceObj?.category)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <History className="h-6 w-6 text-white" />
              </div>
              Histórico de Rotas
            </h2>
            <p className="text-gray-600">
              Visualize e analise as rotas percorridas pelos dispositivos
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
                Selecione o dispositivo e o período para visualizar o histórico
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="device">Dispositivo</Label>
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

                <div className="space-y-2">
                  <Label>Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={dateFilter === 'today' ? 'default' : 'outline'}
                      onClick={() => setDateFilter('today')}
                      className={dateFilter === 'today' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : ''}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                      onClick={() => setDateFilter('yesterday')}
                      className={dateFilter === 'yesterday' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : ''}
                    >
                      Ontem
                    </Button>
                    <Button
                      variant={dateFilter === 'week' ? 'default' : 'outline'}
                      onClick={() => setDateFilter('week')}
                      className={dateFilter === 'week' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : ''}
                    >
                      Última Semana
                    </Button>
                    <Button
                      variant={dateFilter === 'custom' ? 'default' : 'outline'}
                      onClick={() => setDateFilter('custom')}
                      className={dateFilter === 'custom' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : ''}
                    >
                      Customizado
                    </Button>
                  </div>
                </div>

                {dateFilter === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom">Data Inicial</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo">Data Final</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6">
                <Button
                  onClick={fetchHistory}
                  disabled={loading || !selectedDevice}
                  className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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

          {error && !loading && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="p-6 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {historyData && historyData.positions.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-lg">{selectedDeviceIcon.emoji}</span>
                      Distância Percorrida
                    </CardTitle>
                    <Navigation className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {historyData.statistics.totalDistance.toFixed(2)} km
                    </div>
                    <p className="text-xs text-blue-100 mt-1">
                      {historyData.statistics.pointCount} pontos registrados
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-lg">{selectedDeviceIcon.emoji}</span>
                      Tempo Total
                    </CardTitle>
                    <Clock className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {Math.floor(historyData.statistics.totalTime / 60)}h {historyData.statistics.totalTime % 60}m
                    </div>
                    <p className="text-xs text-purple-100 mt-1">
                      {historyData.statistics.totalTime} minutos
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-lg">{selectedDeviceIcon.emoji}</span>
                      Velocidade Média
                    </CardTitle>
                    <TrendingUp className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {historyData.statistics.avgSpeed.toFixed(1)} km/h
                    </div>
                    <p className="text-xs text-green-100 mt-1">Em movimento</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-lg">{selectedDeviceIcon.emoji}</span>
                      Velocidade Máxima
                    </CardTitle>
                    <Gauge className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {historyData.statistics.maxSpeed.toFixed(1)} km/h
                    </div>
                    <p className="text-xs text-orange-100 mt-1">Pico de velocidade</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-8 border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span className="text-lg">{selectedDeviceIcon.emoji}</span>
                    Rota Percorrida - {selectedDeviceName}
                  </CardTitle>
                  <CardDescription className="text-green-50">
                    Visualização da trajetória no mapa com replay animado
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <HistoryMap
                    positions={historyData.positions}
                    deviceName={selectedDeviceName}
                    icon={selectedDeviceIcon}
                    speedRules={{
                      ideal: selectedDeviceObj?.attributes?.speedIdealMax,
                      high: selectedDeviceObj?.attributes?.speedHighMax,
                      extremeName: selectedDeviceObj?.attributes?.speedExtremeName
                    }}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {!historyData && !loading && !error && (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12">
                <div className="text-center">
                    <div className="h-20 w-20 text-5xl mx-auto mb-4 flex items-center justify-center">
                      <span>{selectedDeviceIcon.emoji}</span>
                    </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecione um dispositivo e período
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
