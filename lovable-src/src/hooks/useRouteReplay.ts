import { useState, useCallback, useRef, useEffect } from 'react';
import { RouteHistory, RoutePoint } from '@/data/mockRouteHistory';

export interface ReplayState {
  isPlaying: boolean;
  currentIndex: number;
  playbackSpeed: number;
  progress: number;
  currentPoint: RoutePoint | null;
  elapsedDistance: number;
  elapsedTime: number;
}

export interface UseRouteReplayReturn extends ReplayState {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (index: number) => void;
  setSpeed: (speed: number) => void;
  route: RouteHistory | null;
  setRoute: (route: RouteHistory | null) => void;
  interpolatedPosition: { lat: number; lng: number } | null;
  trailPoints: RoutePoint[];
}

export const useRouteReplay = (): UseRouteReplayReturn => {
  const [route, setRoute] = useState<RouteHistory | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [interpolatedPosition, setInterpolatedPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(0);

  const totalPoints = route?.points.length ?? 0;
  const progress = totalPoints > 0 ? (currentIndex / (totalPoints - 1)) * 100 : 0;
  const currentPoint = route?.points[currentIndex] ?? null;

  // Calculate trail points (last 10 points)
  const trailPoints = route?.points.slice(Math.max(0, currentIndex - 10), currentIndex + 1) ?? [];

  // Calculate elapsed distance and time
  const elapsedDistance = route ? (route.stats.distance * progress) / 100 : 0;
  const elapsedTime = route ? (route.stats.duration * progress) / 100 : 0;

  const interpolatePosition = useCallback((index: number, fraction: number) => {
    if (!route || index >= route.points.length - 1) return null;

    const current = route.points[index];
    const next = route.points[index + 1];

    return {
      lat: current.lat + (next.lat - current.lat) * fraction,
      lng: current.lng + (next.lng - current.lng) * fraction,
    };
  }, [route]);

  const animate = useCallback((timestamp: number) => {
    if (!route || !isPlaying) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Calculate time between points based on actual route timestamps
    const currentPoint = route.points[currentIndex];
    const nextPoint = route.points[currentIndex + 1];
    
    if (!nextPoint) {
      setIsPlaying(false);
      return;
    }

    const pointDuration = nextPoint.timestamp.getTime() - currentPoint.timestamp.getTime();
    const adjustedDuration = pointDuration / playbackSpeed;
    
    progressRef.current += deltaTime;

    if (progressRef.current >= adjustedDuration) {
      progressRef.current = 0;
      setCurrentIndex(prev => {
        if (prev >= route.points.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    } else {
      // Interpolate position
      const fraction = progressRef.current / adjustedDuration;
      const pos = interpolatePosition(currentIndex, fraction);
      if (pos) {
        setInterpolatedPosition(pos);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [route, isPlaying, currentIndex, playbackSpeed, interpolatePosition]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      progressRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Update interpolated position when index changes
  useEffect(() => {
    if (route && currentIndex < route.points.length) {
      const point = route.points[currentIndex];
      setInterpolatedPosition({ lat: point.lat, lng: point.lng });
    }
  }, [route, currentIndex]);

  const play = useCallback(() => {
    if (route && currentIndex >= route.points.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, [route, currentIndex]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    progressRef.current = 0;
    if (route?.points[0]) {
      setInterpolatedPosition({
        lat: route.points[0].lat,
        lng: route.points[0].lng,
      });
    }
  }, [route]);

  const seekTo = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, totalPoints - 1));
    setCurrentIndex(clampedIndex);
    progressRef.current = 0;
  }, [totalPoints]);

  const setSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  const handleSetRoute = useCallback((newRoute: RouteHistory | null) => {
    setRoute(newRoute);
    setCurrentIndex(0);
    setIsPlaying(false);
    progressRef.current = 0;
    if (newRoute?.points[0]) {
      setInterpolatedPosition({
        lat: newRoute.points[0].lat,
        lng: newRoute.points[0].lng,
      });
    } else {
      setInterpolatedPosition(null);
    }
  }, []);

  return {
    isPlaying,
    currentIndex,
    playbackSpeed,
    progress,
    currentPoint,
    elapsedDistance,
    elapsedTime,
    play,
    pause,
    stop,
    seekTo,
    setSpeed,
    route,
    setRoute: handleSetRoute,
    interpolatedPosition,
    trailPoints,
  };
};
