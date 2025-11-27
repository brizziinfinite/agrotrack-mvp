'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tractor, Navigation, Clock, AlertCircle, MapPin, TrendingUp } from 'lucide-react'
import './leaflet.css'

// Importar Map dinamicamente (client-side only)
const Map = dynamic(() => import('@/components/map'), {
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
  position: {
    latitude: number
    longitude: number
    speed: number
    deviceTime: string
    attributes: any
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const onlineDevices = devices.filter(d => d.status === 'online').length
  const offlineDevices = devices.filter(d => d.status === 'offline').length
  const devicesWithPosition = devices.filter(d => d.position).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do Traccar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div id="dashboard" className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard de Monitoramento
            </h2>
            <p className="text-gray-600">
              Acompanhe suas máquinas em tempo real
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Card Total Máquinas */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-blue-50">
                  Total Máquinas
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Tractor className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{devices.length}</div>
                <p className="text-xs text-blue-100 mt-1">Equipamentos cadastrados</p>
              </CardContent>
            </Card>

            {/* Card Online */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-green-50">
                  Online
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Navigation className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{onlineDevices}</div>
                <p className="text-xs text-green-100 mt-1">Máquinas ativas</p>
              </CardContent>
            </Card>

            {/* Card Offline */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-gray-500 to-gray-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-gray-50">
                  Offline
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{offlineDevices}</div>
                <p className="text-xs text-gray-100 mt-1">Máquinas inativas</p>
              </CardContent>
            </Card>

            {/* Card Com GPS */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-purple-50">
                  Com GPS
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{devicesWithPosition}</div>
                <p className="text-xs text-purple-100 mt-1">Com localização ativa</p>
              </CardContent>
            </Card>
          </div>

          {/* Mapa */}
          <Card id="mapa" className="mb-8 border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização em Tempo Real
              </CardTitle>
              <CardDescription className="text-green-50">
                Posição GPS das máquinas na Fazenda Santa Inês
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Map devices={devices} />
            </CardContent>
          </Card>

          {/* Devices List */}
          <Card id="maquinas" className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Tractor className="h-5 w-5 text-green-600" />
                Máquinas Cadastradas
              </CardTitle>
              <CardDescription>
                Lista de todos os rastreadores SL48 configurados
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
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center group-hover:from-green-200 group-hover:to-emerald-200 transition-all duration-300">
                        <Tractor className="h-6 w-6 text-green-700" />
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
                            <p className="font-bold text-gray-900">
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
                    <p className="font-medium">Nenhuma máquina cadastrada ainda.</p>
                    <p className="text-sm mt-2">
                      Configure os rastreadores SL48 no Traccar.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}