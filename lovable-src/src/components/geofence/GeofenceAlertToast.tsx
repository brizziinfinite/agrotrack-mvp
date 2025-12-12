import { LogIn, LogOut, MapPin, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GeofenceAlert } from '@/hooks/useGeofenceAlerts';
import { Button } from '@/components/ui/button';

interface GeofenceAlertToastProps {
  alert: GeofenceAlert;
  onAcknowledge?: () => void;
  onViewOnMap?: () => void;
}

export const GeofenceAlertToast = ({
  alert,
  onAcknowledge,
  onViewOnMap,
}: GeofenceAlertToastProps) => {
  const isEnter = alert.type === 'enter';

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all duration-200',
        isEnter
          ? 'bg-primary/5 border-primary/30'
          : 'bg-warning/5 border-warning/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            isEnter ? 'bg-primary/10' : 'bg-warning/10'
          )}
        >
          {isEnter ? (
            <LogIn className={cn('w-5 h-5', 'text-primary')} />
          ) : (
            <LogOut className={cn('w-5 h-5', 'text-warning')} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {alert.vehicleName}{' '}
            {isEnter ? 'entrou em' : 'saiu de'}{' '}
            <span className="font-semibold">{alert.geofenceName}</span>
          </p>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Car className="w-3 h-3" />
            <span>{alert.vehicleName}</span>
            <span>•</span>
            <MapPin className="w-3 h-3" />
            <span>{alert.geofenceName}</span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(alert.timestamp, {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>

          <div className="flex items-center gap-2 mt-3">
            {onViewOnMap && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onViewOnMap}
              >
                <MapPin className="w-3 h-3 mr-1" />
                Ver no mapa
              </Button>
            )}
            {onAcknowledge && !alert.acknowledged && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onAcknowledge}
              >
                Confirmar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
