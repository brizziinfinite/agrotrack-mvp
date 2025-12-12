export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: Date;
  speed: number;
  ignition: boolean;
}

export interface RouteHistory {
  id: string;
  vehicleId: string;
  date: Date;
  points: RoutePoint[];
  stats: {
    distance: number;
    duration: number;
    maxSpeed: number;
    avgSpeed: number;
    stops: number;
  };
}

// Generate realistic route points following São Paulo streets
const generateRoutePoints = (
  startLat: number,
  startLng: number,
  pointCount: number,
  baseTime: Date
): RoutePoint[] => {
  const points: RoutePoint[] = [];
  let currentLat = startLat;
  let currentLng = startLng;
  let currentTime = new Date(baseTime);

  for (let i = 0; i < pointCount; i++) {
    // Simulate realistic movement with occasional stops
    const isStop = Math.random() < 0.1;
    const speed = isStop ? 0 : Math.random() * 60 + 20;

    // Move in a somewhat consistent direction with slight variations
    const direction = Math.sin(i * 0.3) * 0.5 + Math.cos(i * 0.1) * 0.3;
    currentLat += (Math.random() * 0.001 + 0.0005) * (direction > 0 ? 1 : -1);
    currentLng += (Math.random() * 0.0015 + 0.0008);

    points.push({
      lat: currentLat,
      lng: currentLng,
      timestamp: new Date(currentTime),
      speed: Math.round(speed),
      ignition: true,
    });

    // Add time between points (3-10 seconds based on speed)
    const timeDelta = isStop ? 30000 + Math.random() * 60000 : 3000 + Math.random() * 7000;
    currentTime = new Date(currentTime.getTime() + timeDelta);
  }

  return points;
};

const calculateStats = (points: RoutePoint[]) => {
  let distance = 0;
  let maxSpeed = 0;
  let totalSpeed = 0;
  let stops = 0;
  let wasMoving = true;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // Calculate distance using Haversine formula (simplified)
    const dLat = (curr.lat - prev.lat) * 111000;
    const dLng = (curr.lng - prev.lng) * 111000 * Math.cos(prev.lat * Math.PI / 180);
    distance += Math.sqrt(dLat * dLat + dLng * dLng);

    maxSpeed = Math.max(maxSpeed, curr.speed);
    totalSpeed += curr.speed;

    if (curr.speed === 0 && wasMoving) {
      stops++;
      wasMoving = false;
    } else if (curr.speed > 0) {
      wasMoving = true;
    }
  }

  const duration = points.length > 1
    ? (points[points.length - 1].timestamp.getTime() - points[0].timestamp.getTime()) / 1000
    : 0;

  return {
    distance: Math.round(distance / 1000 * 10) / 10, // km
    duration: Math.round(duration / 60), // minutes
    maxSpeed: Math.round(maxSpeed),
    avgSpeed: Math.round(totalSpeed / points.length),
    stops,
  };
};

// Create mock route histories for vehicles
const today = new Date();
today.setHours(8, 0, 0, 0);

const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

export const mockRouteHistories: RouteHistory[] = [
  // Vehicle 1 - Today morning route
  (() => {
    const points = generateRoutePoints(-23.5505, -46.6333, 120, today);
    return {
      id: 'route-1-today-am',
      vehicleId: '1',
      date: today,
      points,
      stats: calculateStats(points),
    };
  })(),
  // Vehicle 1 - Today afternoon route
  (() => {
    const afternoon = new Date(today);
    afternoon.setHours(14, 0, 0, 0);
    const points = generateRoutePoints(-23.5605, -46.6433, 80, afternoon);
    return {
      id: 'route-1-today-pm',
      vehicleId: '1',
      date: afternoon,
      points,
      stats: calculateStats(points),
    };
  })(),
  // Vehicle 2 - Today route
  (() => {
    const points = generateRoutePoints(-23.5705, -46.6533, 150, today);
    return {
      id: 'route-2-today',
      vehicleId: '2',
      date: today,
      points,
      stats: calculateStats(points),
    };
  })(),
  // Vehicle 3 - Today route
  (() => {
    const points = generateRoutePoints(-23.5405, -46.6233, 100, today);
    return {
      id: 'route-3-today',
      vehicleId: '3',
      date: today,
      points,
      stats: calculateStats(points),
    };
  })(),
  // Vehicle 1 - Yesterday route
  (() => {
    const points = generateRoutePoints(-23.5555, -46.6383, 200, yesterday);
    return {
      id: 'route-1-yesterday',
      vehicleId: '1',
      date: yesterday,
      points,
      stats: calculateStats(points),
    };
  })(),
];

export const getRoutesByVehicle = (vehicleId: string): RouteHistory[] => {
  return mockRouteHistories.filter(route => route.vehicleId === vehicleId);
};

export const getRoutesByDate = (vehicleId: string, date: Date): RouteHistory[] => {
  return mockRouteHistories.filter(route => {
    const routeDate = new Date(route.date);
    return (
      route.vehicleId === vehicleId &&
      routeDate.toDateString() === date.toDateString()
    );
  });
};
