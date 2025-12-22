'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, MapPin, Plus } from 'lucide-react'
import dynamic from 'next/dynamic'

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
  category?: string
  status: string
  position: {
    latitude: number
    longitude: number
    speed: number
    deviceTime: string
  } | null
}

export default function NovaCercaPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setError('Erro ao carregar dispositivos.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dispositivos.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                Incluir nova cerca
              </h1>
              <p className="text-gray-600">
                Desenhe no mapa, escolha o dispositivo e salve a cerca virtual.
              </p>
            </div>

            <Button variant="outline" asChild>
              <a href="/cercas">
                Ver cercas ativas
              </a>
            </Button>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                Criar cerca virtual
              </CardTitle>
              <CardDescription>
                Use as ferramentas do mapa (lado esquerdo) para desenhar polígono, círculo ou linha livre (lápis). Depois, selecione o dispositivo e salve.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
                  <span className="text-gray-700">Carregando dispositivos...</span>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : (
                <div id="mapa">
                  <Map devices={devices} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
