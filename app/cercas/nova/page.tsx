"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin } from "lucide-react"
import { GeofencePanel } from "@/components/map/GeofencePanel"
import { MobileGeofenceSheet } from "@/components/map/MobileGeofenceSheet"

const Map = dynamic(() => import("@/components/ui/map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#050816] text-sm text-slate-300">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-400" />
      Preparando o mapa...
    </div>
  ),
})

interface Device {
  id: number
  name: string
  category?: string
  status: string
  position: {
    latitude: number
    longitude: number
    speed: number
    deviceTime: string
  } | null
}

export default function NovaCercaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editingId = searchParams.get("geofence")
  const panelButtonLabel = editingId ? "Editar cerca" : "Nova cerca"
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)

  useEffect(() => {
    fetchDevices()
  }, [])

  async function fetchDevices() {
    try {
      setLoading(true)
      const response = await fetch("/api/traccar/devices")
      const result = await response.json()
      if (result.success) {
        setDevices(result.data as Device[])
        setError(null)
      } else {
        setError(result.error || "Erro ao carregar dispositivos.")
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dispositivos."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-[#050816] text-slate-100">
      <Header />
      <div className="relative flex-1">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            Carregando dispositivos...
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-rose-200">{error}</p>
            <Button variant="outline" className="border-white/20 text-white" onClick={() => router.push("/cercas")}>
              Voltar para cercas
            </Button>
          </div>
        ) : (
          <Map
            devices={devices}
            enableGeofence
            className="h-full w-full"
            renderGeofencePanel={(panelProps) => (
              <>
                <GeofencePanel {...panelProps} className="absolute right-6 top-20 hidden lg:block" />

                <button
                  type="button"
                  className="pointer-events-auto absolute right-4 bottom-28 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#0b1220]/90 text-white shadow-lg shadow-black/40 lg:hidden"
                  onClick={() => setMobilePanelOpen(true)}
                  aria-label={`${panelButtonLabel} (painel)`}
                >
                  <MapPin className="h-5 w-5" />
                </button>

                <MobileGeofenceSheet {...panelProps} open={mobilePanelOpen} onOpenChange={setMobilePanelOpen} />
              </>
            )}
         />
        )}
      </div>
    </div>
  )
}
