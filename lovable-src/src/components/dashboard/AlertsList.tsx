import { mockAlerts, mockVehicles } from '@/data/mockVehicles';
import { cn } from '@/lib/utils';
import { AlertTriangle, Fuel, Gauge, MapPin, Clock, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const alertIcons = {
  speed: Gauge,
  geofence: MapPin,
  maintenance: AlertTriangle,
  fuel: Fuel,
  idle: Clock,
};

const severityStyles = {
  low: {
    bg: 'bg-muted',
    border: 'border-muted-foreground/20',
    icon: 'text-muted-foreground',
  },
  medium: {
    bg: 'bg-warning/5',
    border: 'border-warning/30',
    icon: 'text-warning',
  },
  high: {
    bg: 'bg-destructive/5',
    border: 'border-destructive/30',
    icon: 'text-destructive',
  },
};

export const AlertsList = () => {
  const activeAlerts = mockAlerts.filter((a) => !a.acknowledged).slice(0, 5);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Alertas Ativos</h3>
          <p className="text-sm text-muted-foreground">{activeAlerts.length} alertas pendentes</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
          Ver todos
        </Button>
      </div>

      <div className="space-y-3">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-accent mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum alerta ativo</p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const Icon = alertIcons[alert.type];
            const styles = severityStyles[alert.severity];
            const vehicle = mockVehicles.find((v) => v.id === alert.vehicleId);

            return (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-xl border transition-all duration-200 hover:shadow-md',
                  styles.bg,
                  styles.border
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', styles.bg)}>
                    <Icon className={cn('w-4 h-4', styles.icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{vehicle?.name}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
