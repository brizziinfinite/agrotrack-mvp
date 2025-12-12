import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geofence } from '@/data/mockGeofences';
import { mockVehicles, VehicleType } from '@/data/mockVehicles';
import { DrawingToolbar, DrawingMode } from './DrawingToolbar';
import { useEditableGeofenceHandles } from './EditableGeofenceHandles';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GeofenceMapProps {
  geofences: Geofence[];
  selectedGeofence?: Geofence | null;
  editingGeofence?: Geofence | null;
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  onGeofenceClick?: (geofence: Geofence) => void;
  onDrawingComplete?: (type: 'circle' | 'polygon', coordinates: Geofence['coordinates']) => void;
  onGeofenceUpdate?: (geofenceId: string, coordinates: Geofence['coordinates']) => void;
}

interface DrawingState {
  mode: DrawingMode;
  center?: { lat: number; lng: number };
  radius?: number;
  points: { lat: number; lng: number }[];
  isSettingRadius: boolean;
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

const createVehicleIcon = (type: VehicleType, blocked: boolean = false) => {
  const emoji = vehicleEmojis[type];
  const bgColor = blocked ? '#ef4444' : '#0d9488';

  const iconHtml = `
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: ${bgColor};
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 14px;
    ">
      ${emoji}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-vehicle-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createPointIcon = (isFirst: boolean = false) => {
  const color = isFirst ? '#0d9488' : '#3b82f6';
  const size = isFirst ? 14 : 10;
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: ${isFirst ? 'pointer' : 'default'};
      "></div>
    `,
    className: 'drawing-point-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const GeofenceMap = ({
  geofences,
  selectedGeofence,
  editingGeofence,
  onMapClick,
  onGeofenceClick,
  onDrawingComplete,
  onGeofenceUpdate,
}: GeofenceMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geofenceLayersRef = useRef<Map<string, L.Circle | L.Polygon>>(new Map());
  const vehicleMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const drawingLayersRef = useRef<{
    preview?: L.Circle | L.Polygon | L.Polyline;
    centerMarker?: L.Marker;
    pointMarkers: L.Marker[];
  }>({ pointMarkers: [] });

  const [drawingState, setDrawingState] = useState<DrawingState>({
    mode: 'none',
    points: [],
    isSettingRadius: false,
  });

  // Editable geofence handles
  useEditableGeofenceHandles({
    map: mapInstanceRef.current,
    geofence: editingGeofence || null,
    onGeofenceUpdate: onGeofenceUpdate || (() => {}),
    isEditing: !!editingGeofence,
  });

