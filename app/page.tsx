'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tractor, Navigation, Clock, AlertCircle, MapPin } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚜 AgroTrack MVP
          </h1>
          <p className="text-gray-600">
            Sistema de Telemetria Agrícola - Fazenda Santa Inês
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Máquinas
              </CardTitle>
              <Tractor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Online
              </CardTitle>
              <Navigation className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{onlineDevices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Offline
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">{offlineDevices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Com GPS
              </CardTitle>
              <MapPin className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{devicesWithPosition}</div>
            </CardContent>
          </Card>
        </div>

        {/* Mapa */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização em Tempo Real
            </CardTitle>
            <CardDescription>
              Posição GPS das máquinas na Fazenda Santa Inês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Map devices={devices} />
          </CardContent>
        </Card>

        {/* Devices List */}
        <Card>
          <CardHeader>
            <CardTitle>Máquinas Cadastradas</CardTitle>
            <CardDescription>
              Lista de todos os rastreadores SL48 configurados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Tractor className="h-8 w-8 text-gray-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{device.name}</h3>
                      <p className="text-sm text-gray-600">ID: {device.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {device.position && (
                      <>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Velocidade</p>
                          <p className="font-semibold">
                            {Math.round(device.position.speed)} km/h
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Última atualização</p>
                          <p className="font-semibold text-xs">
                            {new Date(device.position.deviceTime).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </>
                    )}
                    <Badge
                      variant={device.status === 'online' ? 'default' : 'secondary'}
                      className={
                        device.status === 'online'
                          ? 'bg-green-600'
                          : 'bg-gray-400'
                      }
                    >
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              ))}

              {devices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Tractor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma máquina cadastrada ainda.</p>
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
  )
}