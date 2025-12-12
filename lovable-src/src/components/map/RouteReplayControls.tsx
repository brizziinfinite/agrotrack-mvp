import { Play, Pause, Square, SkipBack, SkipForward, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { UseRouteReplayReturn } from '@/hooks/useRouteReplay';

interface RouteReplayControlsProps {
  replay: UseRouteReplayReturn;
  onClose: () => void;
  vehicleName?: string;
}

const speedOptions = [0.5, 1, 2, 4, 8];

export const RouteReplayControls = ({ replay, onClose, vehicleName }: RouteReplayControlsProps) => {
  const {
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
  } = replay;

  const totalPoints = route?.points.length ?? 0;

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-xl">
      <div className="bg-background/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              Replay: {vehicleName || 'Veículo'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Timeline Slider */}
        <div className="mb-4">
          <Slider
            value={[currentIndex]}
            max={Math.max(0, totalPoints - 1)}
            step={1}
            onValueChange={([value]) => seekTo(value)}
            className="cursor-pointer"
          />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{route?.points[0] ? formatDateTime(route.points[0].timestamp) : '--:--'}</span>
            <span>
              {currentPoint ? formatDateTime(currentPoint.timestamp) : '--:--'}
            </span>
            <span>
              {route?.points[totalPoints - 1]
                ? formatDateTime(route.points[totalPoints - 1].timestamp)
                : '--:--'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => seekTo(0)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              className="h-11 w-11 rounded-full"
              onClick={isPlaying ? pause : play}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={stop}
            >
              <Square className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => seekTo(totalPoints - 1)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {speedOptions.map((speed) => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs rounded-md"
                onClick={() => setSpeed(speed)}
              >
                {speed}x
              </Button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {currentPoint?.speed ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">km/h</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {elapsedDistance.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">km</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-muted-foreground">tempo</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
