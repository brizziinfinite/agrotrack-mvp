import { Activity } from 'lucide-react';

interface FleetStatusCardProps {
  moving: number;
  stopped: number;
  offline: number;
}

export const FleetStatusCard = ({ moving, stopped, offline }: FleetStatusCardProps) => {
  return (
    <div
      className="
        relative overflow-hidden rounded-2xl border p-3 sm:p-5 h-full min-h-[120px] sm:min-h-[140px]
        bg-gradient-to-br from-muted to-muted/80 border-border
        transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
      "
    >
      {/* Icon */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-muted-foreground/20 text-muted-foreground">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Status da Frota</p>
        
        <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
          {/* Em movimento */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs sm:text-sm text-foreground">Em movimento</span>
            <span className="ml-auto text-base sm:text-lg font-bold text-foreground">{moving}</span>
          </div>
          
          {/* Parados */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-warning" />
            <span className="text-xs sm:text-sm text-foreground">Parados</span>
            <span className="ml-auto text-base sm:text-lg font-bold text-foreground">{stopped}</span>
          </div>
          
          {/* Offline */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-destructive" />
            <span className="text-xs sm:text-sm text-foreground">Offline</span>
            <span className="ml-auto text-base sm:text-lg font-bold text-foreground">{offline}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
