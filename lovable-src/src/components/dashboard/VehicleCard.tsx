import { Vehicle, VehicleType } from '@/data/mockVehicles';
import { cn } from '@/lib/utils';
import { Car, Truck, Bike, Tractor, MapPin, Gauge, Fuel, Clock, History, Lock, Bus, Ship, Waves, User, Dog, Wheat, Droplets, CarFront, PersonStanding } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
  compact?: boolean;
  onHistoryClick?: () => void;
}

const vehicleIcons: Record<VehicleType, typeof Car> = {
  car: Car,
  pickup: CarFront,
  truck: Truck,
  motorcycle: Bike,
  bus: Bus,
  tractor: Tractor,
  sprayer: Droplets,
  harvester: Wheat,
  bicycle: Bike,
  boat: Ship,
  jetski: Waves,
  person: PersonStanding,
  animal: Dog,
};

const statusStyles = {
  moving: {
    dot: 'status-moving',
    text: 'text-primary',
    bg: 'bg-primary/5',
    label: 'Em movimento',
  },
  stopped: {
    dot: 'status-stopped',
    text: 'text-warning',
    bg: 'bg-warning/5',
    label: 'Parado',
  },
  idle: {
    dot: 'status-stopped',
    text: 'text-secondary',
    bg: 'bg-secondary/5',
    label: 'Ocioso',
  },
  offline: {
    dot: 'status-offline',
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    label: 'Offline',
  },
};

export const VehicleCard = ({ vehicle, onClick, compact = false, onHistoryClick }: VehicleCardProps) => {
  const Icon = vehicleIcons[vehicle.type];
  const status = statusStyles[vehicle.status];

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className={cn(
            'w-full text-left p-3 rounded-xl border bg-card hover:bg-muted/50 transition-all duration-200 group',
            vehicle.blocked ? 'border-destructive/50 bg-destructive/5' : 'border-border',
            status.bg
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              vehicle.blocked ? 'bg-destructive/10' : status.bg
            )}>
              <Icon className={cn('w-5 h-5', vehicle.blocked ? 'text-destructive' : status.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">{vehicle.name}</p>
                {vehicle.blocked ? (
                  <Lock className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                ) : (
                  <span className={cn('status-dot flex-shrink-0', status.dot)} />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
            </div>
            <div className="text-right">
              {vehicle.blocked ? (
                <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">{vehicle.speed} km/h</p>
                  <p className="text-xs text-muted-foreground">{vehicle.todayKm} km hoje</p>
                </>
              )}
            </div>
          </div>
        </button>
        {onHistoryClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHistoryClick();
            }}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-muted/80 hover:bg-primary/20 flex items-center justify-center transition-colors"
            title="Ver Histórico"
          >
            <History className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg interactive-card cursor-pointer',
        vehicle.blocked ? 'border-destructive/50' : 'border-border'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            vehicle.blocked ? 'bg-destructive/10' : status.bg
          )}>
            <Icon className={cn('w-6 h-6', vehicle.blocked ? 'text-destructive' : status.text)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
              {vehicle.blocked && <Lock className="w-4 h-4 text-destructive" />}
            </div>
            <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {vehicle.blocked ? (
            <Badge variant="destructive" className="gap-1">
              <Lock className="w-3 h-3" />
              Bloqueado
            </Badge>
          ) : (
            <>
              <span className={cn('status-dot', status.dot)} />
              <span className={cn('text-sm font-medium', status.text)}>{status.label}</span>
            </>
          )}
        </div>
      </div>

      {/* Driver */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs font-medium">{vehicle.driver.charAt(0)}</span>
        </div>
        <span>{vehicle.driver}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Velocidade</p>
            <p className="text-sm font-semibold text-foreground">{vehicle.speed} km/h</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Km hoje</p>
            <p className="text-sm font-semibold text-foreground">{vehicle.todayKm} km</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
          <Fuel className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Combustível</p>
            <p className="text-sm font-semibold text-foreground">{vehicle.fuel.percentage}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Horas hoje</p>
            <p className="text-sm font-semibold text-foreground">{vehicle.todayHours}h</p>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Última atualização: {formatDistanceToNow(vehicle.lastUpdate, { addSuffix: true, locale: ptBR })}
        </p>
      </div>
    </div>
  );
};
