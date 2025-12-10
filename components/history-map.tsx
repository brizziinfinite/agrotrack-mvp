'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const PAN_DURATION = 0.45
const TRAIL_POINTS = 50

interface Position {
  latitude: number
  longitude: number
  speed: number
  deviceTime: string
}

interface HistoryMapProps {
  positions: Position[]
  deviceName: string
  icon: { emoji: string; color: string }
  speedRules?: {
    ideal?: number
    high?: number
    extremeName?: string
  }
}

export default function HistoryMap({ positions, deviceName, icon, speedRules }: HistoryMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playSpeed, setPlaySpeed] = useState(1)
  const markerRef = useRef<L.Marker | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const polylinesRef = useRef<L.Polyline[]>([])
  const playbackLineRef = useRef<L.Polyline | null>(null)
  const trailLineRef = useRef<L.Polyline | null>(null)

  const getSpeedColor = useCallback((speed: number) => {
    const ideal = Number(speedRules?.ideal) || 0
    const high = Number(speedRules?.high) || 0
    if (ideal && speed <= ideal) return '#16a34a'
    if (high && speed <= high) return '#eab308'
    return '#ef4444'
  }, [speedRules?.high, speedRules?.ideal])

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

  /* eslint-disable react-hooks/set-state-in-effect */
  // Limpar camadas quando não há posições
  useEffect(() => {
    if (!mapRef.current) return

    if (positions.length === 0) {
      polylinesRef.current.forEach(line => mapRef.current!.removeLayer(line))
      polylinesRef.current = []
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current)
        markerRef.current = null
      }
      if (playbackLineRef.current) {
        mapRef.current.removeLayer(playbackLineRef.current)
        playbackLineRef.current = null
      }
      if (trailLineRef.current) {
        mapRef.current.removeLayer(trailLineRef.current)
        trailLineRef.current = null
      }
      setIsPlaying(false)
      setCurrentIndex(0)
    }
  }, [positions.length])

  // Desenhar rota completa (limpando estado anterior)
  useEffect(() => {
    if (!mapRef.current || positions.length === 0) return

    // Reset playback para novo dataset
    setIsPlaying(false)
    setCurrentIndex(0)

    // Remover polilinhas e marcador anteriores
    polylinesRef.current.forEach(line => mapRef.current!.removeLayer(line))
    polylinesRef.current = []
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current)
      markerRef.current = null
    }
    if (playbackLineRef.current) {
      mapRef.current.removeLayer(playbackLineRef.current)
      playbackLineRef.current = null
    }
    if (trailLineRef.current) {
      mapRef.current.removeLayer(trailLineRef.current)
      trailLineRef.current = null
    }

    const coordinates: [number, number][] = positions.map(p => [p.latitude, p.longitude])

    // Colorir por velocidade
    for (let i = 0; i < positions.length - 1; i++) {
      const speed = positions[i].speed
      const color = speed < 5 ? '#22c55e' : speed < 15 ? '#eab308' : '#ef4444'

      const line = L.polyline(
        [coordinates[i], coordinates[i + 1]],
        { color: getSpeedColor(speed) || color, weight: 3, opacity: 0.8 }
      ).addTo(mapRef.current)
      polylinesRef.current.push(line)
    }

    // Ajustar bounds
    const bounds = L.latLngBounds(coordinates)
    mapRef.current.fitBounds(bounds, { padding: [50, 50] })

    // Linha de progresso do replay
    playbackLineRef.current = L.polyline([], {
      color: icon.color,
      weight: 4,
      opacity: 0.95
    }).addTo(mapRef.current)

    // Linha de rastro (ghost) perto do marcador
    trailLineRef.current = L.polyline([], {
      color: icon.color,
      weight: 3,
      opacity: 0.4
    }).addTo(mapRef.current)

  }, [getSpeedColor, icon.color, positions])
  /* eslint-enable react-hooks/set-state-in-effect */

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
    const popupHtml = `
      <div style="min-width: 180px; font-family: 'Inter', sans-serif; color: #111827;">
        <div style="font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">${icon.emoji}</span>
          <span>${deviceName}</span>
        </div>
        <div style="font-size: 13px; margin-bottom: 4px; color: ${getSpeedColor(pos.speed)};">Velocidade: <strong>${pos.speed.toFixed(1)} km/h</strong></div>
        <div style="font-size: 12px; color: #4b5563;">${new Date(pos.deviceTime).toLocaleString('pt-BR')}</div>
      </div>
    `

    if (markerRef.current) {
      markerRef.current.setLatLng(latlng)
      const popup = markerRef.current.getPopup()
      if (popup) {
        popup.setContent(popupHtml)
      } else {
        markerRef.current.bindPopup(popupHtml)
      }
    } else {
      const markerIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 28px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: 28px;
              height: 28px;
              background: white;
              border-radius: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              <div style="
                width: 22px;
                height: 22px;
                background: ${icon.color};
                border-radius: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 14px;
              ">${icon.emoji}</div>
            </div>
            <div style="
              position: absolute;
              bottom: 0;
              width: 0;
              height: 0;
              border-left: 10px solid transparent;
              border-right: 10px solid transparent;
              border-top: 14px solid ${icon.color};
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
            "></div>
          </div>
        `,
        iconSize: [28, 40],
        iconAnchor: [14, 36]
      })
      markerRef.current = L.marker(latlng, { icon: markerIcon }).addTo(mapRef.current)
      markerRef.current.bindPopup(popupHtml)
    }

    mapRef.current.panTo(latlng, {
      animate: true,
      duration: PAN_DURATION,
      easeLinearity: 0.25
    })

    // Atualizar linha de progresso
    if (playbackLineRef.current) {
      const slice = positions.slice(0, currentIndex + 1).map(p => [p.latitude, p.longitude] as [number, number])
      playbackLineRef.current.setLatLngs(slice)
    }

    // Atualizar rastro curto (últimos N pontos)
    if (trailLineRef.current) {
      const start = Math.max(0, currentIndex - TRAIL_POINTS)
      const slice = positions.slice(start, currentIndex + 1).map(p => [p.latitude, p.longitude] as [number, number])
      trailLineRef.current.setLatLngs(slice)
    }
  }, [currentIndex, deviceName, getSpeedColor, icon.color, icon.emoji, positions])

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
