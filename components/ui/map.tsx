"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

interface MapProps {
  devices: Device[]
  enableGeofence?: boolean
  className?: string
  selectedDeviceId?: number | null
  onDeviceSelect?: (device: Device) => void
}

interface VirtualFence {
  id: string
  type: "polygon" | "polyline" | "circle"
  coordinates: [number, number][]
  radius?: number
}

function MapRecenter({ devices }: { devices: Device[] }) {
  const map = useMap()

  useEffect(() => {
    if (devices.length === 0) return
    const devicesWithPosition = devices.filter((d) => d.position)
    if (devicesWithPosition.length === 0) return
    const bounds = L.latLngBounds(
      devicesWithPosition.map((device) => [device.position!.latitude, device.position!.longitude])
    )
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [devices, map])

  return null
}

function SelectionFocus({
  devices,
  selectedDeviceId,
}: {
  devices: Device[]
  selectedDeviceId?: number | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedDeviceId) return
    const selected = devices.find((d) => d.id === selectedDeviceId)
    if (!selected?.position) return
    map.flyTo([selected.position.latitude, selected.position.longitude], 15, { duration: 1.1 })
  }, [devices, selectedDeviceId, map])

  return null
}

export default function Map({
  devices,
  enableGeofence = true,
  className,
  selectedDeviceId,
  onDeviceSelect,
}: MapProps) {
  const [virtualFences, setVirtualFences] = useState<VirtualFence[]>([])
  const [activeFenceId, setActiveFenceId] = useState<string | null>(null)
  const [selectedFenceDeviceId, setSelectedFenceDeviceId] = useState<number | "">("")
  const [fenceName, setFenceName] = useState("")
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deviceSearch, setDeviceSearch] = useState("")
  const [selectedBaseId, setSelectedBaseId] = useState("voyager")
  const [showLayerMenu, setShowLayerMenu] = useState(false)

  const getSpeedColor = (speed: number, attrs?: Device["attributes"]) => {
    const ideal = Number(attrs?.speedIdealMax) || 0
    const high = Number(attrs?.speedHighMax) || 0
    if (ideal && speed <= ideal) return "#16a34a"
    if (high && speed <= high) return "#eab308"
    return "#ef4444"
  }

  const defaultCenter: [number, number] = [-22.7467, -50.3489]
  const devicesWithPosition = devices.filter((d) => d.position)

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

  const optionsWithSelected = useMemo(() => {
    if (!selectedFenceDeviceId) return filteredDeviceOptions
    const exists = filteredDeviceOptions.find((d) => d.id === selectedFenceDeviceId)
    if (exists) return filteredDeviceOptions
    const selectedDevice = devices.find((d) => d.id === selectedFenceDeviceId)
    return selectedDevice
      ? [{ id: selectedDevice.id, name: selectedDevice.name }, ...filteredDeviceOptions]
      : filteredDeviceOptions
  }, [devices, filteredDeviceOptions, selectedFenceDeviceId])

  const activeFence = useMemo(() => {
    if (activeFenceId) {
      return virtualFences.find((f) => f.id === activeFenceId) || null
    }
    return virtualFences.length > 0 ? virtualFences[virtualFences.length - 1] : null
  }, [activeFenceId, virtualFences])

  useEffect(() => {
    if (!enableGeofence) return
    if (virtualFences.length > 0) {
      const last = virtualFences[virtualFences.length - 1]
      setActiveFenceId(last.id)
    } else {
      setActiveFenceId(null)
    }
  }, [enableGeofence, virtualFences])

  useEffect(() => {
    if (!enableGeofence) return
    if (!selectedFenceDeviceId && deviceOptions.length > 0) {
      setSelectedFenceDeviceId(deviceOptions[0].id)
    }
  }, [deviceOptions, enableGeofence, selectedFenceDeviceId])

  useEffect(() => {
    if (!enableGeofence) return
    const deviceName = deviceOptions.find((d) => d.id === selectedFenceDeviceId)?.name
    if (deviceName) {
      setFenceName(`Cerca ${deviceName}`)
    }
  }, [deviceOptions, enableGeofence, selectedFenceDeviceId])

  async function handleSaveFence() {
    if (!enableGeofence) return
    setSaveError(null)
    setSaveMessage(null)
    if (!activeFence) {
      setSaveError("Desenhe uma cerca no mapa para salvar.")
      return
    }
    if (!selectedFenceDeviceId) {
      setSaveError("Selecione um dispositivo para vincular a cerca.")
      return
    }

    try {
      setSaving(true)
      const response = await fetch("/api/traccar/geofences/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fenceName || `Cerca ${selectedFenceDeviceId}`,
          deviceId: selectedFenceDeviceId,
          shape: activeFence,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setSaveMessage("Cerca salva e vinculada ao dispositivo.")
      } else {
        setSaveError(result.error || "Erro ao salvar cerca.")
      }
    } catch (error) {
      console.error(error)
      setSaveError("Erro ao salvar cerca.")
    } finally {
      setSaving(false)
    }
  }

  const center =
    devicesWithPosition.length > 0
      ? [devicesWithPosition[0].position!.latitude, devicesWithPosition[0].position!.longitude]
      : defaultCenter

  const baseLayers = useMemo(
    () =>
      [
        {
          id: "voyager",
          name: "Voyager",
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        },
        {
          id: "dark",
          name: "Noite",
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: ["a", "b", "c", "d"],
        },
      ] as Array<{
        id: string
        name: string
        url: string
        attribution: string
        subdomains?: string[]
      }>,
    []
  )

  const selectedBase = useMemo(
    () => baseLayers.find((layer) => layer.id === selectedBaseId) || baseLayers[0],
    [baseLayers, selectedBaseId]
  )

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0 h-full w-full">
        <TileLayer
          attribution={selectedBase.attribution}
          url={selectedBase.url}
          {...(selectedBase.subdomains ? { subdomains: selectedBase.subdomains } : {})}
        />

        <MapRecenter devices={devices} />
        <SelectionFocus devices={devicesWithPosition} selectedDeviceId={selectedDeviceId || null} />
        {enableGeofence && <DrawControls onUpdate={setVirtualFences} />}

        {devicesWithPosition.map((device) => (
          <Marker
            key={device.id}
            position={[device.position!.latitude, device.position!.longitude]}
            eventHandlers={{
              click: () => onDeviceSelect?.(device),
            }}
            icon={(() => {
              const icon = getDeviceIcon(device.category)
              const isSelected = selectedDeviceId === device.id
              const baseHtml = `
                <div style="
                  position: relative;
                  width: 44px;
                  height: 44px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 22px;
                ">
                  <div style="
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, ${device.status === "online" ? "#16a34a" : "#6b7280"} 0%, ${
                device.status === "online" ? "#059669" : "#4b5563"
              } 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: ${
                      isSelected
                        ? "0 0 0 3px rgba(52,211,153,0.35), 0 10px 30px rgba(16,185,129,0.35)"
                        : "0 4px 12px rgba(0,0,0,0.2)"
                    };
                    border: 3px solid ${isSelected ? "#34d399" : "white"};
                    color: ${icon.color};
                    transform: ${isSelected ? "scale(1.05)" : "none"};
                    transition: transform 150ms ease, box-shadow 150ms ease, border 150ms ease;
                  ">
                    ${icon.emoji}
                  </div>
                  <div style="
                    position: absolute;
                    bottom: -8px;
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid white;
                  "></div>
                </div>
              `
              return L.divIcon({
                className: "custom-device-icon",
                html: baseHtml,
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
                    <span className={`text-sm font-semibold ${device.status === "online" ? "text-green-600" : "text-gray-600"}`}>
                      {device.status === "online" ? "● Online" : "○ Offline"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Velocidade:</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: getSpeedColor(device.position!.speed, device.attributes) }}
                    >
                      {Math.round(device.position!.speed)} km/h
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-xs text-gray-500">Última atualização:</p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(device.position!.deviceTime).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

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
                    selectedBaseId === layer.id ? "bg-emerald-50/80 text-emerald-900" : "bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full border ${
                      selectedBaseId === layer.id ? "border-emerald-600 bg-emerald-500" : "border-slate-300 bg-white"
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

      {enableGeofence && (
        <div className="pointer-events-none absolute right-4 top-4 z-[999] w-80 space-y-3">
          <div className="rounded-xl border border-white/40 bg-white/90 p-4 shadow-lg shadow-black/20 backdrop-blur">
            <p className="text-sm font-semibold text-gray-900">Cerca virtual</p>
            <p className="mt-1 text-xs text-gray-600">
              Use os botões no canto esquerdo do mapa para desenhar um polígono, círculo ou linha livre (lápis).
            </p>
            <p className="mt-2 text-xs font-medium text-emerald-700">Cercas ativas: {virtualFences.length}</p>
          </div>

          {virtualFences.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/40 bg-white/90 p-3 shadow-lg shadow-black/20 backdrop-blur">
              {virtualFences.map((fence, index) => (
                <div
                  key={fence.id}
                  className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-emerald-50/70 px-3 py-2 last:mb-0"
                >
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">
                      Cerca #{index + 1} · {fence.type === "polyline" ? "Lápis" : fence.type === "circle" ? "Círculo" : "Polígono"}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Pontos: {fence.coordinates.length}
                      {fence.radius ? ` · Raio: ${Math.round(fence.radius)}m` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFenceId(fence.id)}
                    className={`pointer-events-auto h-6 w-6 rounded-full border ${
                      activeFenceId === fence.id ? "border-emerald-600 bg-emerald-600" : "border-emerald-400 bg-white"
                    }`}
                    aria-label="Selecionar cerca"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="pointer-events-auto space-y-3 rounded-xl border border-white/40 bg-white/95 p-4 shadow-lg shadow-black/20 backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-gray-900">Vincular a um dispositivo</p>
              <p className="text-xs text-gray-600">Selecione o dispositivo e salve a cerca desenhada.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Dispositivo</label>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Buscar por nome, placa, IMEI..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
              />
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={selectedFenceDeviceId}
                onChange={(e) => setSelectedFenceDeviceId(Number(e.target.value))}
              >
                {optionsWithSelected.map((deviceOption) => (
                  <option key={deviceOption.id} value={deviceOption.id}>
                    #{deviceOption.id} · {deviceOption.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Nome da cerca</label>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={fenceName}
                onChange={(e) => setFenceName(e.target.value)}
                placeholder="Cerca Fazenda"
              />
            </div>
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            {saveMessage && <p className="text-xs text-emerald-700">{saveMessage}</p>}
            <button
              type="button"
              onClick={handleSaveFence}
              disabled={saving || !activeFence || !selectedFenceDeviceId}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {saving ? "Salvando cerca..." : "Salvar e vincular cerca"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
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
          const coordinates = Array.isArray(latLngs[0])
            ? (latLngs[0] as L.LatLng[]).map((point) => [point.lat, point.lng] as [number, number])
            : (latLngs as L.LatLng[]).map((point) => [point.lat, point.lng] as [number, number])

          return {
            id: `polygon-${index}`,
            type: "polygon",
            coordinates,
          }
        }

        if (layer instanceof L.Polyline) {
          const latLngs = layer.getLatLngs()
          const coordinates = (latLngs as L.LatLng[]).map((point) => [point.lat, point.lng] as [number, number])
          return {
            id: `polyline-${index}`,
            type: "polyline",
            coordinates,
          }
        }

        return {
          id: `shape-${index}`,
          type: "polyline",
          coordinates: [],
        }
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
