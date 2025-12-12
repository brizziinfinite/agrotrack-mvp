import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vehicle, mockVehicles, VehicleType } from '@/data/mockVehicles';
import { RouteHistory, RoutePoint } from '@/data/mockRouteHistory';

interface ReplayMode {
  active: boolean;
  route: RouteHistory | null;
  currentPosition: { lat: number; lng: number } | null;
  trailPoints: RoutePoint[];
  currentIndex: number;
}

interface VehicleMapProps {
  selectedVehicle?: Vehicle | null;
  onVehicleSelect?: (vehicle: Vehicle) => void;
  replayMode?: ReplayMode;
}

const vehicleEmojis: Record<VehicleType, string> = {
  car: '🚗',
  pickup: '🛻',
  truck: '🚛',
  motorcycle: '🏍️',
  bus: '🚌',
  tractor: '🚜',
  sprayer: '💧',
  harvester: '🌾',
  bicycle: '🚲',
  boat: '🚢',
  jetski: '🌊',
  person: '👤',
  animal: '🐕',
};

const statusColors: Record<string, string> = {
  moving: '#0d9488',
  stopped: '#f59e0b',
  idle: '#6b7280',
  offline: '#9ca3af',
};

const createVehicleIcon = (vehicle: Vehicle) => {
  const color = statusColors[vehicle.status];
  const emoji = vehicleEmojis[vehicle.type];
  const isMoving = vehicle.status === 'moving';
  
  const iconHtml = `
    <div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: ${isMoving ? `0 0 12px ${color}` : '0 2px 8px rgba(0,0,0,0.2)'};
      font-size: 18px;
      cursor: pointer;
    ">
      ${emoji}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-vehicle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const createReplayIcon = () => {
  const iconHtml = `
    <div style="
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0d9488, #14b8a6);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(13, 148, 136, 0.6), 0 4px 12px rgba(0,0,0,0.3);
      font-size: 20px;
      animation: pulse 1.5s ease-in-out infinite;
    ">
      🚗
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'replay-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const createPopupContent = (vehicle: Vehicle) => {
  return `
    <div style="min-width: 220px; font-family: system-ui, sans-serif; padding: 4px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <span style="font-size: 28px;">${vehicleEmojis[vehicle.type]}</span>
        <div>
          <div style="font-weight: 600; font-size: 15px; color: #1f2937;">${vehicle.name}</div>
          <div style="font-size: 12px; color: #6b7280;">${vehicle.plate} • ${vehicle.driver}</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Velocidade</div>
          <div style="font-size: 15px; font-weight: 600; color: #1f2937;">${Math.round(vehicle.speed)} km/h</div>
        </div>
        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Odômetro</div>
          <div style="font-size: 15px; font-weight: 600; color: #1f2937;">${vehicle.odometer.toLocaleString()} km</div>
        </div>
        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Horímetro</div>
          <div style="font-size: 15px; font-weight: 600; color: #1f2937;">${vehicle.hourmeter}h</div>
        </div>
        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 2px;">Combustível</div>
          <div style="font-size: 15px; font-weight: 600; color: #1f2937;">${vehicle.fuel.percentage}%</div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #6b7280; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <span>Ignição: ${vehicle.ignition ? '✅ Ligada' : '⛔ Desligada'}</span>
        <span style="color: ${statusColors[vehicle.status]}; font-weight: 500;">
          ${vehicle.status === 'moving' ? '● Em movimento' : vehicle.status === 'stopped' ? '● Parado' : vehicle.status === 'idle' ? '● Ocioso' : '● Offline'}
        </span>
      </div>
    </div>
  `;
};

