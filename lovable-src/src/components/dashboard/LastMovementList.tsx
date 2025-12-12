import { Link } from 'react-router-dom';
import { Clock, Gauge, Route } from 'lucide-react';
import { mockVehicles } from '@/data/mockVehicles';

const statusConfig = {
  moving: { color: 'bg-accent', label: 'Em movimento' },
  stopped: { color: 'bg-warning', label: 'Parado' },
  idle: { color: 'bg-warning', label: 'Ocioso' },
  offline: { color: 'bg-destructive', label: 'Offline' },
};

export const LastMovementList = () => {
  // Get vehicles sorted by most recent activity (mock: use connected ones first)
  const recentVehicles = mockVehicles
    .filter((v) => v.status !== 'offline')
    .slice(0, 5);

  // Generate mock last event times
  const getLastEventTime = (index: number) => {
    const hours = 8 + Math.floor(index * 0.5);
    const minutes = Math.floor(Math.random() * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Último Movimento</h3>
          <p className="text-sm text-muted-foreground">Veículos mais recentes</p>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="space-y-3">
        {recentVehicles.map((vehicle, index) => {
          const status = statusConfig[vehicle.status as keyof typeof statusConfig];
          const lastTime = getLastEventTime(index);
          
          return (
            <Link
              to="/mapa"
              key={vehicle.id}
              className="block p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                  <span className="font-medium text-foreground">{vehicle.plate}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {lastTime}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{vehicle.speed} km/h</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Route className="w-3.5 h-3.5" />
                  <span>{vehicle.todayKm} km</span>
                </div>
              </div>
              
              {vehicle.driver && (
                <p className="text-xs text-muted-foreground mt-1.5 truncate">
                  {vehicle.driver}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
