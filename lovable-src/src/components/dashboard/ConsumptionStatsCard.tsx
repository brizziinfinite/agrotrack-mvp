import { Fuel, Route, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface ConsumptionStatsCardProps {
  consumptionPerKm: string;
  consumptionPerHour: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export const ConsumptionStatsCard = ({
  consumptionPerKm,
  consumptionPerHour,
  trend,
}: ConsumptionStatsCardProps) => {
  return (
    <div
      className="
        relative overflow-hidden rounded-2xl border p-3 sm:p-5 h-full min-h-[120px] sm:min-h-[140px]
        transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
        bg-gradient-to-br from-muted to-muted/80 border-border
      "
    >
      {/* Icon */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-muted-foreground/20 text-muted-foreground">
          <Fuel className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground pr-12">Consumo</p>
        
        {/* Duas métricas */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-primary" />
            <span className="text-lg sm:text-xl font-bold text-foreground">{consumptionPerKm}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">L/km</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-lg sm:text-xl font-bold text-foreground">{consumptionPerHour}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">L/h</span>
          </div>
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span
              className={`flex items-center gap-1 font-medium ${
                trend.direction === 'up' ? 'text-destructive' : 'text-accent'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              {trend.value}%
            </span>
            <span className="text-muted-foreground">vs semana</span>
          </div>
        )}
      </div>
    </div>
  );
};
