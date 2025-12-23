"use client"

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw"
import "leaflet-draw/dist/leaflet.draw.css"
import { Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDeviceIcon } from "@/lib/device-icons"

interface Device {
  id: number
  name: string
  uniqueId?: string
  category?: string
  status: string
  attributes?: {
    speedIdealMax?: number
    speedHighMax?: number
    speedExtremeName?: string
    plate?: string
    m2m?: string
    color?: string
  }
  position: {
    latitude: number
    longitude: number
    speed: number
    deviceTime: string
  } | null
}

type DeviceWithPosition = Device & { position: NonNullable<Device["position"]> }

export interface MapHandle {
  flyToDevice: (lat: number, lng: number) => void
}

export interface GeofencePanelRenderProps {
  fenceCount: number
  fenceName: string
  onFenceNameChange: (value: string) => void
  fenceCategory: string
  onFenceCategoryChange: (value: string) => void
  fenceDirection: string
  onFenceDirectionChange: (value: string) => void
  deviceSearch: string
  onDeviceSearchChange: (value: string) => void
  deviceOptions: Array<{ id: number; name: string }>
  selectedDeviceIds: number[]
  selectedDevices: Array<{ id: number; name: string }>
  onToggleDevice: (id: number) => void
  onRemoveDevice: (id: number) => void
  onSave: () => void
  saving: boolean
  saveError: string | null
  saveMessage: string | null
  canSave: boolean
}

interface MapProps {
  devices: Device[]
  enableGeofence?: boolean
  className?: string
  selectedDeviceId?: number | null
  onDeviceSelect?: (device: Device) => void
  onMapInteraction?: () => void
  onMapReady?: (api: { panTo: (lat: number, lng: number) => void }) => void
  renderGeofencePanel?: (props: GeofencePanelRenderProps) => React.ReactNode
}

interface VirtualFence {
  id: string
  type: "polygon" | "polyline" | "circle"
  coordinates: [number, number][]
  radius?: number
}

function MapRecenter({ devices }: { devices: DeviceWithPosition[] }) {
  const map = useMap()
  const hasCenteredRef = useRef(false)

  useEffect(() => {
    if (devices.length === 0) {
      hasCenteredRef.current = false
      return
    }
    if (hasCenteredRef.current) return

    const bounds = L.latLngBounds(
      devices.map((d) => [d.position.latitude, d.position.longitude] as [number, number])
    )
    map.fitBounds(bounds, { padding: [50, 50] })
    hasCenteredRef.current = true
  }, [devices, map])

  return null
}

function SelectionFocus({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap()
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!coords) return

    const last = lastCoordsRef.current
    if (last && Math.abs(last.lat - coords.lat) < 0.000001 && Math.abs(last.lng - coords.lng) < 0.000001) {
      return
    }

    lastCoordsRef.current = coords
    map.flyTo([coords.lat, coords.lng], 16, { duration: 1.1 })
  }, [coords, map])

  return null
}

function DrawControls({ onUpdate }: { onUpdate: (fences: VirtualFence[]) => void }) {
  const map = useMap()
  const drawnItemsRef = useRef<L.FeatureGroup<L.Layer> | null>(null)

  useEffect(() => {
    const drawnItems = new L.FeatureGroup()
    drawnItemsRef.current = drawnItems
    map.addLayer(drawnItems)

    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: "#16a34a", weight: 3 },
        },
        polyline: {
          shapeOptions: { color: "#0ea5e9", weight: 3 },
        },
        circle: {
          shapeOptions: { color: "#f59e0b", weight: 3 },
        },
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    })

    map.addControl(drawControl)

    const syncFences = () => {
      const fences: VirtualFence[] = drawnItems.getLayers().map((layer, index) => {
        if (layer instanceof L.Circle) {
          const center = layer.getLatLng()
          return {
            id: `circle-${index}`,
            type: "circle",
            coordinates: [[center.lat, center.lng]],
            radius: layer.getRadius(),
          }
        }

        if (layer instanceof L.Polygon) {
          const latLngs = layer.getLatLngs()
          const coords = Array.isArray(latLngs[0])
            ? (latLngs[0] as L.LatLng[]).map((p) => [p.lat, p.lng] as [number, number])
            : (latLngs as L.LatLng[]).map((p) => [p.lat, p.lng] as [number, number])

          return { id: `polygon-${index}`, type: "polygon", coordinates: coords }
        }

        if (layer instanceof L.Polyline) {
          const latLngs = layer.getLatLngs() as L.LatLng[]
          const coords = latLngs.map((p) => [p.lat, p.lng] as [number, number])
          return { id: `polyline-${index}`, type: "polyline", coordinates: coords }
        }

        return { id: `shape-${index}`, type: "polyline", coordinates: [] }
      })

      onUpdate(fences)
    }

    const handleCreated: L.LeafletEventHandlerFn = (event) => {
      const createdEvent = event as L.DrawEvents.Created
      drawnItems.addLayer(createdEvent.layer)
      syncFences()
    }

    const handleEdited = () => syncFences()
    const handleDeleted = () => syncFences()

    map.on(L.Draw.Event.CREATED, handleCreated)
    map.on(L.Draw.Event.EDITED, handleEdited)
    map.on(L.Draw.Event.DELETED, handleDeleted)

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated)
      map.off(L.Draw.Event.EDITED, handleEdited)
      map.off(L.Draw.Event.DELETED, handleDeleted)
      map.removeControl(drawControl)
      map.removeLayer(drawnItems)
    }
  }, [map, onUpdate])

  return null
}

