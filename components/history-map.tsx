'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

export default function HistoryMap({ positions, deviceName }: HistoryMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playSpeed, setPlaySpeed] = useState(1)
  const markerRef = useRef<L.Marker | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current).setView([-22.7437, -50.3917], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Desenhar rota completa
  useEffect(() => {
    if (!mapRef.current || positions.length === 0) return

    const coordinates: [number, number][] = positions.map(p => [p.latitude, p.longitude])

    // Colorir por velocidade
    for (let i = 0; i < positions.length - 1; i++) {
      const speed = positions[i].speed
      const color = speed < 5 ? '#22c55e' : speed < 15 ? '#eab308' : '#ef4444'

      L.polyline(
        [coordinates[i], coordinates[i + 1]],
        { color, weight: 4, opacity: 0.7 }
      ).addTo(mapRef.current)
    }

    // Ajustar bounds
    const bounds = L.latLngBounds(coordinates)
    mapRef.current.fitBounds(bounds, { padding: [50, 50] })

  }, [positions])

  // Controlar replay
  useEffect(() => {
    if (!isPlaying || !mapRef.current) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= positions.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 / playSpeed)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, playSpeed, positions.length])

  // Atualizar marcador
  useEffect(() => {
    if (!mapRef.current || positions.length === 0) return

    const pos = positions[currentIndex]
    const latlng: [number, number] = [pos.latitude, pos.longitude]

    if (markerRef.current) {
      markerRef.current.setLatLng(latlng)
    } else {
      const icon = L.divIcon({
        html: '<div style="background: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
      markerRef.current = L.marker(latlng, { icon }).addTo(mapRef.current)
    }

    mapRef.current.panTo(latlng)
  }, [currentIndex, positions])

  return (
    <div className="relative">
      {/* Mapa */}
      <div ref={mapContainerRef} className="h-[500px] w-full rounded-lg" />

      {/* Controles de Replay */}
      {positions.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
          <h3 className="font-bold mb-2">Replay</h3>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {isPlaying ? '⏸ Pausar' : '▶ Play'}
            </button>
            <button
              onClick={() => setCurrentIndex(0)}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ↻
            </button>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Ponto {currentIndex + 1} / {positions.length}
          </div>
          <div className="flex gap-1">
            {[1, 2, 4, 8].map(speed => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                className={`px-3 py-1 rounded text-sm ${
                  playSpeed === speed
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}