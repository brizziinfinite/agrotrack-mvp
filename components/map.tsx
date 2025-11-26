'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{device.name}</h3>
                <p className="text-sm">
                  <strong>Status:</strong>{' '}
                  <span className={device.status === 'online' ? 'text-green-600' : 'text-gray-600'}>
                    {device.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </p>
                <p className="text-sm">
                  <strong>Velocidade:</strong> {Math.round(device.position!.speed)} km/h
                </p>
                <p className="text-sm">
                  <strong>Última atualização:</strong>{' '}
                  {new Date(device.position!.deviceTime).toLocaleString('pt-BR')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}