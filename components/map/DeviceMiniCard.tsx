"use client"

import { memo, useMemo } from "react"
import { Clock } from "lucide-react"

export type MiniCardDevice = {
  id: number
  name: string
  status: string
  position?: {
    speed: number
    deviceTime: string
  } | null
}

type Action = {
  label: string
  icon: React.ReactNode
  onClick?: () => void
}

type DeviceMiniCardProps = {
  device: MiniCardDevice
  onCenter?: () => void
  onHistory?: () => void
  onCommands?: () => void
}

const getStatusLabel = (device: MiniCardDevice) => {
  if (device.status !== "online") return "Offline"
  const speed = Math.round(device.position?.speed || 0)
  if (speed > 1) return "Em movimento"
  return "Estacionado"
}

const formatUpdate = (deviceTime?: string) => {
  if (!deviceTime) return "--:--"
  const date = new Date(deviceTime)
  if (Number.isNaN(date.getTime())) return "--:--"
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function DeviceMiniCardComponent({ device, onCenter, onHistory, onCommands }: DeviceMiniCardProps) {
  const statusLabel = useMemo(() => getStatusLabel(device), [device])
  const speed = Math.round(device.position?.speed || 0)
  const lastUpdate = useMemo(() => formatUpdate(device.position?.deviceTime), [device.position?.deviceTime])

  const actions: Action[] = [
    {
      label: "Centralizar",
      icon: "📍",
      onClick: onCenter,
    },
    {
      label: "Histórico",
      icon: "🕒",
      onClick: onHistory,
    },
    {
      label: "Comandos",
      icon: "⚙️",
      onClick: onCommands,
    },
  ]

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-[60] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md space-y-3 rounded-[26px] border border-white/10 bg-[#0B1220]/85 p-4 text-white shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{device.name}</p>
            <p className="text-xs text-slate-300">{statusLabel}</p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Atualizado às {lastUpdate}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Velocidade</p>
            <p className="text-2xl font-semibold">{speed} km/h</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              <span className="text-lg">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export const DeviceMiniCard = memo(DeviceMiniCardComponent)
