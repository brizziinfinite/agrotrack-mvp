"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import VehiclesPanel, { type Device } from "./components/VehiclesPanel"
import MobileVehiclesSheet from "./components/MobileVehiclesSheet"
import { DeviceMiniCard } from "@/components/map/DeviceMiniCard"
import { DeviceActionsMenu } from "@/components/map/DeviceActionsMenu"

type MapApi = {
  panTo: (lat: number, lng: number) => void
  flyToDevice?: (d: Device) => void
}

const Map = dynamic(() => import("@/components/ui/map"), { ssr: false })

export default function MapaPage() {
  const router = useRouter()

  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔑 fonte da verdade é o ID
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null)

  const [openSearch, setOpenSearch] = useState(false)
  const [followDevice, setFollowDevice] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  const [commandLoading, setCommandLoading] = useState<"block" | "unblock" | null>(null)
  const [blockedState, setBlockedState] = useState<"blocked" | "unblocked" | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const mapApiRef = useRef<MapApi | null>(null)

  // 🔁 carrega devices uma única vez (ou você pode transformar em polling controlado depois)
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dispositivos.")
    } finally {
      setLoading(false)
    }
  }

  // 🔎 dispositivo selecionado é derivado
  const selectedDevice =
    selectedDeviceId !== null
      ? devices.find((d) => d.id === selectedDeviceId) ?? null
      : null

  // 🗺️ API do mapa – callback estável
  const handleMapReady = useCallback((api: MapApi) => {
    mapApiRef.current = api
  }, [])

  function flyTo(device: Device | null) {
    if (!device?.position) return
    mapApiRef.current?.panTo(
      device.position.latitude,
      device.position.longitude
    )
  }

  // 👆 seleção desktop
  function handleDesktopSelect(device: Device) {
    setSelectedDeviceId(device.id)
    flyTo(device)
    setFollowDevice(false)
  }

  // 📱 seleção mobile
  function handleMobileSelect(device: Device) {
    setSelectedDeviceId(device.id)
    setOpenSearch(false)
    flyTo(device)
    setFollowDevice(false)
  }

  function handleCenter() {
    if (selectedDevice) flyTo(selectedDevice)
  }

  function handleToggleFollow() {
    if (!selectedDevice) return
    setFollowDevice((prev) => {
      const next = !prev
      if (next) flyTo(selectedDevice)
      setCommandsOpen(false)
      return next
    })
  }

  function handleMapInteraction() {
    if (followDevice) {
      setFollowDevice(false)
      setToast({ type: "error", message: "Seguir desativado" })
    }
  }

  function handleHistory() {
    if (!selectedDevice) return
    router.push(`/historico?deviceId=${selectedDevice.id}`)
  }

  function handleViewDetails() {
    if (!selectedDevice) return
    router.push(`/dispositivos/${selectedDevice.id}`)
    setCommandsOpen(false)
  }

  async function handleCommand(
    action: "block" | "unblock",
    label: string,
    nextState: "blocked" | "unblocked"
  ) {
    if (!selectedDevice) return

    if (selectedDevice.status !== "online") {
      setToast({
        type: "error",
        message: "O dispositivo precisa estar online para executar comandos.",
      })
      return
    }

    if (action === "block") {
      const confirmed = window.confirm("Confirmar bloqueio do veículo?")
      if (!confirmed) return
    }

    try {
      setCommandLoading(action)
      const res = await fetch(`/api/traccar/commands/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: selectedDevice.id }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      setToast({ type: "success", message: `${label} enviado.` })
      setBlockedState(nextState)
      setCommandsOpen(false)
    } catch (e: unknown) {
      setToast({
        type: "error",
        message: e instanceof Error ? e.message : "Erro ao enviar comando.",
      })
    } finally {
      setCommandLoading(null)
    }
  }

  // 🔔 limpa estados ao trocar seleção
  useEffect(() => {
    setCommandsOpen(false)
    setCommandLoading(null)
    setBlockedState(null)
  }, [selectedDeviceId])

  // 🔔 auto-hide toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* MAPA (nunca desmonta) */}
      <div className="absolute inset-0">
        <Map
          devices={devices}
          enableGeofence={false}
          selectedDeviceId={selectedDeviceId}
          onMapInteraction={handleMapInteraction}
          onMapReady={handleMapReady}
        />
      </div>

      {/* PAINEL DESKTOP */}
      <div className="hidden lg:block">
        <VehiclesPanel
          devices={devices}
          loading={loading}
          error={error}
          selectedId={selectedDeviceId}
          onSelect={handleDesktopSelect}
        />
      </div>

      {/* BOTÃO BUSCA MOBILE */}
      <button
        type="button"
        onClick={() => setOpenSearch(true)}
        className="lg:hidden absolute right-4 top-24 z-50 h-11 w-11 rounded-2xl border border-white/15 bg-[#0B1220]/90 text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur hover:bg-[#0B1220] active:scale-95 transition flex items-center justify-center"
        aria-label="Buscar dispositivos"
      >
        <Search className="h-5 w-5" />
      </button>

      <MobileVehiclesSheet
        open={openSearch}
        onOpenChange={setOpenSearch}
        devices={devices}
        loading={loading}
        error={error}
        onSelect={handleMobileSelect}
      />

      {/* CARD + MENU */}
      {selectedDevice && (
        <>
          <DeviceMiniCard
            device={selectedDevice}
            onCenter={handleCenter}
            onHistory={handleHistory}
            onCommands={() => setCommandsOpen((v) => !v)}
          />

          <DeviceActionsMenu
            open={commandsOpen}
            onClose={() => setCommandsOpen(false)}
            onBlock={() =>
              handleCommand("block", "Bloqueio", "blocked")
            }
            onUnblock={() =>
              handleCommand("unblock", "Desbloqueio", "unblocked")
            }
            onToggleFollow={handleToggleFollow}
            onViewDetails={handleViewDetails}
            isFollowing={followDevice}
            loadingAction={commandLoading}
            deviceOnline={selectedDevice.status === "online"}
            hasPosition={Boolean(selectedDevice.position)}
            blockedState={blockedState}
          />
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div className="pointer-events-none fixed bottom-32 left-0 right-0 z-[80] flex justify-center">
          <div
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              toast.type === "success"
                ? "bg-emerald-500/90 text-white"
                : "bg-rose-500/90 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
