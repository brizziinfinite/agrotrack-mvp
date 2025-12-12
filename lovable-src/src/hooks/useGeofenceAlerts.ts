import { useState, useEffect, useCallback, useRef } from 'react';
import { Geofence } from '@/data/mockGeofences';
import { Vehicle } from '@/data/mockVehicles';
import { isPointInCircle, isPointInPolygon } from '@/utils/geofenceUtils';
import { toast } from 'sonner';

export interface GeofenceAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  geofenceId: string;
  geofenceName: string;
  type: 'enter' | 'exit';
  timestamp: Date;
  acknowledged: boolean;
}

interface VehicleGeofenceState {
  [vehicleId: string]: {
    [geofenceId: string]: boolean;
  };
}

export function useGeofenceAlerts(
  vehicles: Vehicle[],
  geofences: Geofence[],
  enabled: boolean = true
) {
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const previousStateRef = useRef<VehicleGeofenceState>({});
  const isInitializedRef = useRef(false);

  const checkVehicleInGeofence = useCallback(
    (vehicle: Vehicle, geofence: Geofence): boolean => {
      if (!geofence.active) return false;
      if (!geofence.assignedVehicles.includes(vehicle.id)) return false;

      if (geofence.type === 'circle' && geofence.coordinates.center) {
        return isPointInCircle(
          vehicle.position,
          geofence.coordinates.center,
          geofence.coordinates.radius || 500
        );
      } else if (geofence.type === 'polygon' && geofence.coordinates.points) {
        return isPointInPolygon(vehicle.position, geofence.coordinates.points);
      }

      return false;
    },
    []
  );

  const triggerAlert = useCallback(
    (
      type: 'enter' | 'exit',
      vehicle: Vehicle,
      geofence: Geofence
    ) => {
      const newAlert: GeofenceAlert = {
        id: `ga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        type,
        timestamp: new Date(),
        acknowledged: false,
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, 50)); // Keep last 50 alerts

      // Show toast notification
      if (type === 'enter') {
        toast.info(`🚗 ${vehicle.name} entrou em "${geofence.name}"`, {
          description: `Veículo detectado dentro da cerca virtual`,
          duration: 5000,
        });
      } else {
        toast.warning(`🚗 ${vehicle.name} saiu de "${geofence.name}"`, {
          description: `Veículo deixou a área da cerca virtual`,
          duration: 5000,
        });
      }
    },
    []
  );

  const checkGeofences = useCallback(() => {
    if (!enabled) return;

    const currentState: VehicleGeofenceState = {};

    vehicles.forEach((vehicle) => {
      currentState[vehicle.id] = {};

      geofences.forEach((geofence) => {
        if (!geofence.active) return;
        if (!geofence.assignedVehicles.includes(vehicle.id)) return;

        const isInside = checkVehicleInGeofence(vehicle, geofence);
        currentState[vehicle.id][geofence.id] = isInside;

        // Only trigger alerts after initialization
        if (isInitializedRef.current) {
          const wasInside = previousStateRef.current[vehicle.id]?.[geofence.id];

          if (isInside && !wasInside && geofence.alertOnEnter) {
            triggerAlert('enter', vehicle, geofence);
          } else if (!isInside && wasInside && geofence.alertOnExit) {
            triggerAlert('exit', vehicle, geofence);
          }
        }
      });
    });

    previousStateRef.current = currentState;
    isInitializedRef.current = true;
  }, [vehicles, geofences, enabled, checkVehicleInGeofence, triggerAlert]);

  // Check geofences periodically
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkGeofences();

    // Check every 5 seconds
    const interval = setInterval(checkGeofences, 5000);

    return () => clearInterval(interval);
  }, [checkGeofences, enabled]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    acknowledgeAlert,
    clearAlerts,
    activeAlerts: alerts.filter((a) => !a.acknowledged),
  };
}
