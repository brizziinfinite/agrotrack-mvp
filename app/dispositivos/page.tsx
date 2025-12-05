'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Tractor, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  MapPin,
  Hash,
  Palette,
  Car,
  AlertCircle
} from 'lucide-react'

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
    speedIdealMax?: number
    speedHighMax?: number
    speedExtremeName?: string
  }
}

export default function MaquinasPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchDevices()
  }, [])

  async function fetchDevices() {
    try {
      const response = await fetch('/api/traccar/devices')
      const result = await response.json()

      if (result.success) {
        setDevices(result.data)
      } else {
        setError('Erro ao carregar dispositivos')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Tem certeza que deseja deletar "${name}"?`)) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch('/api/traccar/devices/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })

      const result = await response.json()

      if (result.success) {
        // Remover da lista
        setDevices(devices.filter(d => d.id !== id))
      } else {
        alert('Erro ao deletar: ' + result.error)
      }
    } catch (err: any) {
      alert('Erro ao deletar: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  function getCategoryIcon(category: string) {
    const icons: any = {
      tractor: '🚜',
      harvester: '🌾',
      sprayer: '💧',
      truck: '🚚',
      car: '🚗',
      van: '🚐',
      default: '📍'
    }
    return icons[category] || icons.default
  }

  function getStatusColor(status: string) {
    return status === 'online' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-gray-100 text-gray-700 border-gray-200'
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando dispositivos...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Cabeçalho */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                  <Tractor className="h-6 w-6 text-white" />
                </div>
                Gerenciar Dispositivos
              </h2>
              <p className="text-gray-600">
                Adicione, edite ou remova dispositivos do sistema
              </p>
            </div>
            
            <Button
              onClick={() => router.push('/dispositivos/nova')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Dispositivo
            </Button>
          </div>

          {/* Erro */}
          {error && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="p-6 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Lista de Dispositivos */}
          {devices.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12">
                <div className="text-center">
                  <Tractor className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum dispositivo cadastrado
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comece adicionando seu primeiro dispositivo ao sistema
                  </p>
                  <Button
                    onClick={() => router.push('/dispositivos/nova')}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Dispositivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <Card key={device.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {getCategoryIcon(device.category)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{device.name}</CardTitle>
                          <CardDescription>
                            {device.model || 'Sem modelo'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {/* IMEI */}
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">IMEI:</span>
                      <span className="font-mono text-gray-900">{device.uniqueId}</span>
                    </div>

                    {/* M2M */}
                    {device.attributes?.m2m && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">M2M:</span>
                        <span className="font-mono text-gray-900">{device.attributes.m2m}</span>
                      </div>
                    )}

                    {/* Placa */}
                    {device.attributes?.plate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Placa:</span>
                        <span className="font-semibold text-gray-900">{device.attributes.plate}</span>
                      </div>
                    )}

                    {/* Cor */}
                    {device.attributes?.color && (
                      <div className="flex items-center gap-2 text-sm">
                        <Palette className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Cor:</span>
                        <span className="text-gray-900">{device.attributes.color}</span>
                      </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => router.push(`/dispositivos/${device.id}/editar`)}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDelete(device.id, device.name)}
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        size="sm"
                        disabled={deletingId === device.id}
                      >
                        {deletingId === device.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deletando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
