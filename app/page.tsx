/* ARQUIVO INTEIRO CORRIGIDO — COLE TUDO */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Header from '@/components/header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tractor, Navigation, AlertCircle, MapPin } from 'lucide-react'
import './leaflet.css'

// Importar Map dinamicamente (client-side only)
const Map = dynamic(() => import('@/components/map'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-lg border bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Carregando mapa...</p>
    </div>
  ),
})

interface DevicePosition {
  latitude: number
  longitude: number
  speed: number
  deviceTime: string
  attributes: Record<string, unknown>
}

interface Device {
  id: number
  name: string
  status: string
  position: DevicePosition | null
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
        setDevices(result.data as Device[])
        setError(null)
      } else {
        setError(result.error ?? 'Erro ao buscar dispositivos')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro desconhecido ao carregar dispositivos')
      }
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#ecfdf3_0,#f7fbf8_35%,#f7fbf8_100%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Page Title */}
          <div id="dashboard" className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Visão geral
            </span>
            <h2 className="text-3xl font-semibold text-slate-900">
              Dashboard de Monitoramento
            </h2>
            <p className="text-sm text-slate-600">
              Acompanhe em tempo real o status e as rotas das suas máquinas.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                title: 'Total de máquinas',
                value: devices.length,
                icon: <Tractor className="h-5 w-5 text-emerald-700" />,
                tone: 'bg-emerald-50 text-emerald-700',
                hint: 'Cadastradas no Traccar',
              },
              {
                title: 'Online',
                value: onlineDevices,
                icon: <Navigation className="h-5 w-5 text-green-700" />,
                tone: 'bg-green-50 text-green-700',
                hint: 'Máquinas ativas',
              },
              {
                title: 'Offline',
                value: offlineDevices,
                icon: <AlertCircle className="h-5 w-5 text-amber-700" />,
                tone: 'bg-amber-50 text-amber-700',
                hint: 'Sem transmissão',
              },
              {
                title: 'Com localização',
                value: devicesWithPosition,
                icon: <MapPin className="h-5 w-5 text-sky-700" />,
                tone: 'bg-sky-50 text-sky-700',
                hint: 'Posição atualizada',
              },
            ].map((item, idx) => (
              <Card
                key={idx}
                className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">
                    {item.title}
                  </CardTitle>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.tone}`}>
                    {item.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-slate-900">{item.value}</div>
                  <p className="text-xs text-slate-500 mt-1">{item.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mapa */}
          <Card id="mapa" className="border border-slate-100 shadow-md overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <MapPin className="h-5 w-5 text-emerald-700" />
                    Localização em Tempo Real
                  </CardTitle>
                  <CardDescription>Posição GPS das máquinas na fazenda.</CardDescription>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Tempo real
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Map devices={devices} />
            </CardContent>
          </Card>

          {/* CTA Histórico */}
          <Card className="border border-slate-100 shadow-sm">
            <CardContent className="py-5 px-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Rotas e relatórios
                </p>
                <h3 className="text-lg font-semibold text-slate-900">Histórico de trajetos</h3>
                <p className="text-sm text-slate-600">
                  Consulte rotas, estatísticas de distância, velocidades e exporte CSV/GPX.
                </p>
              </div>
              <Button asChild className="px-5">
                <Link href="/historico">Abrir Histórico</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Devices List */}
          <Card id="maquinas" className="border border-slate-100 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Tractor className="h-5 w-5 text-emerald-700" />
                Máquinas cadastradas
              </CardTitle>
              <CardDescription>Lista de rastreadores e status de telemetria.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {devices.map(device => (
                  <div
                    key={device.id}
                    className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border border-slate-100 rounded-xl bg-white hover:border-emerald-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                        <Tractor className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {device.name}
                        </h3>
                        <p className="text-sm text-slate-500">ID: {device.id}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      {device.position && (
                        <>
                          <div className="text-left md:text-right">
                            <p className="text-xs text-slate-500 font-medium">
                              Velocidade
                            </p>
                            <p className="font-semibold text-slate-900">
                              {Math.round(device.position.speed)} km/h
                            </p>
                          </div>
                          <div className="text-left md:text-right min-w-[160px]">
                            <p className="text-xs text-slate-500 font-medium">
                              Última atualização
                            </p>
                            <p className="font-semibold text-xs text-slate-700">
                              {new Date(
                                device.position.deviceTime,
                              ).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          device.status === 'online'
                            ? 'border-green-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }
                      >
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                ))}

                {devices.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Tractor className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="font-medium">
                      Nenhuma máquina cadastrada ainda.
                    </p>
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
