import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Maximize2, Car, Truck, Bike, Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mockVehicles } from '@/data/mockVehicles';

const vehicleIcons: Record<string, typeof Car> = {
  car: Car,
  truck: Truck,
  motorcycle: Bike,
  tractor: Tractor,
};

const statusColors: Record<string, string> = {
  moving: '#10b981',
  stopped: '#f59e0b',
  idle: '#f59e0b',
  offline: '#ef4444',
};

export const DashboardMiniMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with dark theme
    const map = L.map(mapRef.current, {
      center: [-23.55, -46.63],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add vehicle markers
    mockVehicles.forEach((vehicle) => {
      const color = statusColors[vehicle.status] || '#6b7280';
      const IconComponent = vehicleIcons[vehicle.type] || Car;
      
      const icon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="8" width="18" height="10" rx="2" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
              <path d="M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([vehicle.position.lat, vehicle.position.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="text-sm">
            <strong>${vehicle.plate}</strong><br/>
            ${vehicle.driver || 'Sem motorista'}<br/>
            ${vehicle.speed} km/h
          </div>
        `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Mapa em Tempo Real</h3>
          <p className="text-sm text-muted-foreground">Visão geral da frota</p>
        </div>
        <Link to="/mapa">
          <Button variant="outline" size="sm" className="gap-2">
            <Maximize2 className="w-4 h-4" />
            Tela cheia
          </Button>
        </Link>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="flex-1 min-h-[300px] lg:min-h-0" />
    </div>
  );
};
