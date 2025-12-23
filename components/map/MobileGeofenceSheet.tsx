"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { GeofencePanelRenderProps } from "@/components/ui/map"
import { cn } from "@/lib/utils"

type MobileGeofenceSheetProps = GeofencePanelRenderProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileGeofenceSheet({
  open,
  onOpenChange,
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
}: MobileGeofenceSheetProps) {
  if (!open) return null

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => onOpenChange(false)} aria-label="Fechar painel" />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-white/10 bg-[#0b1220]/95 px-4 pb-6 pt-4 shadow-[0_-25px_60px_rgba(0,0,0,0.65)] backdrop-blur-lg lg:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Cerca virtual</p>
            <p className="text-base font-semibold text-white">Painel rápido</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200"
          >
            ×
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">{fenceCount} cercas desenhadas no mapa</div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Nome da cerca</label>
            <Input
              value={fenceName}
              onChange={(event) => onFenceNameChange(event.target.value)}
              placeholder="Ex.: Perímetro Talhão"
              className="rounded-2xl border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Tipo</label>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3">
                <select
                  value={fenceCategory}
                  onChange={(event) => onFenceCategoryChange(event.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-white outline-none"
                >
                  <option value="seguranca" className="bg-[#0b1220] text-white">
                    Segurança
                  </option>
                  <option value="trajeto" className="bg-[#0b1220] text-white">
                    Trajeto
                  </option>
                  <option value="trabalho" className="bg-[#0b1220] text-white">
                    Trabalho
                  </option>
                  <option value="viagem" className="bg-[#0b1220] text-white">
                    Viagem
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Direção</label>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3">
                <select
                  value={fenceDirection}
                  onChange={(event) => onFenceDirectionChange(event.target.value)}
                  className="w-full bg-transparent py-2 text-sm text-white outline-none"
                >
                  <option value="entrada" className="bg-[#0b1220] text-white">
                    Entrada
                  </option>
                  <option value="saida" className="bg-[#0b1220] text-white">
                    Saída
                  </option>
                  <option value="ambos" className="bg-[#0b1220] text-white">
                    Entrada e Saída
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Dispositivos</label>
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

        <Button
          onClick={onSave}
          disabled={!canSave}
          className={cn("mt-4 w-full rounded-2xl bg-emerald-500/90 text-white hover:bg-emerald-400", !canSave && "opacity-40")}
        >
          {saving ? "Salvando..." : "Salvar cerca"}
        </Button>
      </div>
    </>
  )
}
