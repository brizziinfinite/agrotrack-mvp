"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Device } from "./VehiclesPanel"
import { X, MapPin, Crosshair, History, Settings2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

type Props = {
  open: boolean
  device: Device | null
  onClose: () => void
  onCenter?: () => void
  onToggleFollow?: () => void
  isFollowing?: boolean
}

function formatTimeHHMM(dateString?: string | null) {
  if (!dateString) return "--:--"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "--:--"
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

function getStatusBadge(device: Device | null) {
  if (!device) {
    return {
      label: "Sem dados",
      className: "bg-white/10 text-slate-300 border border-white/15",
    }
  }

  const speed = Math.round(device.position?.speed || 0)
  if (device.status !== "online") {
    return {
      label: "Offline",
      className: "bg-rose-500/15 text-rose-200 border border-rose-400/30",
    }
  }

  if (speed > 1) {
    return {
      label: "Em movimento",
      className: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30",
    }
  }

  return {
    label: "Estacionado",
    className: "bg-amber-500/15 text-amber-200 border border-amber-400/30",
  }
}

export default function MobileDeviceDetailsSheet({
  open,
  device,
  onClose,
  onCenter,
  onToggleFollow,
  isFollowing,
}: Props) {
  const router = useRouter()
  const [commandsOpen, setCommandsOpen] = useState(false)
  const commandsRef = useRef<HTMLDivElement | null>(null)
  const [commandMessage, setCommandMessage] = useState<string | null>(null)
  const [commandError, setCommandError] = useState<string | null>(null)
  const [commandLoading, setCommandLoading] = useState(false)
  const [blockedState, setBlockedState] = useState<"blocked" | "unblocked" | null>(null)
  const badge = useMemo(() => getStatusBadge(device), [device])

  useEffect(() => {
    if (!commandsOpen) return
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (commandsRef.current && !commandsRef.current.contains(event.target as Node)) {
        setCommandsOpen(false)
      }
    }
    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [commandsOpen, open])

  async function sendCommand(type: string, description: string, nextState?: "blocked" | "unblocked") {
    if (!device) return
    setCommandError(null)
    setCommandMessage(null)
    setCommandLoading(true)
    try {
      const response = await fetch("/api/traccar/commands/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: device.id, type }),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Falha ao enviar comando.")
      }
      setCommandMessage(`${description} enviado.`)
      setCommandsOpen(false)
      if (nextState) {
        setBlockedState(nextState)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar comando."
      setCommandError(message)
    } finally {
      setCommandLoading(false)
    }
  }

  if (!open || !device) return null

  const speed = Math.round(device.position?.speed || 0)
  const lastUpdate = formatTimeHHMM(device.position?.deviceTime)
  const latitude = device.position?.latitude?.toFixed(6) ?? "—"
  const longitude = device.position?.longitude?.toFixed(6) ?? "—"
  const plate = device.attributes?.plate?.trim()
  const statusLabel = device.status === "online" ? "Online" : "Offline"
  const activityLabel = badge.label
  const identifier = plate || device.uniqueId || `ID #${device.id}`
  const coordsText =
    device.position && device.position.latitude && device.position.longitude
      ? `Lat ${latitude} · Lon ${longitude}`
      : "Coordenadas indisponíveis"

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Fechar detalhes"
        className="fixed inset-0 z-[60] bg-black/55"
        onClick={onClose}
      />

      <div
        className="
          fixed left-0 right-0 bottom-0 z-[70]
          max-h-[35dvh]
          rounded-t-[22px]
          bg-[#0B1220]/92 backdrop-blur-2xl
          border-t border-white/15
          shadow-[0_-16px_50px_rgba(0,0,0,0.55)]
          overflow-visible
          px-4 pt-2 pb-3 space-y-3
        "
      >
        <div className="flex items-center justify-between gap-3 pb-1">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Dispositivo</p>
            <h2 className="text-base font-semibold text-white truncate">{device.name}</h2>
            <p className="text-xs text-slate-400 truncate">{identifier}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-white/12 bg-white/5 text-slate-200 flex items-center justify-center transition hover:bg-white/10"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-white truncate">
            {statusLabel} <span className="text-slate-400">• {activityLabel}</span>
            <span className="ml-2 text-xs font-normal text-slate-400">· {lastUpdate}</span>
          </p>
          <p className="text-2xl font-semibold text-white">{speed} km/h</p>
        </div>

        <div className="relative">
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-100">
            <button
              type="button"
              onClick={() => onCenter?.()}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-100">
                <Crosshair className="h-4 w-4" />
              </span>
              <span>Centralizar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({
                  deviceId: String(device.id),
                  deviceName: device.name,
                })
                router.push(`/historico?${params.toString()}`)
              }}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-100">
                <History className="h-4 w-4" />
              </span>
              <span>Histórico</span>
            </button>
            <div className="relative flex flex-1 flex-col items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCommandsOpen((prev) => !prev)
                }}
                className="flex w-full flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-100">
                  <Settings2 className="h-4 w-4" />
                </span>
                <span>Comandos</span>
              </button>
              {commandsOpen && (
                <div
                  ref={commandsRef}
                  className="absolute right-0 bottom-full z-10 mb-2 w-40 rounded-2xl border border-white/10 bg-[#101b2f]/95 p-2 text-xs text-slate-100 shadow-lg"
                >
                  <button
                    type="button"
                    disabled={commandLoading}
                    onClick={() => sendCommand("engineStop", "Bloqueio", "blocked")}
                    className={`w-full rounded-xl px-3 py-2 text-left text-[11px] transition hover:-translate-y-0.5 disabled:opacity-50 ${
                      blockedState === "blocked"
                        ? "border border-rose-400/60 bg-rose-500/20 text-rose-100"
                        : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                    }`}
                  >
                    {blockedState === "blocked" ? "Veículo bloqueado" : "Bloquear veículo"}
                  </button>
                  <button
                    type="button"
                    disabled={commandLoading}
                    onClick={() => sendCommand("engineResume", "Desbloqueio", "unblocked")}
                    className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-[11px] transition hover:-translate-y-0.5 disabled:opacity-50 ${
                      blockedState === "unblocked"
                        ? "border border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                        : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                    }`}
                  >
                    {blockedState === "unblocked" ? "Veículo desbloqueado" : "Desbloquear veículo"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {commandMessage && <p className="text-[11px] text-emerald-300">{commandMessage}</p>}
        {commandError && <p className="text-[11px] text-rose-300">{commandError}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFollow?.()}
            className={`flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold ${
              isFollowing
                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                : "border-white/15 bg-white/5 text-slate-100"
            }`}
          >
            {isFollowing ? "Seguindo dispositivo" : "Seguir dispositivo"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dispositivos/${device.id}/editar`)}
            className="flex items-center gap-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver detalhes
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 flex items-center gap-3 text-sm text-slate-200">
          <div className="h-8 w-8 rounded-2xl border border-white/10 bg-white/10 text-slate-200 flex items-center justify-center">
            <MapPin className="h-4 w-4" />
          </div>
          <p className="truncate">{coordsText}</p>
        </div>
      </div>
    </div>
  )
}
