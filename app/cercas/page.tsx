"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AlertCircle, Eye, Loader2, MapPin, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react"
import type { GeofenceShape } from "./components/GeofenceMapView"

interface Fence {
  id: number
  name: string
  description?: string
  area: string
  devices: { id: number; name: string }[]
}

const GeofenceMapView = dynamic(() => import("./components/GeofenceMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] w-full items-center justify-center rounded-3xl border border-white/10 bg-[#0b1220]/60 text-sm text-slate-400">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Carregando mapa...
    </div>
  ),
})

type ParsedFence = Fence & {
  shapeType: "circle" | "polygon" | null
  shapePayload: GeofenceShape | null
}

type Toast = { type: "success" | "error"; message: string }

export default function CercasPage() {
  const router = useRouter()
  const [fences, setFences] = useState<Fence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedFenceId, setSelectedFenceId] = useState<number | null>(null)
  const [focusFenceId, setFocusFenceId] = useState<number | null>(null)
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchFences()
  }, [])

  async function fetchFences() {
    try {
      setLoading(true)
      const res = await fetch("/api/traccar/geofences")
      const result = await res.json()
      if (result.success) {
        setFences(result.data as Fence[])
        setError(null)
        if ((result.data as Fence[]).length > 0) {
          setSelectedFenceId((result.data as Fence[])[0].id)
        }
      } else {
        setError(result.error || "Não foi possível carregar as cercas.")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao carregar cercas."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const parsedFences: ParsedFence[] = useMemo(
    () =>
      fences.map((fence) => {
        const shape = parseGeofenceArea(fence.area)
        return {
          ...fence,
          shapeType: shape?.type ?? null,
          shapePayload: shape
            ? {
                ...shape,
                id: fence.id,
                name: fence.name,
              }
            : null,
        }
      }),
    [fences]
  )

  const filteredFences = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return parsedFences
    return parsedFences.filter((fence) => {
      const name = fence.name.toLowerCase()
      const desc = fence.description?.toLowerCase() || ""
      const devices = fence.devices.map((device) => `${device.id} ${device.name}`.toLowerCase())
      return name.includes(term) || desc.includes(term) || devices.some((item) => item.includes(term))
    })
  }, [parsedFences, search])

  const geofenceShapes = useMemo(
    () =>
      parsedFences
        .map((fence) => fence.shapePayload)
        .filter((shape): shape is GeofenceShape => Boolean(shape)),
    [parsedFences]
  )

  const totalDevices = fences.reduce((sum, fence) => sum + fence.devices.length, 0)

  function handleView(fenceId: number) {
    setSelectedFenceId(fenceId)
    setFocusFenceId(fenceId)
    setMobileListOpen(false)
  }

  function handleEdit(fenceId: number) {
    router.push(`/cercas/nova?geofence=${fenceId}`)
  }

  async function handleDelete(fence: Fence) {
    const confirmed = window.confirm(`Remover a cerca "${fence.name}"?`)
    if (!confirmed) return
    try {
      setDeletingId(fence.id)
      const response = await fetch(`/api/traccar/geofences/${fence.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Erro ao remover cerca.")
      }
      setToast({ type: "success", message: "Cerca removida com sucesso." })
      setFences((prev) => prev.filter((item) => item.id !== fence.id))
      if (selectedFenceId === fence.id) {
        setSelectedFenceId(null)
        setFocusFenceId(null)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao remover cerca."
      setToast({ type: "error", message })
    } finally {
      setDeletingId(null)
    }
  }

  const listContent = (
    <div className="space-y-3">
      {filteredFences.length === 0 && !loading && !error && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-300">
          Nenhuma cerca encontrada.
        </div>
      )}

      {filteredFences.map((fence) => {
        const isSelected = fence.id === selectedFenceId
        return (
          <div
            key={fence.id}
            className={cn(
              "rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-400/40 hover:bg-white/10",
              isSelected && "border-emerald-400/60 bg-emerald-500/10"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">{fence.name}</p>
                <p className="text-xs text-slate-400">
                  {fence.shapeType === "circle" ? "Círculo" : fence.shapeType === "polygon" ? "Polígono" : "Sem forma"}
                </p>
              </div>
              <Badge className="rounded-full border border-emerald-400/30 bg-emerald-500/10 text-xs text-emerald-100">
                Ativa
              </Badge>
            </div>
            {fence.description && <p className="mt-2 text-xs text-slate-400">{fence.description}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              {fence.devices.length > 0 ? (
                fence.devices.slice(0, 2).map((device) => (
                  <span key={device.id} className="rounded-full border border-white/10 px-2.5 py-0.5">
                    #{device.id} · {device.name}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500">Sem dispositivos vinculados</span>
              )}
              {fence.devices.length > 2 && (
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-slate-400">
                  +{fence.devices.length - 2}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={!fence.shapePayload}
                onClick={() => handleView(fence.id)}
                className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver no mapa
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEdit(fence.id)}
                className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 text-xs text-slate-200 hover:bg-white/10"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deletingId === fence.id}
                onClick={() => handleDelete(fence)}
                className="flex items-center gap-1 rounded-xl border border-white/15 bg-rose-500/15 text-xs text-rose-100 hover:bg-rose-500/25"
              >
                {deletingId === fence.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Excluir
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex h-dvh flex-col bg-[#050816] text-slate-100">
      <Header />
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_35px_80px_rgba(0,0,0,0.45)] backdrop-blur-lg lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Cercas virtuais</p>
              <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                </span>
                Supervisão das áreas
              </h1>
              <p className="text-sm text-slate-400">Mapa em tempo real com todas as cercas e dispositivos vinculados.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/cercas/nova">
                <Button className="rounded-2xl bg-emerald-500/90 px-4 text-white hover:bg-emerald-400">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova cerca
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={fetchFences}
                className="rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                Atualizar
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard icon={<MapPin className="h-4 w-4 text-emerald-300" />} title="Cercas" value={fences.length} detail="Áreas registradas" />
            <SummaryCard icon={<ShieldCheck className="h-4 w-4 text-cyan-300" />} title="Vínculos" value={totalDevices} detail="Dispositivos associados" />
            <SummaryCard icon={<AlertCircle className="h-4 w-4 text-amber-300" />} title="Status" value="Ativas" detail="Monitoramento constante" />
          </div>

  <div className="grid flex-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
    <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0b1220]/80 p-4 backdrop-blur">
      <p className="text-sm font-semibold text-white">Mapa interativo</p>
      <p className="text-xs text-slate-400">Clique na cerca ou selecione na lista para centralizar.</p>
      <div className="mt-4 flex-1">
        <GeofenceMapView geofences={geofenceShapes} selectedId={selectedFenceId} focusId={focusFenceId} onSelect={setSelectedFenceId} />
      </div>
    </div>

    <div className="hidden rounded-3xl border border-white/10 bg-[#0b1220]/80 p-4 lg:flex lg:flex-col">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Cercas cadastradas</p>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{fences.length}</span>
      </div>
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por nome ou dispositivo"
        className="mt-3 rounded-2xl border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500"
      />
      <div className="mt-4 flex-1 overflow-y-auto pr-1">{loading ? <ListLoading /> : error ? <ListError message={error} /> : listContent}</div>
    </div>
  </div>

          {!loading && !error && (
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setMobileListOpen(true)}
                className="fixed right-4 bottom-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-emerald-500 text-white shadow-lg"
                aria-label="Abrir lista de cercas"
              >
                <MapPin className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileListOpen && (
        <div className="lg:hidden">
          <button type="button" aria-label="Fechar lista" className="fixed inset-0 z-30 bg-black/60" onClick={() => setMobileListOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border border-white/10 bg-[#0b1220] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Cercas</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-slate-200"
                onClick={() => setMobileListOpen(false)}
              >
                ×
              </Button>
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar..."
              className="mb-3 rounded-2xl border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500"
            />
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-2">{listContent}</div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4">
          <div
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg",
              toast.type === "success" ? "bg-emerald-500/80" : "bg-rose-500/80"
            )}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}

function parseGeofenceArea(area: string): Omit<GeofenceShape, "id" | "name"> | null {
  if (!area) return null
  const normalized = area.trim().toUpperCase()
  if (normalized.startsWith("CIRCLE")) {
    const match = area.match(/CIRCLE\s*\(([-\d.]+)\s+([-\d.]+),\s*([-\d.]+)\)/i)
    if (!match) return null
    const lng = Number(match[1])
    const lat = Number(match[2])
    const radius = Number(match[3])
    if ([lat, lng, radius].some((value) => Number.isNaN(value))) return null
    return {
      type: "circle",
      center: { lat, lng },
      radius,
    }
  }

  if (normalized.startsWith("POLYGON")) {
    const match = area.match(/\(\((.+)\)\)/)
    if (!match) return null
    const points = match[1]
      .split(",")
      .map((pair) => pair.trim().split(/\s+/).map((value) => Number(value)))
      .filter(([lng, lat]) => !Number.isNaN(lat) && !Number.isNaN(lng))
      .map(([lng, lat]) => ({ lat, lng }))
    if (points.length === 0) return null
    return { type: "polygon", points }
  }

  return null
}

function SummaryCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: React.ReactNode
  title: string
  value: string | number
  detail: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-400">{detail}</p>
    </div>
  )
}

function ListLoading() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
      Carregando cercas...
    </div>
  )
}

function ListError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
      {message}
    </div>
  )
}
