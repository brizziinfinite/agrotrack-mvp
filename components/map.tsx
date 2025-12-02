'use client'

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MachineIcon from './machine-icon'

// Ícone customizado de trator para máquinas online
const tractorIconOnline = L.divIcon({
  className: 'custom-tractor-icon',
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
        box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
        border: 2px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12h18"/>
          <path d="M3 18h18"/>
          <path d="M7 7v11"/>
          <path d="M17 7v11"/>
          <circle cx="12" cy="6" r="3"/>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -6px;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
      "></div>
    </div>
  `,
  iconSize: [32, 38],
  iconAnchor: [16, 38],
  popupAnchor: [0, -38]
})

// Ícone customizado de trator para máquinas offline
const tractorIconOffline = L.divIcon({
  className: 'custom-tractor-icon',
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
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(107, 114, 128, 0.25);
        border: 2px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12h18"/>
          <path d="M3 18h18"/>
          <path d="M7 7v11"/>
          <path d="M17 7v11"/>
          <circle cx="12" cy="6" r="3"/>
        </svg>
      </div>
      <div style="
        position: absolute;
        bottom: -6px;
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
      "></div>
    </div>
  `,
  iconSize: [32, 38],
  iconAnchor: [16, 38],
  popupAnchor: [0, -38]
})

// Função para determinar a cor do ícone baseado no status
function getIconColor(device: Device): { gradient: string; shadow: string } {
  // Vermelho para inadimplente (prioridade máxima)
  if (device.attributes?.paymentStatus === 'overdue') {
    return {
      gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      shadow: '0 2px 6px rgba(220, 38, 38, 0.4)'
    }
  }

  // Azul para em movimento
  if (device.position && device.position.speed > 0) {
    return {
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: '0 2px 6px rgba(59, 130, 246, 0.4)'
    }
  }

  // Preto para parado
  return {
    gradient: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    shadow: '0 2px 6px rgba(31, 41, 55, 0.4)'
  }
}

// Função para criar ícone dinâmico
function createDynamicIcon(device: Device): L.DivIcon {
  const { gradient, shadow } = getIconColor(device)

  return L.divIcon({
    className: 'custom-tractor-icon',
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
          background: ${gradient};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: ${shadow};
          border: 2px solid white;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12h18"/>
            <path d="M3 18h18"/>
            <path d="M7 7v11"/>
            <path d="M17 7v11"/>
            <circle cx="12" cy="6" r="3"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: -6px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid white;
        "></div>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38]
  })
}

