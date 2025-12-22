'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, MapPin, Plus, AlertCircle, Loader2, Zap, Layers } from 'lucide-react'

interface Fence {
  id: number
  name: string
  description?: string
  devices: { id: number; name: string }[]
}

export default function CercasPage() {
  const [fences, setFences] = useState<Fence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchFences()
  }, [])

  async function fetchFences() {
    try {
      const res = await fetch('/api/traccar/geofences')
      const result = await res.json()
      if (result.success) {
        setFences(result.data as Fence[])
      } else {
        setError(result.error || 'Não foi possível carregar as cercas.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar cercas.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const filteredFences = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return fences
    return fences.filter((fence) => {
      const matchName = fence.name.toLowerCase().includes(term)
      const matchDesc = fence.description?.toLowerCase().includes(term)
      const matchDevice = fence.devices.some((d) =>
        `${d.name} ${d.id}`.toLowerCase().includes(term)
      )
      return matchName || matchDesc || matchDevice
    })
  }, [fences, search])

  const totalDevices = fences.reduce((sum, fence) => sum + fence.devices.length, 0)

  return (
    <div className="h-full overflow-y-auto p-6">
      <Header />
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.1),transparent_28%),#f7fafc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <Card className="overflow-hidden border-none shadow-xl">
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 px-6 py-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  <ShieldCheck className="h-4 w-4" />
                  Cercas Virtuais
                </div>
                <h1 className="text-3xl font-bold">Proteja áreas e rotas em tempo real</h1>
                <p className="text-sm text-emerald-50 max-w-2xl">
                  Veja todas as cercas ativas, os dispositivos vinculados e crie novas áreas com um clique.
                </p>
              </div>
              <Link href="/cercas/nova" className="inline-flex">
                <Button className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg shadow-black/10">
                  <Plus className="h-4 w-4 mr-2" />
                  Incluir nova cerca
                </Button>
              </Link>
            </div>
            <CardContent className="bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-2 uppercase">
                    <MapPin className="h-4 w-4" />
                    Cercas
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{fences.length}</p>
                  <p className="text-xs text-emerald-700">Áreas cadastradas</p>
                </div>
                <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-cyan-700 flex items-center gap-2 uppercase">
                    <Layers className="h-4 w-4" />
                    Dispositivos vinculados
                  </p>
                  <p className="text-2xl font-bold text-cyan-900 mt-1">{totalDevices}</p>
                  <p className="text-xs text-cyan-700">Total de associações</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-2 uppercase">
                    <Zap className="h-4 w-4" />
                    Ação rápida
                  </p>
                  <p className="text-sm text-amber-700 mt-1">Desenhe no mapa e salve em segundos.</p>
                  <Link href="/cercas/nova" className="inline-flex mt-2">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                      Nova cerca
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Cercas ativas</CardTitle>
                <CardDescription>Filtre por nome ou dispositivo vinculado.</CardDescription>
              </div>
              <div className="w-full sm:w-80">
                <Input
                  placeholder="Buscar por nome ou dispositivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <p className="text-gray-700">Carregando cercas...</p>
                </div>
              )}

              {error && !loading && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </CardContent>
                </Card>
              )}

              {!loading && !error && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFences.map((fence) => (
                      <Card key={fence.id} className="shadow-md border border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                              <MapPin className="h-4 w-4" />
                            </span>
                            {fence.name}
                          </CardTitle>
                          {fence.description && (
                            <CardDescription>{fence.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Dispositivos vinculados</span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 text-xs font-semibold">
                              {fence.devices.length}
                            </span>
                          </div>
                          {fence.devices.length > 0 ? (
                            <ul className="text-sm text-gray-900 space-y-1">
                              {fence.devices.map((device) => (
                                <li key={device.id} className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  #{device.id} · {device.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">Nenhum dispositivo vinculado.</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredFences.length === 0 && (
                    <Card className="border-dashed border-gray-300 bg-white/70 mt-4">
                      <CardContent className="p-6 text-center">
                        <p className="text-gray-700 font-medium mb-2">Nenhuma cerca encontrada.</p>
                        <p className="text-sm text-gray-600 mb-4">
                          Ajuste a busca ou crie uma nova cerca no mapa.
                        </p>
                        <Link href="/cercas/nova">
                          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Incluir nova cerca
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
