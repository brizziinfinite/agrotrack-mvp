import { useState } from 'react';
import { X, Play, Calendar, Clock, Gauge, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RouteHistory, getRoutesByDate } from '@/data/mockRouteHistory';
import { Vehicle } from '@/data/mockVehicles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RouteReplayPanelProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSelectRoute: (route: RouteHistory) => void;
}

export const RouteReplayPanel = ({ vehicle, onClose, onSelectRoute }: RouteReplayPanelProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const routes = getRoutesByDate(vehicle.id, selectedDate);

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80">
      <div className="bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Histórico de Rotas</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg">{vehicle.type === 'car' ? '🚗' : vehicle.type === 'truck' ? '🚛' : vehicle.type === 'motorcycle' ? '🏍️' : '🚜'}</span>
            <span>{vehicle.name}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{vehicle.plate}</span>
          </div>
        </div>

        {/* Date Picker */}
        <div className="p-4 border-b border-border/50">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[1001]" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Routes List */}
        <ScrollArea className="h-80">
          <div className="p-4 space-y-3">
            {routes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma rota encontrada</p>
                <p className="text-xs mt-1">para esta data</p>
              </div>
            ) : (
              routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-muted/30 rounded-xl p-4 border border-border/30 hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => onSelectRoute(route)}
                >
                  {/* Route Time */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {formatTime(route.points[0].timestamp)} - {formatTime(route.points[route.points.length - 1].timestamp)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Replay
                    </Button>
                  </div>

                  {/* Route Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background/50 rounded-lg p-2">
                      <div className="text-sm font-bold text-foreground">
                        {route.stats.distance} km
                      </div>
                      <div className="text-xs text-muted-foreground">Distância</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2">
                      <div className="text-sm font-bold text-foreground">
                        {formatDuration(route.stats.duration)}
                      </div>
                      <div className="text-xs text-muted-foreground">Duração</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-2">
                      <div className="flex items-center justify-center gap-1">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">
                          {route.stats.maxSpeed}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">Máx km/h</div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                    <span>Média: {route.stats.avgSpeed} km/h</span>
                    <span>{route.stats.stops} paradas</span>
                    <span>{route.points.length} pontos</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
