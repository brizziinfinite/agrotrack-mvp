"use client"

import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Polygon, Circle } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export type GeofenceShape =
  | {
      id: number
      name: string
      type: "circle"
      center: { lat: number; lng: number }
      radius: number
    }
  | {
      id: number
      name: string
      type: "polygon"
      points: Array<{ lat: number; lng: number }>
    }

type GeofenceMapViewProps = {
  geofences: GeofenceShape[]
  selectedId: number | null
  focusId: number | null
  onSelect?: (id: number) => void
}

function useFocusOnGeofence(mapRef: React.MutableRefObject<L.Map | null>, geofence?: GeofenceShape | null) {
  useEffect(() => {
    if (!mapRef.current || !geofence) return
    const map = mapRef.current
    if (geofence.type === "circle") {
      map.flyTo([geofence.center.lat, geofence.center.lng], 16, { duration: 1 })
      return
    }
    if (geofence.points.length === 0) return
    const bounds = L.latLngBounds(geofence.points.map((point) => [point.lat, point.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [60, 60] })
  }, [geofence, mapRef])
}

export function GeofenceMapView({ geofences, selectedId, focusId, onSelect }: GeofenceMapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const activeGeofence = useMemo(
    () => geofences.find((geofence) => geofence.id === focusId) || geofences.find((geofence) => geofence.id === selectedId),
    [geofences, focusId, selectedId]
  )
  useFocusOnGeofence(mapRef, activeGeofence)

  const hasGeofences = geofences.length > 0
  const defaultCenter: LatLngExpression = hasGeofences
    ? geofences[0].type === "circle"
      ? [geofences[0].center.lat, geofences[0].center.lng]
      : [geofences[0].points[0]?.lat ?? -22.74, geofences[0].points[0]?.lng ?? -50.39]
    : [-22.74, -50.39]

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]/70 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map
        }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {geofences.map((geofence) => {
          const isSelected = geofence.id === selectedId
          const baseOptions = {
            color: isSelected ? "#fbbf24" : "#22d3ee",
            weight: isSelected ? 4 : 2,
            opacity: isSelected ? 0.95 : 0.65,
            fillOpacity: isSelected ? 0.25 : 0.18,
          }

          if (geofence.type === "circle") {
            return (
              <Circle
                key={geofence.id}
                center={[geofence.center.lat, geofence.center.lng]}
                radius={geofence.radius}
                pathOptions={baseOptions}
                eventHandlers={{
                  click: () => onSelect?.(geofence.id),
                }}
              />
            )
          }

          return (
            <Polygon
              key={geofence.id}
              positions={geofence.points.map((point) => [point.lat, point.lng])}
              pathOptions={baseOptions}
              eventHandlers={{
                click: () => onSelect?.(geofence.id),
              }}
            />
          )
        })}
      </MapContainer>

      {!hasGeofences && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
          <p>Sem cercas cadastradas ainda.</p>
          <p className="text-xs text-slate-500">Use o botão “Nova cerca” para desenhar no mapa.</p>
        </div>
      )}
    </div>
  )
}

export default GeofenceMapView
