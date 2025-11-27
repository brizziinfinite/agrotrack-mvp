'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Ícone customizado de trator para máquinas online
const tractorIconOnline = L.divIcon({
  className: 'custom-tractor-icon',
  html: `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4);
        border: 3px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12h18"/>
          <path d="M3 18h18"/>
          <path d="M7 7v11"/>
          <path d="M17 7v11"/>
          <circle cx="12" cy="6" r="3"/>
        </svg>
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
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48]
})

// Ícone customizado de trator para máquinas offline
const tractorIconOffline = L.divIcon({
  className: 'custom-tractor-icon',
  html: `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        border: 3px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12h18"/>
          <path d="M3 18h18"/>
          <path d="M7 7v11"/>
          <path d="M17 7v11"/>
          <circle cx="12" cy="6" r="3"/>
        </svg>
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
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48]
})

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

export default function Map({ devices }: MapProps) {
  // Coordenadas padrão (Cândido Mota, SP)
  const defaultCenter: [number, number] = [-22.7467, -50.3489]
  
  const devicesWithPosition = devices.filter(d => d.position)
  
  // Se nenhum dispositivo tem posição, usar coordenadas padrão
  const center = devicesWithPosition.length > 0
    ? [devicesWithPosition[0].position!.latitude, devicesWithPosition[0].position!.longitude] as [number, number]
    : defaultCenter

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
        
        {devicesWithPosition.map((device) => (
          <Marker
            key={device.id}
            position={[device.position!.latitude, device.position!.longitude]}
            icon={device.status === 'online' ? tractorIconOnline : tractorIconOffline}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <h3 className="font-bold text-lg mb-2 text-gray-900">{device.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-semibold ${device.status === 'online' ? 'text-green-600' : 'text-gray-600'}`}>
                      {device.status === 'online' ? '● Online' : '○ Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Velocidade:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round(device.position!.speed)} km/h
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Última atualização:</p>
                    <p className="text-xs font-medium text-gray-700">
                      {new Date(device.position!.deviceTime).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}