const MapView = forwardRef<MapHandle, MapProps>(function MapView(props: MapProps, ref) {
  const {
    devices = [],
    enableGeofence = true,
    className,
    selectedDeviceId,
    onDeviceSelect,
    onMapInteraction,
    onMapReady,
    renderGeofencePanel,
  } = props || {}

  const [virtualFences, setVirtualFences] = useState<VirtualFence[]>([])
  const [activeFenceId, setActiveFenceId] = useState<string | null>(null)
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([])

  // ✅ Nome da cerca deve vir primeiro, mas mantemos estado normal aqui
  const [fenceName, setFenceName] = useState("")
  const [fenceCategory, setFenceCategory] = useState("seguranca")
  const [fenceDirection, setFenceDirection] = useState("entrada")

  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deviceSearch, setDeviceSearch] = useState("")
  const [selectedBaseId, setSelectedBaseId] = useState("voyager")
  const [showLayerMenu, setShowLayerMenu] = useState(false)

  const mapInstanceRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const userInteractionCallback = useRef<(() => void) | null>(null)
  const onReadyCallbackRef = useRef<MapProps["onMapReady"]>(null)
  const hasNotifiedReadyRef = useRef(false)
  const apiRef = useRef<{ panTo: (lat: number, lng: number) => void } | null>(null)

  useEffect(() => {
    userInteractionCallback.current = onMapInteraction ?? null
  }, [onMapInteraction])

  useEffect(() => {
    onReadyCallbackRef.current = onMapReady ?? null
  }, [onMapReady])

  useImperativeHandle(
    ref,
    () => ({
      flyToDevice(lat: number, lng: number) {
        if (!mapInstanceRef.current) return
        mapInstanceRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.2 })
      },
    }),
    []
  )

  useEffect(() => {
    return () => {
      mapInstanceRef.current = null
      apiRef.current = null
      hasNotifiedReadyRef.current = false
    }
  }, [])

  // ✅ Notifica onMapReady apenas UMA vez e instala handlers de interação
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || hasNotifiedReadyRef.current) return

    const map = mapInstanceRef.current
    apiRef.current = {
      panTo(lat: number, lng: number) {
        map.panTo([lat, lng])
      },
    }

    hasNotifiedReadyRef.current = true
    onReadyCallbackRef.current?.(apiRef.current)

    const handleUserInteraction = () => userInteractionCallback.current?.()
    map.on("dragstart", handleUserInteraction)
    map.on("zoomstart", handleUserInteraction)

    return () => {
      map.off("dragstart", handleUserInteraction)
      map.off("zoomstart", handleUserInteraction)
    }
  }, [mapReady])

  const getSpeedColor = (speed: number, attrs?: Device["attributes"]) => {
    const ideal = Number(attrs?.speedIdealMax) || 0
    const high = Number(attrs?.speedHighMax) || 0
    if (ideal && speed <= ideal) return "#16a34a"
    if (high && speed <= high) return "#eab308"
    return "#ef4444"
  }

  const defaultCenter: [number, number] = [-22.7467, -50.3489]

  const devicesWithPosition = useMemo<DeviceWithPosition[]>(
    () => devices.filter((d): d is DeviceWithPosition => Boolean(d.position)),
    [devices]
  )

  const selectedCoords = useMemo(() => {
    if (!selectedDeviceId) return null
    const device = devicesWithPosition.find((d) => d.id === selectedDeviceId)
    if (!device) return null
    return { lat: device.position.latitude, lng: device.position.longitude }
  }, [devicesWithPosition, selectedDeviceId])

  const deviceOptions = useMemo(() => devices.map((d) => ({ id: d.id, name: d.name })), [devices])

  const filteredDeviceOptions = useMemo(() => {
    const term = deviceSearch.trim().toLowerCase()
    if (!term) return deviceOptions

    return devices
      .filter((d) => {
        const plate = (d.attributes?.plate || "").toLowerCase()
        const m2m = (d.attributes?.m2m || "").toLowerCase()
        const uniqueId = (d.uniqueId || "").toLowerCase()
        return (
          d.name.toLowerCase().includes(term) ||
          plate.includes(term) ||
          m2m.includes(term) ||
          uniqueId.includes(term) ||
          d.id.toString().includes(term)
        )
      })
      .map((d) => ({ id: d.id, name: d.name }))
  }, [deviceOptions, deviceSearch, devices])

  const selectedDevicesInfo = useMemo(
    () =>
      selectedDeviceIds
        .map((id) => devices.find((d) => d.id === id))
        .filter((d): d is Device => Boolean(d))
        .map((d) => ({ id: d.id, name: d.name })),
    [devices, selectedDeviceIds]
  )

  // ✅ AQUI ERA O BUG: "new Map(...)" colidia com o nome do componente.
  // Agora usamos "dict" para ficar claro.
  const deviceOptionsWithSelected = useMemo(() => {
    const dict = new Map<number, { id: number; name: string }>()
    selectedDevicesInfo.forEach((d) => dict.set(d.id, d))
    filteredDeviceOptions.forEach((d) => {
      if (!dict.has(d.id)) dict.set(d.id, d)
    })
    return Array.from(dict.values())
  }, [filteredDeviceOptions, selectedDevicesInfo])

  const activeFence = useMemo(() => {
    if (activeFenceId) return virtualFences.find((f) => f.id === activeFenceId) || null
    return virtualFences.length > 0 ? virtualFences[virtualFences.length - 1] : null
  }, [activeFenceId, virtualFences])

  useEffect(() => {
    if (!enableGeofence) return
    if (virtualFences.length > 0) setActiveFenceId(virtualFences[virtualFences.length - 1].id)
    else setActiveFenceId(null)
  }, [enableGeofence, virtualFences])

  useEffect(() => {
    if (!enableGeofence) return
    if (deviceOptions.length > 0 && selectedDeviceIds.length === 0) {
      setSelectedDeviceIds([deviceOptions[0].id])
    }
  }, [deviceOptions, enableGeofence, selectedDeviceIds.length])

  useEffect(() => {
    if (!enableGeofence) return
    if (fenceName.trim()) return
    const first = deviceOptions.find((d) => d.id === selectedDeviceIds[0])
    if (first) setFenceName(`Cerca ${first.name}`)
  }, [deviceOptions, enableGeofence, selectedDeviceIds, fenceName])

  async function handleSaveFence() {
    if (!enableGeofence) return
    setSaveError(null)
    setSaveMessage(null)

    if (!activeFence) {
      setSaveError("Desenhe uma cerca no mapa para salvar.")
      return
    }
    if (selectedDeviceIds.length === 0) {
      setSaveError("Selecione pelo menos um dispositivo para vincular.")
      return
    }

    try {
      setSaving(true)
      const response = await fetch("/api/traccar/geofences/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fenceName?.trim() || `Cerca ${selectedDevicesInfo[0]?.name || ""}`,
          type: fenceCategory,
          direction: fenceDirection,
          deviceIds: selectedDeviceIds,
          shape: activeFence,
        }),
      })

      const result = await response.json()
      if (result.success) setSaveMessage("Cerca salva e vinculada ao dispositivo.")
      else setSaveError(result.error || "Erro ao salvar cerca.")
    } catch (err) {
      console.error(err)
      setSaveError("Erro ao salvar cerca.")
    } finally {
      setSaving(false)
    }
  }

  const toggleDeviceSelection = (id: number) => {
    setSelectedDeviceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const removeDeviceSelection = (id: number) => {
    setSelectedDeviceIds((prev) => prev.filter((x) => x !== id))
  }

  const canSaveFence = Boolean(activeFence && selectedDeviceIds.length > 0 && fenceName.trim() && !saving)

  const center: [number, number] =
    devicesWithPosition.length > 0
      ? [devicesWithPosition[0].position.latitude, devicesWithPosition[0].position.longitude]
      : defaultCenter

  const baseLayers = useMemo(
    () =>
      [
        {
          id: "voyager",
          name: "Voyager",
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
        {
          id: "google",
          name: "Google Streets",
          url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          attribution: "Map data © Google",
        },
        {
          id: "satellite",
          name: "Satélite",
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        },
        {
          id: "dark",
          name: "Noite",
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: ["a", "b", "c", "d"],
        },
      ] as Array<{ id: string; name: string; url: string; attribution: string; subdomains?: string[] }>,
    []
  )

  const selectedBase = useMemo(
    () => baseLayers.find((l) => l.id === selectedBaseId) || baseLayers[0],
    [baseLayers, selectedBaseId]
  )

  // Proteção SSR/hidratação
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  if (typeof window === "undefined" || !hydrated) return null

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0 h-full w-full"
        whenCreated={(map) => {
          mapInstanceRef.current = map
          setMapReady(true)
        }}
      >
        <TileLayer
          attribution={selectedBase.attribution}
          url={selectedBase.url}
          {...(selectedBase.subdomains ? { subdomains: selectedBase.subdomains } : {})}
        />

        <MapRecenter devices={devicesWithPosition} />
        <SelectionFocus coords={selectedCoords} />
        {enableGeofence && <DrawControls onUpdate={setVirtualFences} />}

        {devicesWithPosition.map((device) => (
          <Marker
            key={device.id}
            position={[device.position.latitude, device.position.longitude]}
            eventHandlers={{ click: () => onDeviceSelect?.(device) }}
            icon={(() => {
              const icon = getDeviceIcon(device.category)
              const isSelected = selectedDeviceId === device.id
              const html = `
                <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;">
                  <div style="
                    width:44px;height:44px;
                    background: linear-gradient(135deg, ${
                      device.status === "online" ? "#16a34a" : "#6b7280"
                    } 0%, ${device.status === "online" ? "#059669" : "#4b5563"} 100%);
                    border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    box-shadow:${
                      isSelected
                        ? "0 0 0 3px rgba(52,211,153,0.35), 0 10px 30px rgba(16,185,129,0.35)"
                        : "0 4px 12px rgba(0,0,0,0.2)"
                    };
                    border:3px solid ${isSelected ? "#34d399" : "white"};
                    color:${icon.color};
                    transform:${isSelected ? "scale(1.05)" : "none"};
                    transition:transform 150ms ease, box-shadow 150ms ease, border 150ms ease;
                  ">
                    ${icon.emoji}
                  </div>
                  <div style="
                    position:absolute;bottom:-8px;width:0;height:0;
                    border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid white;
                  "></div>
                </div>
              `
              return L.divIcon({
                className: "custom-device-icon",
                html,
                iconSize: [44, 52],
                iconAnchor: [22, 52],
                popupAnchor: [0, -52],
              })
            })()}
          >
            <Popup>
              <div className="min-w-[200px] p-3">
                <h3 className="mb-2 text-lg font-bold text-gray-900">{device.name}</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`text-sm font-semibold ${
                        device.status === "online" ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {device.status === "online" ? "● Online" : "○ Offline"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Velocidade:</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: getSpeedColor(device.position.speed, device.attributes) }}
                    >
                      {Math.round(device.position.speed)} km/h
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-xs text-gray-500">Última atualização:</p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(device.position.deviceTime).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Botão/menus de camadas */}
      <div className="pointer-events-none absolute right-4 top-4 z-[999] flex max-w-xl flex-col items-end gap-2">
        <button
          type="button"
          aria-label="Alternar visualização do mapa"
          aria-expanded={showLayerMenu}
          onClick={() => setShowLayerMenu((v) => !v)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-slate-900/80 text-white shadow-lg shadow-black/30 backdrop-blur transition hover:-translate-y-px hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <Layers className="h-5 w-5" />
        </button>

        {showLayerMenu && (
          <div className="pointer-events-auto w-56 overflow-hidden rounded-xl border border-white/20 bg-white/95 shadow-lg shadow-black/30 backdrop-blur">
            <div className="border-b border-black/5 bg-slate-900/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
              Visualização
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              {baseLayers.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => {
                    setSelectedBaseId(layer.id)
                    setShowLayerMenu(false)
                  }}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-left transition ${
                    selectedBaseId === layer.id
                      ? "bg-emerald-50/80 text-emerald-900"
                      : "bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full border ${
                      selectedBaseId === layer.id
                        ? "border-emerald-600 bg-emerald-500"
                        : "border-slate-300 bg-white"
                    }`}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold leading-tight">{layer.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Painel de cercas (se habilitado) */}
      {enableGeofence &&
        (renderGeofencePanel
          ? renderGeofencePanel({
              fenceCount: virtualFences.length,
              fenceName,
              onFenceNameChange: setFenceName,
              fenceCategory,
              onFenceCategoryChange: setFenceCategory,
              fenceDirection,
              onFenceDirectionChange: setFenceDirection,
              deviceSearch,
              onDeviceSearchChange: setDeviceSearch,
              deviceOptions: deviceOptionsWithSelected,
              selectedDeviceIds,
              selectedDevices: selectedDevicesInfo,
              onToggleDevice: toggleDeviceSelection,
              onRemoveDevice: removeDeviceSelection,
              onSave: handleSaveFence,
              saving,
              saveError,
              saveMessage,
              canSave: canSaveFence,
            })
          : null)}
    </div>
  )
})

export default MapView