  // Clear drawing layers
  const clearDrawingLayers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layers = drawingLayersRef.current;
    if (layers.preview) {
      map.removeLayer(layers.preview);
      layers.preview = undefined;
    }
    if (layers.centerMarker) {
      map.removeLayer(layers.centerMarker);
      layers.centerMarker = undefined;
    }
    layers.pointMarkers.forEach((marker) => map.removeLayer(marker));
    layers.pointMarkers = [];
  }, []);

  // Calculate distance between two points
  const calculateDistance = (p1: L.LatLng, p2: L.LatLng): number => {
    return p1.distanceTo(p2);
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-23.5505, -46.6333],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click for drawing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const latlng = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (drawingState.mode === 'none') {
        onMapClick?.(latlng);
        return;
      }

      if (drawingState.mode === 'circle') {
        if (!drawingState.center) {
          // First click sets center
          setDrawingState((prev) => ({
            ...prev,
            center: latlng,
            isSettingRadius: true,
          }));
        } else if (drawingState.isSettingRadius) {
          // Second click sets radius
          const center = L.latLng(drawingState.center.lat, drawingState.center.lng);
          const radius = calculateDistance(center, e.latlng);
          setDrawingState((prev) => ({
            ...prev,
            radius,
            isSettingRadius: false,
          }));
        }
      } else if (drawingState.mode === 'polygon') {
        // Check if clicking near the first point to close polygon
        if (drawingState.points.length >= 3) {
          const firstPoint = drawingState.points[0];
          const firstLatLng = L.latLng(firstPoint.lat, firstPoint.lng);
          const distance = calculateDistance(firstLatLng, e.latlng);
          
          if (distance < 50) {
            // Close polygon - don't add the point, just mark as complete
            return;
          }
        }
        
        setDrawingState((prev) => ({
          ...prev,
          points: [...prev.points, latlng],
        }));
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (drawingState.mode === 'circle' && drawingState.center && drawingState.isSettingRadius) {
        const center = L.latLng(drawingState.center.lat, drawingState.center.lng);
        const radius = calculateDistance(center, e.latlng);
        
        // Update preview circle
        clearDrawingLayers();
        
        const preview = L.circle([drawingState.center.lat, drawingState.center.lng], {
          radius,
          color: '#0d9488',
          fillColor: '#0d9488',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map);
        
        const centerMarker = L.marker([drawingState.center.lat, drawingState.center.lng], {
          icon: createPointIcon(true),
        }).addTo(map);
        
        drawingLayersRef.current.preview = preview;
        drawingLayersRef.current.centerMarker = centerMarker;
      }
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMouseMove);

    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMouseMove);
    };
  }, [drawingState, onMapClick, clearDrawingLayers]);

  // Update drawing preview for polygon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || drawingState.mode !== 'polygon') return;

    clearDrawingLayers();

    if (drawingState.points.length === 0) return;

    // Add point markers
    drawingState.points.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createPointIcon(index === 0),
      }).addTo(map);
      
      if (index === 0 && drawingState.points.length >= 3) {
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          // Trigger confirm when clicking first point
          handleConfirm();
        });
      }
      
      drawingLayersRef.current.pointMarkers.push(marker);
    });

    // Add polyline preview
    if (drawingState.points.length >= 2) {
      const latLngs: L.LatLngExpression[] = drawingState.points.map(
        (p) => [p.lat, p.lng] as L.LatLngExpression
      );
      
      const polyline = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);
      
      drawingLayersRef.current.preview = polyline;
    }

    // Add preview polygon if 3+ points
    if (drawingState.points.length >= 3) {
      if (drawingLayersRef.current.preview) {
        map.removeLayer(drawingLayersRef.current.preview);
      }
      
      const latLngs: L.LatLngExpression[] = drawingState.points.map(
        (p) => [p.lat, p.lng] as L.LatLngExpression
      );
      
      const polygon = L.polygon(latLngs, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);
      
      drawingLayersRef.current.preview = polygon;
    }
  }, [drawingState.points, drawingState.mode, clearDrawingLayers]);

  // Update preview for circle with fixed radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || drawingState.mode !== 'circle') return;

    if (drawingState.center && !drawingState.isSettingRadius && drawingState.radius) {
      clearDrawingLayers();
      
      const preview = L.circle([drawingState.center.lat, drawingState.center.lng], {
        radius: drawingState.radius,
        color: '#0d9488',
        fillColor: '#0d9488',
        fillOpacity: 0.2,
        weight: 2,
      }).addTo(map);
      
      const centerMarker = L.marker([drawingState.center.lat, drawingState.center.lng], {
        icon: createPointIcon(true),
      }).addTo(map);
      
      drawingLayersRef.current.preview = preview;
      drawingLayersRef.current.centerMarker = centerMarker;
    }
  }, [drawingState.center, drawingState.radius, drawingState.isSettingRadius, drawingState.mode, clearDrawingLayers]);

  // Update geofences on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing geofence layers
    geofenceLayersRef.current.forEach((layer) => map.removeLayer(layer));
    geofenceLayersRef.current.clear();

    // Add geofences
    geofences.forEach((geofence) => {
      let layer: L.Circle | L.Polygon;

      if (geofence.type === 'circle' && geofence.coordinates.center) {
        layer = L.circle(
          [geofence.coordinates.center.lat, geofence.coordinates.center.lng],
          {
            radius: geofence.coordinates.radius || 500,
            color: geofence.color,
            fillColor: geofence.color,
            fillOpacity: geofence.active ? 0.2 : 0.05,
            weight: selectedGeofence?.id === geofence.id ? 4 : 2,
            dashArray: geofence.active ? undefined : '10, 10',
          }
        );
      } else if (geofence.type === 'polygon' && geofence.coordinates.points) {
        const latLngs: L.LatLngExpression[] = geofence.coordinates.points.map(
          (p) => [p.lat, p.lng] as L.LatLngExpression
        );
        layer = L.polygon(latLngs, {
          color: geofence.color,
          fillColor: geofence.color,
          fillOpacity: geofence.active ? 0.2 : 0.05,
          weight: selectedGeofence?.id === geofence.id ? 4 : 2,
          dashArray: geofence.active ? undefined : '10, 10',
        });
      } else {
        return;
      }

      layer.bindPopup(`
        <div style="min-width: 150px;">
          <strong>${geofence.name}</strong>
          ${geofence.description ? `<p style="margin: 4px 0 0; color: #666;">${geofence.description}</p>` : ''}
          <p style="margin: 8px 0 0; font-size: 12px; color: ${geofence.active ? '#0d9488' : '#9ca3af'};">
            ${geofence.active ? '✅ Ativa' : '⏸️ Inativa'}
          </p>
        </div>
      `);

      layer.on('click', () => onGeofenceClick?.(geofence));
      layer.addTo(map);
      geofenceLayersRef.current.set(geofence.id, layer);
    });
  }, [geofences, selectedGeofence, onGeofenceClick]);

  // Update vehicle markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    vehicleMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    vehicleMarkersRef.current.clear();

    // Add vehicle markers
    mockVehicles.forEach((vehicle) => {
      const marker = L.marker([vehicle.position.lat, vehicle.position.lng], {
        icon: createVehicleIcon(vehicle.type, (vehicle as any).blocked),
      });

      marker.bindPopup(`
        <div style="min-width: 120px;">
          <strong>${vehicle.name}</strong>
          <p style="margin: 4px 0 0; color: #666;">${vehicle.plate}</p>
        </div>
      `);

      marker.addTo(map);
      vehicleMarkersRef.current.set(vehicle.id, marker);
    });
  }, []);

  // Fly to selected geofence
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedGeofence) return;

    if (selectedGeofence.type === 'circle' && selectedGeofence.coordinates.center) {
      map.flyTo(
        [selectedGeofence.coordinates.center.lat, selectedGeofence.coordinates.center.lng],
        14,
        { duration: 0.5 }
      );
    } else if (selectedGeofence.type === 'polygon' && selectedGeofence.coordinates.points?.length) {
      const bounds = L.latLngBounds(
        selectedGeofence.coordinates.points.map((p) => [p.lat, p.lng])
      );
      map.flyToBounds(bounds, { padding: [50, 50], duration: 0.5 });
    }
  }, [selectedGeofence]);

  const handleModeChange = (mode: DrawingMode) => {
    clearDrawingLayers();
    setDrawingState({
      mode,
      points: [],
      isSettingRadius: false,
    });
    
    // Change cursor when entering drawing mode
    const mapContainer = mapRef.current;
    if (mapContainer) {
      if (mode !== 'none') {
        mapContainer.style.cursor = 'crosshair';
      } else {
        mapContainer.style.cursor = '';
      }
    }
  };

  const handleConfirm = () => {
    if (drawingState.mode === 'circle' && drawingState.center && drawingState.radius) {
      onDrawingComplete?.('circle', {
        center: drawingState.center,
        radius: Math.round(drawingState.radius),
      });
    } else if (drawingState.mode === 'polygon' && drawingState.points.length >= 3) {
      onDrawingComplete?.('polygon', {
        points: drawingState.points,
      });
    }
    
    clearDrawingLayers();
    setDrawingState({
      mode: 'none',
      points: [],
      isSettingRadius: false,
    });
    
    // Reset cursor
    const mapContainer = mapRef.current;
    if (mapContainer) {
      mapContainer.style.cursor = '';
    }
  };

  const handleCancel = () => {
    clearDrawingLayers();
    setDrawingState({
      mode: 'none',
      points: [],
      isSettingRadius: false,
    });
    
    // Reset cursor
    const mapContainer = mapRef.current;
    if (mapContainer) {
      mapContainer.style.cursor = '';
    }
  };

  const handleUndo = () => {
    if (drawingState.mode === 'polygon' && drawingState.points.length > 0) {
      setDrawingState((prev) => ({
        ...prev,
        points: prev.points.slice(0, -1),
      }));
    } else if (drawingState.mode === 'circle') {
      if (drawingState.radius && !drawingState.isSettingRadius) {
        setDrawingState((prev) => ({
          ...prev,
          radius: undefined,
          isSettingRadius: true,
        }));
      } else if (drawingState.center) {
        clearDrawingLayers();
        setDrawingState((prev) => ({
          ...prev,
          center: undefined,
          isSettingRadius: false,
        }));
      }
    }
  };

  const getInstruction = (): string => {
    if (drawingState.mode === 'circle') {
      if (!drawingState.center) {
        return 'Clique no mapa para definir o centro do círculo';
      } else if (drawingState.isSettingRadius) {
        return 'Mova o mouse e clique para definir o raio';
      } else {
        return 'Clique em "Confirmar" para criar a cerca';
      }
    } else if (drawingState.mode === 'polygon') {
      if (drawingState.points.length === 0) {
        return 'Clique no mapa para adicionar o primeiro ponto';
      } else if (drawingState.points.length < 3) {
        return `Adicione mais ${3 - drawingState.points.length} ponto(s) para formar o polígono`;
      } else {
        return 'Clique no primeiro ponto ou em "Confirmar" para fechar o polígono';
      }
    }
    return '';
  };

  const canUndo = 
    (drawingState.mode === 'polygon' && drawingState.points.length > 0) ||
    (drawingState.mode === 'circle' && (!!drawingState.center || !!drawingState.radius));

  const canConfirm =
    (drawingState.mode === 'circle' && !!drawingState.center && !!drawingState.radius && !drawingState.isSettingRadius) ||
    (drawingState.mode === 'polygon' && drawingState.points.length >= 3);

  const isDrawing = drawingState.mode !== 'none';

  return (
    <div className="relative w-full h-full">
      {/* Drawing mode border indicator */}
      {isDrawing && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl border-4 border-primary/60 shadow-lg shadow-primary/20 z-10" />
      )}
      
      <DrawingToolbar
        mode={drawingState.mode}
        onModeChange={handleModeChange}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onUndo={handleUndo}
        canUndo={canUndo}
        canConfirm={canConfirm}
        instruction={getInstruction()}
      />
      <div
        ref={mapRef}
        className={cn(
          "w-full h-full rounded-2xl transition-all duration-200",
          isDrawing && "ring-2 ring-primary"
        )}
        style={{ 
          minHeight: '400px',
          cursor: isDrawing ? 'crosshair' : 'grab'
        }}
      />
    </div>
  );
};
