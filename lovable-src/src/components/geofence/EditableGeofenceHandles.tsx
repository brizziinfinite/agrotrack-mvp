import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Geofence } from '@/data/mockGeofences';

interface EditableGeofenceHandlesProps {
  map: L.Map | null;
  geofence: Geofence | null;
  onGeofenceUpdate: (geofenceId: string, coordinates: Geofence['coordinates']) => void;
  isEditing: boolean;
}

const createDraggablePointIcon = (isCenter: boolean = false, isRadius: boolean = false) => {
  let color = '#3b82f6';
  let size = 12;
  
  if (isCenter) {
    color = '#0d9488';
    size = 16;
  } else if (isRadius) {
    color = '#f59e0b';
    size = 14;
  }
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: move;
      "></div>
    `,
    className: 'editable-point-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const useEditableGeofenceHandles = ({
  map,
  geofence,
  onGeofenceUpdate,
  isEditing,
}: EditableGeofenceHandlesProps) => {
  const markersRef = useRef<L.Marker[]>([]);
  const previewLayerRef = useRef<L.Circle | L.Polygon | null>(null);

  const clearHandles = useCallback(() => {
    if (!map) return;
    
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];
    
    if (previewLayerRef.current) {
      map.removeLayer(previewLayerRef.current);
      previewLayerRef.current = null;
    }
  }, [map]);

  const updateCirclePreview = useCallback((center: { lat: number; lng: number }, radius: number, color: string) => {
    if (!map) return;
    
    if (previewLayerRef.current) {
      map.removeLayer(previewLayerRef.current);
    }
    
    previewLayerRef.current = L.circle([center.lat, center.lng], {
      radius,
      color,
      fillColor: color,
      fillOpacity: 0.3,
      weight: 3,
      dashArray: '5, 5',
    }).addTo(map);
  }, [map]);

  const updatePolygonPreview = useCallback((points: { lat: number; lng: number }[], color: string) => {
    if (!map) return;
    
    if (previewLayerRef.current) {
      map.removeLayer(previewLayerRef.current);
    }
    
    const latLngs: L.LatLngExpression[] = points.map(p => [p.lat, p.lng]);
    
    previewLayerRef.current = L.polygon(latLngs, {
      color,
      fillColor: color,
      fillOpacity: 0.3,
      weight: 3,
      dashArray: '5, 5',
    }).addTo(map);
  }, [map]);

  useEffect(() => {
    if (!map || !geofence || !isEditing) {
      clearHandles();
      return;
    }

    clearHandles();

    if (geofence.type === 'circle' && geofence.coordinates.center) {
      const center = geofence.coordinates.center;
      const radius = geofence.coordinates.radius || 500;

      // Show preview
      updateCirclePreview(center, radius, geofence.color);

      // Center marker (draggable)
      const centerMarker = L.marker([center.lat, center.lng], {
        icon: createDraggablePointIcon(true),
        draggable: true,
      }).addTo(map);

      let currentCenter = { ...center };
      let currentRadius = radius;

      centerMarker.on('drag', (e) => {
        const newLatLng = (e.target as L.Marker).getLatLng();
        currentCenter = { lat: newLatLng.lat, lng: newLatLng.lng };
        updateCirclePreview(currentCenter, currentRadius, geofence.color);
        
        // Update radius marker position
        const radiusMarker = markersRef.current[1];
        if (radiusMarker) {
          const angle = 90 * (Math.PI / 180);
          const dx = currentRadius * Math.cos(angle) / (111320 * Math.cos(currentCenter.lat * Math.PI / 180));
          const dy = currentRadius * Math.sin(angle) / 110540;
          radiusMarker.setLatLng([currentCenter.lat + dy, currentCenter.lng + dx]);
        }
      });

      centerMarker.on('dragend', () => {
        onGeofenceUpdate(geofence.id, {
          center: currentCenter,
          radius: currentRadius,
        });
      });

      markersRef.current.push(centerMarker);

      // Radius handle marker
      const angle = 90 * (Math.PI / 180);
      const dx = radius * Math.cos(angle) / (111320 * Math.cos(center.lat * Math.PI / 180));
      const dy = radius * Math.sin(angle) / 110540;
      
      const radiusMarker = L.marker([center.lat + dy, center.lng + dx], {
        icon: createDraggablePointIcon(false, true),
        draggable: true,
      }).addTo(map);

      radiusMarker.on('drag', (e) => {
        const newLatLng = (e.target as L.Marker).getLatLng();
        const centerLatLng = L.latLng(currentCenter.lat, currentCenter.lng);
        currentRadius = centerLatLng.distanceTo(newLatLng);
        updateCirclePreview(currentCenter, currentRadius, geofence.color);
      });

      radiusMarker.on('dragend', () => {
        onGeofenceUpdate(geofence.id, {
          center: currentCenter,
          radius: Math.round(currentRadius),
        });
      });

      markersRef.current.push(radiusMarker);

    } else if (geofence.type === 'polygon' && geofence.coordinates.points) {
      const points = [...geofence.coordinates.points];
      
      // Show preview
      updatePolygonPreview(points, geofence.color);

      // Create draggable markers for each vertex
      points.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng], {
          icon: createDraggablePointIcon(),
          draggable: true,
        }).addTo(map);

        marker.on('drag', (e) => {
          const newLatLng = (e.target as L.Marker).getLatLng();
          points[index] = { lat: newLatLng.lat, lng: newLatLng.lng };
          updatePolygonPreview(points, geofence.color);
        });

        marker.on('dragend', () => {
          onGeofenceUpdate(geofence.id, {
            points: [...points],
          });
        });

        markersRef.current.push(marker);
      });
    }

    return () => {
      clearHandles();
    };
  }, [map, geofence, isEditing, onGeofenceUpdate, clearHandles, updateCirclePreview, updatePolygonPreview]);

  return { clearHandles };
};