export const VehicleMap = ({ selectedVehicle, onVehicleSelect, replayMode }: VehicleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [vehicles, setVehicles] = useState(mockVehicles);
  
  // Replay refs
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const traveledPolylineRef = useRef<L.Polyline | null>(null);
  const replayMarkerRef = useRef<L.Marker | null>(null);
  const trailPolylinesRef = useRef<L.Polyline[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-23.5505, -46.6333],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      .replay-marker div {
        animation: pulse 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      style.remove();
    };
  }, []);

  // Handle replay mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous replay elements
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (traveledPolylineRef.current) {
      map.removeLayer(traveledPolylineRef.current);
      traveledPolylineRef.current = null;
    }
    if (replayMarkerRef.current) {
      map.removeLayer(replayMarkerRef.current);
      replayMarkerRef.current = null;
    }
    trailPolylinesRef.current.forEach(p => map.removeLayer(p));
    trailPolylinesRef.current = [];

    if (replayMode?.active && replayMode.route) {
      // Hide regular markers during replay
      markersRef.current.forEach(marker => marker.setOpacity(0.2));

      const routePoints = replayMode.route.points.map(p => [p.lat, p.lng] as [number, number]);

      // Draw full route (gray)
      routePolylineRef.current = L.polyline(routePoints, {
        color: '#9ca3af',
        weight: 4,
        opacity: 0.5,
        dashArray: '10, 10',
      }).addTo(map);

      // Draw traveled portion (teal)
      const traveledPoints = routePoints.slice(0, replayMode.currentIndex + 1);
      traveledPolylineRef.current = L.polyline(traveledPoints, {
        color: '#0d9488',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

      // Draw trail effect
      if (replayMode.trailPoints.length > 1) {
        for (let i = 1; i < replayMode.trailPoints.length; i++) {
          const opacity = 0.1 + (i / replayMode.trailPoints.length) * 0.4;
          const trail = L.polyline(
            [
              [replayMode.trailPoints[i - 1].lat, replayMode.trailPoints[i - 1].lng],
              [replayMode.trailPoints[i].lat, replayMode.trailPoints[i].lng],
            ],
            {
              color: '#14b8a6',
              weight: 3,
              opacity,
            }
          ).addTo(map);
          trailPolylinesRef.current.push(trail);
        }
      }

      // Add replay marker at current position
      if (replayMode.currentPosition) {
        replayMarkerRef.current = L.marker(
          [replayMode.currentPosition.lat, replayMode.currentPosition.lng],
          { icon: createReplayIcon() }
        ).addTo(map);
      }

      // Fit bounds to show entire route
      if (routePoints.length > 0) {
        const bounds = L.latLngBounds(routePoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      // Show regular markers
      markersRef.current.forEach(marker => marker.setOpacity(1));
    }
  }, [replayMode]);

  // Update replay marker position smoothly
  useEffect(() => {
    if (replayMode?.active && replayMode.currentPosition && replayMarkerRef.current) {
      replayMarkerRef.current.setLatLng([
        replayMode.currentPosition.lat,
        replayMode.currentPosition.lng,
      ]);
    }

    // Update traveled polyline
    if (replayMode?.active && replayMode.route && traveledPolylineRef.current) {
      const traveledPoints = replayMode.route.points
        .slice(0, replayMode.currentIndex + 1)
        .map(p => [p.lat, p.lng] as [number, number]);
      traveledPolylineRef.current.setLatLngs(traveledPoints);
    }
  }, [replayMode?.currentPosition, replayMode?.currentIndex]);

  // Update markers when vehicles change (only when not in replay mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || replayMode?.active) return;

    vehicles.forEach((vehicle) => {
      const existingMarker = markersRef.current.get(vehicle.id);
      
      if (existingMarker) {
        existingMarker.setLatLng([vehicle.position.lat, vehicle.position.lng]);
        existingMarker.setIcon(createVehicleIcon(vehicle));
        existingMarker.getPopup()?.setContent(createPopupContent(vehicle));
      } else {
        const marker = L.marker([vehicle.position.lat, vehicle.position.lng], {
          icon: createVehicleIcon(vehicle),
        });

        marker.bindPopup(createPopupContent(vehicle), {
          maxWidth: 280,
          className: 'custom-popup',
        });

        marker.on('click', () => {
          onVehicleSelect?.(vehicle);
        });

        marker.addTo(map);
        markersRef.current.set(vehicle.id, marker);
      }
    });
  }, [vehicles, onVehicleSelect, replayMode?.active]);

  // Fly to selected vehicle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedVehicle || replayMode?.active) return;

    map.flyTo([selectedVehicle.position.lat, selectedVehicle.position.lng], 15, {
      duration: 1,
    });

    const marker = markersRef.current.get(selectedVehicle.id);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedVehicle, replayMode?.active]);

  // Simulate real-time updates (only when not in replay mode)
  useEffect(() => {
    if (replayMode?.active) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status === 'moving') {
            return {
              ...v,
              position: {
                lat: v.position.lat + (Math.random() - 0.5) * 0.001,
                lng: v.position.lng + (Math.random() - 0.5) * 0.001,
              },
              speed: Math.max(0, Math.min(120, v.speed + (Math.random() - 0.5) * 10)),
              lastUpdate: new Date(),
            };
          }
          return v;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [replayMode?.active]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-2xl"
      style={{ minHeight: '400px' }}
    />
  );
};
