export interface GeofenceCoordinates {
  center?: { lat: number; lng: number };
  radius?: number; // em metros
  points?: { lat: number; lng: number }[];
}

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: 'circle' | 'polygon';
  coordinates: GeofenceCoordinates;
  color: string;
  active: boolean;
  alertOnEnter: boolean;
  alertOnExit: boolean;
  assignedVehicles: string[];
  createdAt: Date;
}

export const mockGeofences: Geofence[] = [
  {
    id: 'g1',
    name: 'Base Central',
    description: 'Área principal de operações',
    type: 'circle',
    coordinates: {
      center: { lat: -23.5505, lng: -46.6333 },
      radius: 500,
    },
    color: '#0d9488',
    active: true,
    alertOnEnter: true,
    alertOnExit: true,
    assignedVehicles: ['v1', 'v2', 'v3'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'g2',
    name: 'Zona Industrial',
    description: 'Área de carga e descarga',
    type: 'polygon',
    coordinates: {
      points: [
        { lat: -23.5600, lng: -46.6400 },
        { lat: -23.5600, lng: -46.6300 },
        { lat: -23.5700, lng: -46.6300 },
        { lat: -23.5700, lng: -46.6400 },
      ],
    },
    color: '#f59e0b',
    active: true,
    alertOnEnter: false,
    alertOnExit: true,
    assignedVehicles: ['v2', 'v4'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'g3',
    name: 'Área Restrita',
    description: 'Proibido para veículos pesados',
    type: 'circle',
    coordinates: {
      center: { lat: -23.5400, lng: -46.6200 },
      radius: 300,
    },
    color: '#ef4444',
    active: true,
    alertOnEnter: true,
    alertOnExit: false,
    assignedVehicles: ['v5', 'v6', 'v7'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];