// Componente de popup detalhado
function DetailedPopup({ device }: { device: Device }) {
  const [address, setAddress] = useState<string>('Carregando endereço...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (device.position) {
      fetch(`/api/geocode/reverse?lat=${device.position.latitude}&lon=${device.position.longitude}`)
        .then(res => res.json())
        .then(data => {
          setAddress(data.address || 'Endereço não disponível')
          setLoading(false)
        })
        .catch(() => {
          setAddress('Erro ao buscar endereço')
          setLoading(false)
        })
    }
  }, [device.position])

  const handleEdit = () => {
    window.location.href = `/maquinas/${device.id}/editar`
  }

  // Determinar status e cor
  const getStatusInfo = () => {
    if (device.attributes?.paymentStatus === 'overdue') {
      return { text: 'Inadimplente', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    }
    if (device.position && device.position.speed > 0) {
      return { text: 'Em Movimento', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    }
    return { text: 'Parado', color: 'text-gray-900', bg: 'bg-gray-50', border: 'border-gray-300' }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="p-3 w-[240px]">
      {/* Cabeçalho compacto */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
          <MachineIcon name={device.metadata?.icone || 'trator'} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{device.name}</h3>
          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border} border`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* Informações compactas */}
      <div className="space-y-1.5 text-xs">
        {/* Data/Hora */}
        <div className="flex items-center gap-1.5 text-gray-600">
          <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="truncate">
            {device.position ? new Date(device.position.deviceTime).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A'}
          </span>
        </div>

        {/* Velocidade */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Velocidade</span>
          </div>
          <span className="font-semibold text-gray-900">
            {Math.round(device.position?.speed || 0)} km/h
          </span>
        </div>

        {/* Coordenadas */}
        <div className="flex items-center gap-1.5 text-gray-500">
          <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate text-[10px]">
            {device.position ? `${device.position.latitude.toFixed(4)}, ${device.position.longitude.toFixed(4)}` : ''}
          </span>
        </div>
      </div>

      {/* Botão compacto */}
      <button
        onClick={handleEdit}
        className="w-full mt-2 py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded text-xs font-medium transition-all flex items-center justify-center gap-1.5"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editar
      </button>
    </div>
  )
}

interface Device {
  id: number
  name: string
  status: string
  position: {
    latitude: number
    longitude: number
    speed: number
    deviceTime: string
  } | null
  attributes?: {
    paymentStatus?: 'active' | 'overdue'
    speedConfig?: {
      low: number
      ideal: number
      high: number
    }
  }
  metadata?: {
    icone?: string
    cor?: string
  }
}

interface MapProps {
  devices: Device[]
}

// Componente para centralizar o mapa
function MapRecenter({ devices }: { devices: Device[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (devices.length > 0) {
      const devicesWithPosition = devices.filter(d => d.position)
      
      if (devicesWithPosition.length > 0) {
        const bounds = L.latLngBounds(
          devicesWithPosition.map(d => [d.position!.latitude, d.position!.longitude])
        )
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [devices, map])
  
  return null
}

// Componente interno para controlar o mapa
function MapController({
  devices,
  markersRef,
  mapRef
}: {
  devices: Device[]
  markersRef: React.MutableRefObject<{ [key: number]: L.Marker }>
  mapRef: React.MutableRefObject<L.Map | null>
}) {
  const map = useMap()

  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])

  return null
}

export interface MapHandle {
  focusOnDevice: (deviceId: number) => void
}

const Map = forwardRef<MapHandle, MapProps>(({ devices }, ref) => {
  // Coordenadas padrão (Cândido Mota, SP)
  const defaultCenter: [number, number] = [-22.7467, -50.3489]
  const markersRef = useRef<{ [key: number]: L.Marker }>({})
  const mapRef = useRef<L.Map | null>(null)

  const devicesWithPosition = devices.filter(d => d.position)

  // Se nenhum dispositivo tem posição, usar coordenadas padrão
  const center = devicesWithPosition.length > 0
    ? [devicesWithPosition[0].position!.latitude, devicesWithPosition[0].position!.longitude] as [number, number]
    : defaultCenter

  // Expor métodos para o componente pai
  useImperativeHandle(ref, () => ({
    focusOnDevice: (deviceId: number) => {
      const device = devices.find(d => d.id === deviceId)
      if (!device || !device.position) {
        console.warn('Device not found or has no position')
        return
      }

      const map = mapRef.current
      if (!map) {
        console.warn('Map not ready')
        return
      }

      // Centralizar e dar zoom
      map.setView(
        [device.position.latitude, device.position.longitude],
        16,
        { animate: true, duration: 1 }
      )

      // Abrir popup do marcador após um pequeno delay
      setTimeout(() => {
        const marker = markersRef.current[deviceId]
        if (marker) {
          marker.openPopup()

          // Adicionar animação de bounce
          const markerElement = marker.getElement()
          if (markerElement) {
            markerElement.classList.add('marker-bounce')
            setTimeout(() => {
              markerElement.classList.remove('marker-bounce')
            }, 2000)
          }
        }
      }, 500)
    }
  }), [devices])

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

        <MapRecenter devices={devices} />
        <MapController devices={devices} markersRef={markersRef} mapRef={mapRef} />

        {devicesWithPosition.map((device) => (
          <Marker
            key={device.id}
            position={[device.position!.latitude, device.position!.longitude]}
            icon={createDynamicIcon(device)}
            ref={(marker) => {
              if (marker) {
                markersRef.current[device.id] = marker
              }
            }}
          >
            <Popup>
              <DetailedPopup device={device} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Estilos para animação de bounce */}
      <style jsx global>{`
        @keyframes marker-bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-10px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-5px); }
        }

        .marker-bounce {
          animation: marker-bounce 0.6s ease-in-out 3;
        }
      `}</style>
    </div>
  )
})

Map.displayName = 'Map'

export default Map