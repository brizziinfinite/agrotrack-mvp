"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Activity,
  Clock,
  Search,
  Truck,
  Tractor,
} from "lucide-react"

export type Device = {
  id: number
  name: string
  uniqueId?: string
  category?: string
  status: string
  attributes?: {
    plate?: string
    m2m?: string
  }
  position: {
    latitude: number
    longitude: number
    speed: number
    deviceTime: string
  } | null
}

function formatTimeHHMM(deviceTime?: string) {
  if (!deviceTime) return "--:--"
  const d = new Date(deviceTime)
  if (Number.isNaN(d.getTime())) return "--:--"
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

function isMoving(d: Device) {
  return (d.position?.speed || 0) > 1
}

function getDeviceLabel(d: Device) {
  const plate = d.attributes?.plate?.trim()
  if (plate) return plate
  return d.uniqueId || String(d.id)
}

type Props = {
  devices: Device[]
  loading?: boolean
  error?: string | null
  selectedId?: number | null
  onSelect?: (device: Device) => void
}

export default function VehiclesPanel({
  devices,
  loading,
  error,
  selectedId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
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
    const moving = devices.filter((d) => isMoving(d)).length
    const offline = total - online
    const idle = Math.max(0, online - moving)
    return { total, online, moving, idle, offline }
  }, [devices])

  return (
    <div
      className="
        absolute left-4 top-4 z-50
        w-[92vw] sm:w-[380px]
        max-h-[calc(100dvh-16px)]
        overflow-hidden
      "
    >
      <div className="rounded-3xl border border-white/10 bg-[#0B1220]/72 backdrop-blur-xl shadow-[0_18px_70px_rgba(0,0,0,0.55)] overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-50">Dispositivos</h2>
              <p className="text-xs text-slate-400">Selecione para focar no mapa</p>
            </div>
          </div>

          {/* Pills */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Online</span>
                <span className="text-xs text-slate-100">{stats.online}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Em mov.</span>
                <span className="text-xs text-slate-100">{stats.moving}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Ocioso</span>
                <span className="text-xs text-slate-100">{stats.idle}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Offline</span>
                <span className="text-xs text-slate-100">{stats.offline}</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar dispositivo, placa, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950/40 border border-white/10 text-slate-50 placeholder:text-slate-500 rounded-2xl h-10"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="bg-white/5 text-slate-300 border border-white/10 px-2 py-1 rounded-lg gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online {stats.online}
            </Badge>
            <Badge className="bg-white/5 text-slate-300 border border-white/10 px-2 py-1 rounded-lg gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Em mov. {stats.moving}
            </Badge>
            <Badge className="bg-white/5 text-slate-300 border border-white/10 px-2 py-1 rounded-lg gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              Offline {stats.offline}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="px-3 py-3">
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              Carregando dispositivos...
            </div>
          ) : (
            <div className="max-h-[calc(100dvh-290px)] overflow-y-auto pr-1">
              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    Nenhum dispositivo encontrado.
                  </div>
                ) : (
                  filtered.map((d) => {
                    const moving = isMoving(d)
                    const online = d.status === "online"
                    const label = getDeviceLabel(d)
                    const speed = Math.round(d.position?.speed || 0)
                    const last = formatTimeHHMM(d.position?.deviceTime)

                    const icon =
                      (d.category || "").toLowerCase().includes("truck") ? (
                        <Truck className="h-4 w-4 text-slate-200" />
                      ) : (
                        <Tractor className="h-4 w-4 text-slate-200" />
                      )

                    const isSelected = selectedId === d.id

                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onSelect?.(d)}
                        className={[
                          "w-full text-left rounded-2xl border bg-white/5 px-3 py-3",
                          "transition hover:bg-white/[0.07] active:scale-[0.995]",
                          isSelected
                            ? "border-emerald-400/45 ring-1 ring-emerald-400/20"
                            : online
                            ? "border-emerald-400/20"
                            : "border-white/10",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-50 truncate">
                              {d.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400 truncate">
                              {label}
                            </p>
                          </div>

                          <span
                            className={[
                              "shrink-0 inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold",
                              online
                                ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
                                : "bg-rose-500/15 text-rose-200 border border-rose-400/20",
                            ].join(" ")}
                          >
                            {online ? (moving ? "Em mov." : "Online") : "Offline"}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                              {icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-slate-400">Tipo</p>
                              <p className="truncate">{d.category || "—"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                              <Activity className="h-4 w-4 text-slate-200" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-slate-400">Vel.</p>
                              <p className="truncate">{speed} km/h</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-slate-200" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-slate-400">Último</p>
                              <p className="truncate">{last}</p>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
