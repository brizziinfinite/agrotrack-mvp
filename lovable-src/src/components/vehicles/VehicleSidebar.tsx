import { useState } from 'react';
import { Vehicle, mockVehicles } from '@/data/mockVehicles';
import { VehicleCard } from '@/components/dashboard/VehicleCard';
import { cn } from '@/lib/utils';
import { Search, Filter, ChevronDown, X, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VehicleSidebarProps {
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedVehicle?: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onReplayRequest?: (vehicle: Vehicle) => void;
}

type TimeFilter = 'today' | 'yesterday' | 'last24h' | 'week';

const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last24h', label: 'Últimas 24h' },
  { value: 'week', label: 'Esta semana' },
];

export const VehicleSidebar = ({ 
  onVehicleSelect, 
  selectedVehicle, 
  isOpen, 
  onClose,
  onReplayRequest 
}: VehicleSidebarProps) => {
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

  const filteredVehicles = mockVehicles.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.driver.toLowerCase().includes(search.toLowerCase())
  );

  const movingCount = filteredVehicles.filter((v) => v.status === 'moving').length;
  const stoppedCount = filteredVehicles.filter((v) => v.status === 'stopped' || v.status === 'idle').length;
  const offlineCount = filteredVehicles.filter((v) => v.status === 'offline').length;

  return (
    <div
      className={cn(
        'fixed lg:relative inset-y-0 right-0 w-80 lg:w-96 bg-card border-l border-border z-50 flex flex-col transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Veículos</h2>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-transparent focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                {timeFilters.find((f) => f.value === timeFilter)?.label}
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {timeFilters.map((filter) => (
                <DropdownMenuItem key={filter.value} onClick={() => setTimeFilter(filter.value)}>
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Summary */}
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-moving" />
            <span className="text-muted-foreground">{movingCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-stopped" />
            <span className="text-muted-foreground">{stoppedCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-offline" />
            <span className="text-muted-foreground">{offlineCount}</span>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum veículo encontrado</p>
          </div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              compact
              onClick={() => onVehicleSelect(vehicle)}
              onHistoryClick={onReplayRequest ? () => onReplayRequest(vehicle) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
};
