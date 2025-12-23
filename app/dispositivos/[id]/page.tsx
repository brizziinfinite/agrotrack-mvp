"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, MapPin, Gauge, ShieldCheck, ShieldOff, Satellite, Power } from "lucide-react"

type DeviceDetail = {
  id: number
  name: string
  uniqueId?: string
  status: string
  attributes?: {
    plate?: string
    ignition?: boolean
  }
  position?: {
    speed: number
    deviceTime: string
    latitude: number
    longitude: number
  } | null
}

export default function DeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deviceId = Number(params.id)
  const [device, setDevice] = useState<DeviceDetail | null>(null)
  const [stats, setStats] = useState<{
    over_speed_count: number
    over_speed_duration_minutes: number
    harsh_brake_count: number
    harsh_turn_count: number
    engine_rotation: number | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commandLoading, setCommandLoading] = useState<"block" | "unblock" | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    if (Number.isNaN(deviceId)) {
      setError("ID inválido.")
      setLoading(false)
      return
    }

    async function fetchDevice() {
      try {
        setLoading(true)
        const response = await fetch(`/api/traccar/devices/${deviceId}`)
        const result = await response.json()
        if (result.success) {
          setDevice(result.data as DeviceDetail)
          setError(null)
        } else {
          setError(result.error || "Não foi possível carregar o dispositivo.")
        }
      } catch (err) {
        setError("Falha ao carregar dados do dispositivo.")
      } finally {
        setLoading(false)
      }
    }

    async function fetchStats() {
      try {
        const response = await fetch(`/api/traccar/devices/${deviceId}/stats`)
        const result = await response.json()
        if (result.success) {
          setStats(result.data)
        }
      } catch {
        // silencioso
      }
    }

    fetchDevice()
    fetchStats()
  }, [deviceId])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const statusLabel = useMemo(() => {
    if (!device) return ""
    if (device.status !== "online") return "Offline"
    const speed = Math.round(device.position?.speed || 0)
    if (speed > 1) return "Em movimento"
    return "Estacionado"
  }, [device])

  const lastUpdate = useMemo(() => {
    const ts = device?.position?.deviceTime
    if (!ts) return "--:--"
    const date = new Date(ts)
    if (Number.isNaN(date.getTime())) return "--:--"
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  }, [device])

  const disabledCommand = !(device && device.status === "online" && device.position)

  async function handleCommand(action: "block" | "unblock", label: string) {
    if (!device) return
    if (action === "block" && typeof window !== "undefined") {
      const confirmed = window.confirm("Confirmar bloqueio do veículo?")
      if (!confirmed) return
    }
    try {
      setCommandLoading(action)
      const response = await fetch(`/api/traccar/commands/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id }),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Falha ao enviar comando.")
      }
      setToast({ type: "success", message: `${label} enviado com sucesso.` })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar comando."
      setToast({ type: "error", message })
    } finally {
      setCommandLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050816] text-slate-200">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p>Carregando dispositivo...</p>
        </div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#050816] text-slate-200">
        <p className="text-lg font-semibold text-rose-300">{error || "Dispositivo não encontrado."}</p>
        <Button variant="outline" className="mt-4 border-white/20 text-white" onClick={() => router.push("/mapa")}>
          Voltar ao mapa
        </Button>
      </div>
    )
  }

  const speed = Math.round(device.position?.speed || 0)
  const ignition = device.attributes?.ignition
  const coords = device.position
    ? `${device.position.latitude.toFixed(5)}, ${device.position.longitude.toFixed(5)}`
    : "—"

  return (
    <div className="flex h-dvh flex-col bg-[#050816] text-slate-100">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 pb-24">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Dispositivo</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">{device.name}</h1>
              <p className="text-sm text-slate-300">
                Atualizado às <span className="font-semibold text-white">{lastUpdate}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  device.status === "online"
                    ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                    : "border border-red-400/40 bg-red-500/20 text-red-100"
                )}
              >
                {device.status === "online" ? "Online" : "Offline"}
              </span>
              <span className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-100">{statusLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="border border-white/20 bg-white/10 text-white" onClick={() => router.push(`/mapa?device=${device.id}`)}>
              <MapPin className="mr-2 h-4 w-4" />
              Ver no mapa
            </Button>
            <Button
              variant="secondary"
              className="border border-white/20 bg-white/10 text-white"
              onClick={() => {
                const params = new URLSearchParams({
                  deviceId: String(device.id),
                  deviceName: device.name,
                })
                router.push(`/historico?${params.toString()}`)
              }}
            >
              <Satellite className="mr-2 h-4 w-4" />
              Histórico
            </Button>
            <Button
              variant="secondary"
              disabled={disabledCommand || commandLoading === "block"}
              className="border border-rose-500/50 bg-rose-500/10 text-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleCommand("block", "Bloqueio")}
            >
              {commandLoading === "block" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
              Bloquear
            </Button>
            <Button
              variant="secondary"
              disabled={disabledCommand || commandLoading === "unblock"}
              className="border border-emerald-500/50 bg-emerald-500/10 text-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleCommand("unblock", "Desbloqueio")}
            >
              {commandLoading === "unblock" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Desbloquear
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={<Gauge className="h-5 w-5 text-emerald-300" />} title="Velocidade" value={`${speed} km/h`} />
          <StatCard
            icon={<Power className="h-5 w-5 text-yellow-300" />}
            title="Ignição"
            value={typeof ignition === "boolean" ? (ignition ? "Ligada" : "Desligada") : "—"}
          />
          <StatCard icon={<MapPin className="h-5 w-5 text-cyan-300" />} title="Coordenadas" value={coords} />
          <StatCard
            icon={<Satellite className="h-5 w-5 text-purple-300" />}
            title="Identificação"
            value={
              <div className="text-xs text-slate-200">
                <p>IMEI: {device.uniqueId || "—"}</p>
                <p>Placa: {device.attributes?.plate || "—"}</p>
              </div>
            }
          />
          <StatCard icon={<MapPin className="h-5 w-5 text-pink-300" />} title="Endereço" value="—" />
        </div>

        {!device.position && (
          <p className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Sem posição disponível para este dispositivo.
          </p>
        )}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Eventos recentes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Satellite className="h-5 w-5 text-rose-300" />}
              title="Excessos de velocidade"
              value={
                <div className="text-xs text-slate-200">
                  <p>{stats?.over_speed_count ?? 0} vezes</p>
                  <p>{stats?.over_speed_duration_minutes ?? 0} min acima do limite</p>
                </div>
              }
            />
            <StatCard
              icon={<Satellite className="h-5 w-5 text-amber-300" />}
              title="Frenagens bruscas"
              value={`${stats?.harsh_brake_count ?? 0} ocorrências`}
            />
            <StatCard
              icon={<Satellite className="h-5 w-5 text-cyan-300" />}
              title="Curvas bruscas"
              value={`${stats?.harsh_turn_count ?? 0} ocorrências`}
            />
            <StatCard
              icon={<Satellite className="h-5 w-5 text-purple-300" />}
              title="Rotação do motor"
              value={stats?.engine_rotation ? `${stats.engine_rotation} rpm` : "—"}
            />
          </div>
        </div>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4">
          <div
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg",
              toast.type === "success" ? "bg-emerald-500/90" : "bg-rose-500/90"
            )}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_45px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">{icon}{title}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{typeof value === "string" ? value : value}</div>
    </div>
  )
}
