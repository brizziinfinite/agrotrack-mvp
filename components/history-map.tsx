'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Ícone de início da rota (verde)
const startIcon = L.divIcon({
  className: 'custom-marker-icon',
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
        border: 3px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="12" r="8"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
})

// Ícone de fim da rota (vermelho)
const endIcon = L.divIcon({
  className: 'custom-marker-icon',
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        border: 3px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
          <rect x="8" y="8" width="8" height="8"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
})

interface Position {
  latitude: number
  longitude: number
  speed: number
  deviceTime: string
}

interface HistoryMapProps {
  positions: Position[]
  deviceName: string
}

// Componente para ajustar o mapa à rota
function MapFitBounds({ positions }: { positions: Position[] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(
        positions.map(p => [p.latitude, p.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [positions, map])

  return null
}

export default function HistoryMap({ positions, deviceName }: HistoryMapProps) {
  // Coordenadas padrão (Cândido Mota, SP)
  const defaultCenter: [number, number] = [-22.7467, -50.3489]

  if (positions.length === 0) {
    return (
      <div className="h-[500px] w-full rounded-lg border bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="mt-2 text-gray-600">Nenhuma rota encontrada para este período</p>
        </div>
      </div>
    )
  }

  const center = positions.length > 0
    ? [positions[0].latitude, positions[0].longitude] as [number, number]
    : defaultCenter

  // Criar pontos da rota com cores baseadas na velocidade
  const routePoints = positions.map(p => [p.latitude, p.longitude] as [number, number])

  // Criar segmentos coloridos baseados na velocidade
  const segments = []
  for (let i = 0; i < positions.length - 1; i++) {
    const speed = positions[i].speed
    let color = '#16a34a' // verde (parado/lento)

    if (speed > 5 && speed <= 15) {
      color = '#eab308' // amarelo (médio)
    } else if (speed > 15) {
      color = '#dc2626' // vermelho (rápido)
    }

    segments.push({
      positions: [
        [positions[i].latitude, positions[i].longitude] as [number, number],
        [positions[i + 1].latitude, positions[i + 1].longitude] as [number, number]
      ],
      color
    })
  }

  const firstPosition = positions[0]
  const lastPosition = positions[positions.length - 1]

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border shadow-md">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFitBounds positions={positions} />

        {/* Desenhar segmentos coloridos */}
        {segments.map((segment, index) => (
          <Polyline
            key={index}
            positions={segment.positions}
            color={segment.color}
            weight={4}
            opacity={0.8}
          />
        ))}

        {/* Marcador de início */}
        <Marker position={[firstPosition.latitude, firstPosition.longitude]} icon={startIcon}>
          <Popup>
            <div className="p-3 min-w-[200px]">
              <h3 className="font-bold text-lg mb-2 text-green-700">Início da Rota</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Máquina:</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Horário:</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(firstPosition.deviceTime).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Marcador de fim */}
        <Marker position={[lastPosition.latitude, lastPosition.longitude]} icon={endIcon}>
          <Popup>
            <div className="p-3 min-w-[200px]">
              <h3 className="font-bold text-lg mb-2 text-red-700">Fim da Rota</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Máquina:</p>
                  <p className="text-sm font-semibold text-gray-900">{deviceName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Horário:</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(lastPosition.deviceTime).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
