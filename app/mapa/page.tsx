"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Activity, Satellite, RefreshCw, History } from "lucide-react"

const Map = dynamic(() => import("@/components/ui/map"), { ssr: false })

type Device = {
  id: number
  name: string
  uniqueId?: string
  category?: string
  status: string
  attributes?: {
    plate?: string
    m2m?: string
    speedIdealMax?: number
    speedHighMax?: number
    speedExtremeName?: string
    color?: string
  }
  position: {
    latitude: number
    longitude: number
    speed: number
    deviceTime: string
  } | null
}

export default function MapaTempoRealPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchDevices()
  }, [])

  async function fetchDevices() {
    try {
      setLoading(true)
      const res = await fetch("/api/traccar/devices")
      const result = await res.json()
      if (result.success) {
        setDevices(result.data as Device[])
        setError(null)
      } else {
        setError(result.error || "Não foi possível carregar os dispositivos.")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dispositivos."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const filteredDevices = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return devices
    return devices.filter((d) => {
      const plate = (d.attributes?.plate || "").toLowerCase()
      const m2m = (d.attributes?.m2m || "").toLowerCase()
      const uniqueId = (d.uniqueId || "").toLowerCase()
      return (
        d.name.toLowerCase().includes(term) ||
        plate.includes(term) ||
        m2m.includes(term) ||
        uniqueId.includes(term) ||
        d.id.toString().includes(term)
      )
    })
  }, [devices, search])

  const stats = useMemo(() => {
    const total = devices.length
    const online = devices.filter((d) => d.status === "online").length
    const offline = total - online
    const moving = devices.filter((d) => (d.position?.speed || 0) > 1).length
    return { total, online, offline, moving }
  }, [devices])

  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-6 space-y-10">
        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 animate-fade-in">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-400/80">MONITORAMENTO</p>
            <h1 className="text-3xl font-semibold text-slate-50">Mapa em tempo real</h1>
            <p className="text-xs text-slate-500 animate-fade-in">
              Visualize dispositivos, rotas e status instantaneamente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              onClick={fetchDevices}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              variant="secondary"
              className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
              asChild
            >
              <a href="/historico">
                <History className="h-4 w-4 mr-2" />
                Ver histórico
              </a>
            </Button>
          </div>
        </div>

        {/* Filtros / Status */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out hover:border-emerald-400/20 hover:shadow-[0_0_25px_rgba(0,255,200,0.05)] animate-fade-in">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-300" />
                Status em tempo real
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 animate-fade-in">
                Resumo rápido da frota
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 pb-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-slate-400">Total</p>
                <p className="text-lg font-semibold text-slate-50">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-emerald-200">Online</p>
                <p className="text-lg font-semibold text-emerald-100">{stats.online}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-amber-200">Em movimento</p>
                <p className="text-lg font-semibold text-amber-100">{stats.moving}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-rose-200">Offline</p>
                <p className="text-lg font-semibold text-rose-100">{stats.offline}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out hover:border-emerald-400/20 hover:shadow-[0_0_25px_rgba(0,255,200,0.05)] animate-fade-in">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Satellite className="h-4 w-4 text-cyan-300" />
                Filtros rápidos
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 animate-fade-in">
                Busque por nome, placa ou ID
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 pb-4">
              <Input
                placeholder="Buscar dispositivo, placa, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-slate-950/40 border border-white/10 text-slate-50 placeholder:text-slate-500 rounded-2xl"
              />
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/5 text-slate-300 border border-white/10 px-2 py-1 rounded-lg gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online {stats.online}
                </Badge>
                <Badge className="bg-white/5 text-slate-300 border border-white/10 px-2 py-1 rounded-lg gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Em movimento {stats.moving}
                </Badge>
                <Badge className="bg-white/5 text-slate-300 border border-white/10 px-2 py-1 rounded-lg gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Offline {stats.offline}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card do mapa */}
        <Card className="bg-[#050816]/70 border border-white/5 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out hover:border-emerald-400/20 hover:shadow-[0_0_25px_rgba(0,255,200,0.05)] animate-slide-in-up">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 px-4 pt-4">
            <div>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-300" />
                Mapa em tempo real
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 animate-fade-in">
                Clique nos marcadores para ver detalhes do dispositivo.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Offline
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : loading ? (
              <div className="h-[650px] rounded-3xl border border-white/10 bg-slate-950/40 flex items-center justify-center text-slate-200">
                Carregando mapa...
              </div>
            ) : (
              <div className="h-[650px] rounded-3xl overflow-hidden border border-white/10 bg-slate-950/40">
                <Map devices={filteredDevices} enableGeofence={false} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
