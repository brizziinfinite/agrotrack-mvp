"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { GeofencePanelRenderProps } from "@/components/ui/map"

const geofenceTypes = [
  { value: "seguranca", label: "Segurança" },
  { value: "trajeto", label: "Trajeto" },
  { value: "trabalho", label: "Trabalho" },
  { value: "viagem", label: "Viagem" },
]

const geofenceDirections = [
  { value: "entrada", label: "Entrada (alertar ao entrar)" },
  { value: "saida", label: "Saída (alertar ao sair)" },
  { value: "ambos", label: "Entrada e Saída" },
]

type GeofencePanelProps = GeofencePanelRenderProps & {
  className?: string
}

export function GeofencePanel({
  fenceCount,
  fenceName,
  onFenceNameChange,
  fenceCategory,
  onFenceCategoryChange,
  fenceDirection,
  onFenceDirectionChange,
  deviceSearch,
  onDeviceSearchChange,
  deviceOptions,
  selectedDeviceIds,
  selectedDevices,
  onToggleDevice,
  onRemoveDevice,
  onSave,
  saving,
  saveError,
  saveMessage,
  canSave,
  className,
}: GeofencePanelProps) {
  return (
    <div className={cn("pointer-events-auto", className)}>
      <div className="w-full max-w-sm rounded-[28px] border border-white/15 bg-[#0b1220]/92 p-5 text-sm text-slate-200 shadow-[0_35px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Cerca virtual</p>
            <p className="text-base font-semibold text-white">Configuração</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{fenceCount} cercas desenhadas</span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Nome da cerca</label>
            <Input
              value={fenceName}
              onChange={(event) => onFenceNameChange(event.target.value)}
              placeholder="Ex.: Perímetro Talhão 7"
              className="rounded-2xl border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Tipo</label>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3">
              <select
                value={fenceCategory}
                onChange={(event) => onFenceCategoryChange(event.target.value)}
                className="w-full bg-transparent py-2 text-sm text-white outline-none"
              >
                {geofenceTypes.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#0b1220] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Direção / Regra</label>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3">
              <select
                value={fenceDirection}
                onChange={(event) => onFenceDirectionChange(event.target.value)}
                className="w-full bg-transparent py-2 text-sm text-white outline-none"
              >
                {geofenceDirections.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#0b1220] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Dispositivos vinculados</label>
              <span className="text-[11px] text-slate-500">Selecionados: {selectedDeviceIds.length}</span>
            </div>
            <Input
              value={deviceSearch}
              onChange={(event) => onDeviceSearchChange(event.target.value)}
              placeholder="Buscar por nome, placa, IMEI..."
              className="rounded-2xl border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500"
            />
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-2">
              {deviceOptions.map((device) => {
                const isSelected = selectedDeviceIds.includes(device.id)
                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => onToggleDevice(device.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm",
                      isSelected ? "bg-emerald-500/20 text-emerald-100" : "text-slate-200 hover:bg-white/5"
                    )}
                  >
                    <span>
                      #{device.id} · {device.name}
                    </span>
                    <span className="text-xs">{isSelected ? "Remover" : "Adicionar"}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDevices.length === 0 ? (
                <p className="text-[11px] text-slate-500">Nenhum dispositivo selecionado.</p>
              ) : (
                selectedDevices.map((device) => (
                  <span
                    key={device.id}
                    className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100"
                  >
                    #{device.id} · {device.name}
                    <button type="button" onClick={() => onRemoveDevice(device.id)} aria-label="Remover">
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {saveError && <p className="mt-3 text-xs text-rose-300">{saveError}</p>}
        {saveMessage && !saveError && <p className="mt-3 text-xs text-emerald-300">{saveMessage}</p>}

        <Button onClick={onSave} disabled={!canSave} className="mt-4 w-full rounded-2xl bg-emerald-500/90 text-white hover:bg-emerald-400 disabled:opacity-40">
          {saving ? "Salvando..." : "Salvar cerca"}
        </Button>
      </div>
    </div>
  )
}
