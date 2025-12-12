// Utility functions for geofence calculations

export interface Point {
  lat: number;
  lng: number;
}

/**
 * Check if a point is inside a circle
 */
export function isPointInCircle(
  point: Point,
  center: Point,
  radiusInMeters: number
): boolean {
  const distance = calculateDistanceInMeters(point, center);
  return distance <= radiusInMeters;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistanceInMeters(p1: Point, p2: Point): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) *
      Math.cos(toRad(p2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get the center point of a polygon
 */
export function getPolygonCenter(polygon: Point[]): Point {
  if (!polygon || polygon.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sumLat = polygon.reduce((sum, p) => sum + p.lat, 0);
  const sumLng = polygon.reduce((sum, p) => sum + p.lng, 0);

  return {
    lat: sumLat / polygon.length,
    lng: sumLng / polygon.length,
  };
}
