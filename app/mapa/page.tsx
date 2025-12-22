"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import VehiclesPanel, { type Device } from "./components/VehiclesPanel"
import MobileVehiclesSheet from "./components/MobileVehiclesSheet"
import { Search } from "lucide-react"

const Map = dynamic(() => import("@/components/ui/map"), { ssr: false })

export default function MapaPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [openSearch, setOpenSearch] = useState(false)

  useEffect(() => {
    fetchDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const msg = e instanceof Error ? e.message : "Erro ao carregar dispositivos."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Map devices={devices} enableGeofence={false} />
      </div>

      {/* DESKTOP: painel esquerdo (mantém como está) */}
      <div className="hidden lg:block">
        <VehiclesPanel
          devices={devices}
          loading={loading}
          error={error}
          selectedId={selectedId}
          onSelect={(d) => setSelectedId(d.id)}
        />
      </div>

      {/* MOBILE: botão LUPA (igual sua referência) */}
    <button
  type="button"
  onClick={() => setOpenSearch(true)}
  className="
    lg:hidden
    absolute right-4 top-24 z-50
    h-11 w-11 rounded-2xl
    border border-white/15 bg-[#0B1220]/85
    text-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.55)]
    backdrop-blur hover:bg-[#0B1220]/95 active:scale-[0.98] transition
  "
  aria-label="Buscar dispositivos"
  title="Buscar"
>
  <Search className="mx-auto h-5 w-5" />
</button>


      {/* Sheet mobile */}
      <MobileVehiclesSheet
        open={openSearch}
        onOpenChange={setOpenSearch}
        devices={devices}
        loading={loading}
        error={error}
        onSelect={(d) => {
          setSelectedId(d.id)
          setOpenSearch(false)
          // Próximo passo: focar no marcador do mapa
        }}
      />
    </div>
  )
}
