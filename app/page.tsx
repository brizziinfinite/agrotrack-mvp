'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tractor, AlertCircle, MapPin, Wifi, PauseCircle, MoveRight, Smartphone } from 'lucide-react'
import './leaflet.css'
import { getDeviceIcon } from '@/lib/device-icons'
import Link from 'next/link'

function getSpeedColor(speed: number, attrs?: { speedIdealMax?: number; speedHighMax?: number }) {
  const ideal = Number(attrs?.speedIdealMax) || 0
  const high = Number(attrs?.speedHighMax) || 0
  if (ideal && speed <= ideal) return 'text-green-700'
  if (high && speed <= high) return 'text-amber-700'
  return 'text-red-700'
}

// Importar Map dinamicamente (client-side only)
const Map = dynamic(() => import('@/components/ui/map'), {
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
  attributes?: {
    speedIdealMax?: number
    speedHighMax?: number
    speedExtremeName?: string
  }
  position: {
    latitude: number
    longitude: number
    speed: number
    deviceTime: string
  } | null
}

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDevices()
    const interval = setInterval(fetchDevices, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDevices() {
    try {
      const response = await fetch('/api/traccar/devices')
      const result = await response.json()
      
      if (result.success) {
        setDevices(result.data)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dispositivos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const onlineDevices = devices.filter(d => d.status === 'online').length
  const offlineDevices = devices.filter(d => d.status === 'offline').length
  const movingDevices = devices.filter(d => d.position && d.position.speed > 1).length
  const stoppedDevices = devices.filter(d => d.position && d.position.speed <= 1 && d.status === 'online').length

  const statusSummary = [
    { label: 'Online', value: onlineDevices, color: '#16a34a' },
    { label: 'Offline', value: offlineDevices, color: '#6b7280' },
    { label: 'Em movimento', value: movingDevices, color: '#0ea5e9' },
    { label: 'Parado', value: stoppedDevices, color: '#f59e0b' }
  ]
  const totalStatus = statusSummary.reduce((sum, item) => sum + item.value, 0)
  let accumulator = 0
  const donutStops = statusSummary
    .map((item) => {
      const start = (accumulator / Math.max(totalStatus, 1)) * 100
      accumulator += item.value
      const end = (accumulator / Math.max(totalStatus, 1)) * 100
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  const statCards = [
    {
      title: 'Dispositivos',
      value: devices.length,
      icon: <Smartphone className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-50',
      href: '/dispositivos'
    },
    {
      title: 'Online',
      value: onlineDevices,
      icon: <Wifi className="h-5 w-5 text-green-600" />,
      bg: 'bg-green-50',
      href: '#mapa'
    },
    {
      title: 'Em movimento',
      value: movingDevices,
      icon: <MoveRight className="h-5 w-5 text-sky-600" />,
      bg: 'bg-sky-50',
      href: '#mapa'
    },
    {
      title: 'Parados',
      value: stoppedDevices,
      icon: <PauseCircle className="h-5 w-5 text-amber-500" />,
      bg: 'bg-amber-50',
      href: '#mapa'
    },
    {
      title: 'Offline',
      value: offlineDevices,
      icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
      bg: 'bg-gray-50',
      href: '#mapa'
    }
  ]

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-b-2 border-gray-900 animate-spin"></div>
            <p className="text-gray-600">Carregando dados do Traccar...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Erro na conexão
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Header />
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(59,169,255,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.08),transparent_28%),#0a1424] text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div id="dashboard" className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard de Monitoramento
            </h2>
            <p className="text-gray-600">
              Acompanhe seus dispositivos em tempo real
            </p>
          </div>

          {/* Stats Cards (clicáveis) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((card) => (
              <Link key={card.title} href={card.href} className="block group">
                <Card className="border border-border/60 bg-card/90 shadow-lg shadow-black/20 hover:shadow-xl transition-all duration-200 group-hover:-translate-y-0.5 rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.bg} bg-opacity-20`}> {card.icon}</div>
                    <span className="text-xs text-muted-foreground">Clique para ver</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{card.value}</div>
                    <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Donut status */}
          <Card className="mb-8 border border-border/60 bg-card/90 shadow-lg shadow-black/20 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Resumo de status</CardTitle>
                <CardDescription>Distribuição dos dispositivos por status</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative h-48 w-48 flex items-center justify-center">
                <div
                  className="h-44 w-44 rounded-full shadow-inner shadow-black/30"
                  style={{
                    background: totalStatus > 0 ? `conic-gradient(${donutStops})` : '#e5e7eb'
                  }}
                ></div>
                <div className="absolute h-24 w-24 bg-background rounded-full shadow-inner flex items-center justify-center border border-border/60">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">{totalStatus}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full max-w-md">
                {statusSummary.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-secondary">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{totalStatus > 0 ? Math.round((item.value / totalStatus) * 100) : 0}%</p>
                    </div>
                    <span className="text-lg font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mapa */}
          <Card id="mapa" className="mb-8 border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização em Tempo Real
              </CardTitle>
              <CardDescription className="text-green-50">
                Posição GPS dos dispositivos na Fazenda Santa Inês
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Map devices={devices} enableGeofence={false} />
            </CardContent>
          </Card>

          {/* Devices List */}
          <Card id="maquinas" className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Tractor className="h-5 w-5 text-green-600" />
                Dispositivos Cadastrados
              </CardTitle>
              <CardDescription>
                Lista de todos os dispositivos configurados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:shadow-md hover:border-green-300 transition-all duration-300 bg-white group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-300 text-2xl">
                        {getDeviceIcon(device.category).emoji}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{device.name}</h3>
                        <p className="text-sm text-gray-500">ID: {device.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {device.position && (
                        <>
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500 font-medium">Velocidade</p>
                            <p className={`font-bold ${getSpeedColor(device.position.speed, device.attributes)}`}>
                              {Math.round(device.position.speed)} km/h
                            </p>
                          </div>
                          <div className="text-right hidden lg:block">
                            <p className="text-xs text-gray-500 font-medium">Última atualização</p>
                            <p className="font-semibold text-xs text-gray-700">
                              {new Date(device.position.deviceTime).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </>
                      )}
                      <Badge
                        variant={device.status === 'online' ? 'default' : 'secondary'}
                        className={
                          device.status === 'online'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md shadow-green-600/30'
                            : 'bg-gray-400'
                        }
                      >
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                ))}

                {devices.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Tractor className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">Nenhum dispositivo cadastrado ainda.</p>
                    <p className="text-sm mt-2">Configure os rastreadores no Traccar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
