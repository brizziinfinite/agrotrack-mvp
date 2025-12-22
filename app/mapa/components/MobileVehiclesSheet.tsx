"use client"

import { useMemo, useState } from "react"
import type { Device } from "./VehiclesPanel"
import { Input } from "@/components/ui/input"
import { Search, ChevronRight } from "lucide-react"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  devices: Device[]
  loading?: boolean
  error?: string | null
  onSelect?: (device: Device) => void
}

function isMoving(d: Device) {
  return (d.position?.speed || 0) > 1
}

function getStatusLabel(d: Device) {
  if (d.status !== "online")
    return { label: "Offline", dot: "bg-rose-500", text: "text-rose-200" }
  if (isMoving(d))
    return { label: "Em movimento", dot: "bg-emerald-500", text: "text-emerald-200" }
  return { label: "Estacionado", dot: "bg-amber-500", text: "text-amber-200" }
}

function getDeviceIcon(d: Device) {
  const c = (d.category || "").toLowerCase()
  if (c.includes("truck") || c.includes("caminh")) return "🚚"
  return "🚜"
}

export default function MobileVehiclesSheet({
  open,
  onOpenChange,
  devices,
  loading,
  error,
  onSelect,
}: Props) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return devices
    return devices.filter((d) => {
      const plate = (d.attributes?.plate || "").toLowerCase()
      const uniqueId = (d.uniqueId || "").toLowerCase()
      return (
        d.name.toLowerCase().includes(term) ||
        plate.includes(term) ||
        uniqueId.includes(term) ||
        String(d.id).includes(term)
      )
    })
  }, [devices, search])

  if (!open) return null

  return (
    <div className="lg:hidden">
      {/* overlay */}
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/55"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />

      {/* sheet */}
      <div
        className="
          fixed left-0 right-0 bottom-0 z-[70]
          max-h-[85dvh]
          rounded-t-3xl
          bg-[#0B1220]/92 backdrop-blur-xl
          border-t border-white/10
          shadow-[0_-18px_70px_rgba(0,0,0,0.65)]
          overflow-hidden
        "
      >
        {/* handle */}
        <div className="pt-2 pb-1 flex justify-center">
          <div className="h-1.5 w-10 rounded-full bg-white/20" />
        </div>

        {/* header */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-50">Dispositivos</h2>

            {/* bolinha total */}
            <div className="h-9 min-w-9 px-3 rounded-full bg-white/10 text-slate-100 border border-white/10 flex items-center justify-center text-sm font-semibold">
              {devices.length}
            </div>
          </div>

          {/* busca */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite nome ou ID do dispositivo..."
              className="
                pl-11 h-12 rounded-2xl
                bg-slate-950/40 border border-white/10
                text-slate-50 placeholder:text-slate-500
                focus-visible:ring-0 focus-visible:ring-offset-0
              "
            />
          </div>
        </div>

        {/* lista */}
        <div className="px-4 pb-4 overflow-y-auto max-h-[calc(85dvh-120px)]">
          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              Carregando dispositivos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              Nenhum dispositivo encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((d) => {
                const speed = Math.round(d.position?.speed || 0)
                const st = getStatusLabel(d)

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onSelect?.(d)}
                    className="
                      w-full text-left
                      rounded-2xl bg-white/5
                      border border-white/10
                      px-4 py-4
                      flex items-center gap-4
                      hover:bg-white/10
                      active:scale-[0.995] transition
                    "
                  >
                    {/* ícone */}
                    <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl">
                      {getDeviceIcon(d)}
                    </div>

                    {/* texto */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-50 truncate">
                          {d.name}
                        </p>

                        {/* velocidade */}
                        <div className="shrink-0 rounded-xl bg-white/10 text-slate-100 border border-white/10 px-3 py-1 text-sm font-semibold">
                          {speed} km/h
                        </div>
                      </div>

                      {/* status */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${st.dot}`} />
                        <span className={`text-sm ${st.text}`}>{st.label}</span>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
