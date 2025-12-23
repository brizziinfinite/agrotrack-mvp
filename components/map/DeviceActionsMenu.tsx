"use client"

import { useEffect, useRef } from "react"
import { ExternalLink, Loader2, Power, PowerOff, Satellite, Check, X } from "lucide-react"

type DeviceActionsMenuProps = {
  open: boolean
  onClose: () => void
  onBlock: () => void
  onUnblock: () => void
  onToggleFollow: () => void
  onViewDetails: () => void
  isFollowing?: boolean
  loadingAction?: "block" | "unblock" | null
  deviceOnline?: boolean
  hasPosition?: boolean
  blockedState?: "blocked" | "unblocked" | null
}

export function DeviceActionsMenu({
  open,
  onClose,
  onBlock,
  onUnblock,
  onToggleFollow,
  onViewDetails,
  isFollowing,
  loadingAction,
  deviceOnline = true,
  hasPosition = true,
  blockedState,
}: DeviceActionsMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }
    window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [open, onClose])

  if (!open) return null

  const disabled = !deviceOnline || !hasPosition

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center pb-48">
      <div
        ref={ref}
        className="pointer-events-auto w-full max-w-xs rounded-3xl border border-white/15 bg-[#0f1b32]/95 p-3 text-white shadow-[0_25px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Comandos</p>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-slate-200 flex items-center justify-center"
            aria-label="Fechar comandos"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div>
            <button
              type="button"
              disabled={disabled || loadingAction === "block"}
              onClick={onBlock}
              className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                blockedState === "blocked"
                  ? "border-rose-400/60 bg-rose-500/20 text-rose-100"
                  : "border-rose-500/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/30"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loadingAction === "block" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4" />}
              {loadingAction === "block"
                ? "Enviando..."
                : blockedState === "blocked"
                ? "Veículo bloqueado"
                : "Bloquear veículo"}
            </button>
            {disabled && <p className="mt-1 text-[11px] text-slate-400">Indisponível offline</p>}
          </div>

          <div>
            <button
              type="button"
              disabled={disabled || loadingAction === "unblock"}
              onClick={onUnblock}
              className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                blockedState === "unblocked"
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                  : "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loadingAction === "unblock" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {loadingAction === "unblock"
                ? "Enviando..."
                : blockedState === "unblocked"
                ? "Veículo desbloqueado"
                : "Desbloquear veículo"}
            </button>
            {disabled && <p className="mt-1 text-[11px] text-slate-400">Indisponível offline</p>}
          </div>

          <button
            type="button"
            onClick={onToggleFollow}
            className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
              isFollowing
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
            }`}
          >
            {isFollowing ? <Check className="h-4 w-4" /> : <Satellite className="h-4 w-4" />}
            {isFollowing ? "Seguindo dispositivo" : "Seguir dispositivo"}
          </button>

          <button
            type="button"
            onClick={onViewDetails}
            className="flex w-full items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            Ver detalhes completos
          </button>
        </div>
      </div>
    </div>
  )
}
