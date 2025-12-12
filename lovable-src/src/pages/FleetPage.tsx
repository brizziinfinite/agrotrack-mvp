import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FuelConsumptionChart } from '@/components/dashboard/FuelConsumptionChart';
import { mockVehicles as initialVehicles, mockAlerts, Vehicle, VehicleType } from '@/data/mockVehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Plus, Search, MoreVertical, Car, Truck, Bike, Tractor, Edit, Trash2, Eye, Lock, Unlock, 
  AlertTriangle, Navigation, MapPin, Fuel, Bus, Ship, Waves, User, Dog, Wheat, Droplets, CarFront, PersonStanding,
  ChevronLeft, ChevronRight, Check, Play, Pause, WifiOff, Gauge, Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

const vehicleTypeIcons: Record<VehicleType, typeof Car> = {
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

const vehicleTypeLabels: Record<VehicleType, string> = {
  car: 'Carro',
  pickup: 'Caminhonete',
  truck: 'Caminhão',
  motorcycle: 'Moto',
  bus: 'Ônibus',
  tractor: 'Trator',
  sprayer: 'Pulverizador',
  harvester: 'Colheitadora',
  bicycle: 'Bicicleta',
  boat: 'Barco',
  jetski: 'Jet Ski',
  person: 'Pessoa',
  animal: 'Animal',
};

const statusLabels = {
  moving: { label: 'Em movimento', variant: 'default' as const },
  stopped: { label: 'Parado', variant: 'secondary' as const },
  idle: { label: 'Ocioso', variant: 'outline' as const },
  offline: { label: 'Offline', variant: 'destructive' as const },
};

const FleetPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [search, setSearch] = useState('');
  
  // Block/Unblock states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [unblockReason, setUnblockReason] = useState('');
  const [confirmBlock, setConfirmBlock] = useState(false);

  // New Vehicle states
  const [newVehicleDialogOpen, setNewVehicleDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    plate: '',
    type: 'car' as VehicleType,
    driver: '',
    imei: '',
    iccid: '',
    m2mNumber: '',
    model: '',
    color: '',
    maxSpeed: 80,
  });

  const stepLabels = ['Dados do Veículo', 'Dispositivo e Configurações'];

  // Calcula progresso do formulário baseado na etapa atual
  const stepProgress = Math.round((currentStep / totalSteps) * 100);

  const getProgressColor = (progress: number) => {
    if (progress < 40) return '[&>div]:bg-orange-500';
    if (progress < 80) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-green-500';
  };

  // Validação por etapa
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!newVehicle.name.trim()) {
          toast.error('Preencha o nome do veículo');
          return false;
        }
        return true;
      case 2:
        if (!newVehicle.imei.trim()) {
          toast.error('Preencha o IMEI do dispositivo');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const resetForm = () => {
    setCurrentStep(1);
    setNewVehicle({ 
      name: '', plate: '', type: 'car', driver: '', 
      imei: '', iccid: '', m2mNumber: '', model: '', color: '', maxSpeed: 80 
    });
  };

  const handleAddVehicle = () => {
    if (!validateStep(2)) return;

    const vehicle: Vehicle = {
      id: `v${Date.now()}`,
      name: newVehicle.name.trim(),
      plate: newVehicle.plate.trim().toUpperCase(),
      type: newVehicle.type,
      driver: newVehicle.driver.trim() || 'Não atribuído',
      status: 'stopped',
      position: { lat: -23.5505, lng: -46.6333 },
      speed: 0,
      maxSpeed: newVehicle.maxSpeed || 80,
      odometer: 0,
      hourmeter: 0,
      fuel: { percentage: 100, liters: 50, capacity: 50 },
      ignition: false,
      lastUpdate: new Date(),
      todayKm: 0,
      todayHours: 0,
      alerts: 0,
      blocked: false,
      imei: newVehicle.imei.trim(),
      iccid: newVehicle.iccid.trim() || undefined,
      m2mNumber: newVehicle.m2mNumber.trim() || undefined,
      model: newVehicle.model.trim() || undefined,
      color: newVehicle.color.trim() || undefined,
    };

    setVehicles(prev => [...prev, vehicle]);
    toast.success(`Dispositivo "${vehicle.name}" cadastrado com sucesso!`);
    setNewVehicleDialogOpen(false);
    resetForm();
  };

  const handleFollowVehicle = (vehicle: Vehicle) => {
    navigate(`/mapa?vehicle=${vehicle.id}&follow=true`);
    toast.info(`Seguindo veículo "${vehicle.name}"`);
  };

  const handleGeofence = (vehicle: Vehicle) => {
    navigate(`/cercas?vehicle=${vehicle.id}`);
    toast.info(`Gerenciando cercas do veículo "${vehicle.name}"`);
  };

  const handleFuelRegister = (vehicle: Vehicle) => {
    toast.info(`Registrar abastecimento para "${vehicle.name}" - Em desenvolvimento`);
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.driver.toLowerCase().includes(search.toLowerCase())
  );

  const handleBlockClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setBlockReason('');
    setConfirmBlock(false);
    setBlockDialogOpen(true);
  };

  const handleUnblockClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setUnblockReason('');
    setUnblockDialogOpen(true);
  };

  const handleBlockConfirm = () => {
    if (!selectedVehicle || !blockReason.trim() || !confirmBlock) return;

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === selectedVehicle.id
          ? {
              ...v,
              blocked: true,
              blockedAt: new Date(),
              blockedBy: 'Admin',
              blockedReason: blockReason.trim(),
            }
          : v
      )
    );

    toast.success(`Veículo "${selectedVehicle.name}" bloqueado com sucesso`);
    setBlockDialogOpen(false);
    setSelectedVehicle(null);
  };

  const handleUnblockConfirm = () => {
    if (!selectedVehicle) return;

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === selectedVehicle.id
          ? {
              ...v,
              blocked: false,
              blockedAt: undefined,
              blockedBy: undefined,
              blockedReason: undefined,
            }
          : v
      )
    );

    toast.success(`Veículo "${selectedVehicle.name}" desbloqueado com sucesso`);
    setUnblockDialogOpen(false);
    setSelectedVehicle(null);
  };

  const blockedCount = vehicles.filter((v) => v.blocked).length;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Gestão de Frota</h1>
            <p className="text-muted-foreground mt-1">Gerencie todos os veículos da sua frota</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setNewVehicleDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo Veículo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, placa ou motorista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats - Cards de Status Operacional */}
        {(() => {
          const movingCount = vehicles.filter(v => v.status === 'moving').length;
          const stoppedCount = vehicles.filter(v => v.status === 'stopped' || v.status === 'idle').length;
          const offlineCount = vehicles.filter(v => v.status === 'offline').length;
          const totalCount = vehicles.length;
          const speedingCount = vehicles.filter(v => v.speed > v.maxSpeed).length;
          const maintenanceCount = mockAlerts.filter(a => a.type === 'maintenance' && !a.acknowledged).length;

          const statusCards = [
            { 
              key: 'moving', 
              label: 'Em movimento', 
              count: movingCount, 
              Icon: Play, 
              colorClass: 'text-cyan-500', 
              bgClass: 'bg-cyan-500/10', 
              borderClass: 'border-cyan-500/50',
              filter: 'moving'
            },
            { 
              key: 'stopped', 
              label: 'Parados', 
              count: stoppedCount, 
              Icon: Pause, 
              colorClass: 'text-amber-500', 
              bgClass: 'bg-amber-500/10', 
              borderClass: 'border-amber-500/50',
              filter: 'stopped'
            },
            { 
              key: 'offline', 
              label: 'Offline', 
              count: offlineCount, 
              Icon: WifiOff, 
              colorClass: 'text-muted-foreground', 
              bgClass: 'bg-muted', 
              borderClass: 'border-border',
              filter: 'offline'
            },
            { 
              key: 'total', 
              label: 'Total', 
              count: totalCount, 
              Icon: Car, 
              colorClass: 'text-green-500', 
              bgClass: 'bg-green-500/10', 
              borderClass: 'border-green-500/50',
              filter: 'all'
            },
            { 
              key: 'blocked', 
              label: 'Bloqueados', 
              count: blockedCount, 
              Icon: Lock, 
              colorClass: 'text-destructive', 
              bgClass: 'bg-destructive/10', 
              borderClass: 'border-destructive/50',
              filter: 'blocked'
            },
            { 
              key: 'speeding', 
              label: 'Excesso de velocidade', 
              count: speedingCount, 
              Icon: Gauge, 
              colorClass: 'text-orange-500', 
              bgClass: 'bg-orange-500/10', 
              borderClass: 'border-orange-500/50',
              filter: 'speeding'
            },
            { 
              key: 'maintenance', 
              label: 'Manutenção pendente', 
              count: maintenanceCount, 
              Icon: Wrench, 
              colorClass: 'text-yellow-500', 
              bgClass: 'bg-yellow-500/10', 
              borderClass: 'border-yellow-500/50',
              filter: 'maintenance'
            },
          ];

          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4 animate-slide-in-up stagger-2">
              {statusCards.map(({ key, label, count, Icon, colorClass, bgClass, borderClass, filter }) => (
                <div
                  key={key}
                  onClick={() => navigate(`/mapa?filter=${filter}`)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-card border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
                    borderClass
                  )}
                >
                  <div className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center", bgClass)}>
                    <Icon className={cn("w-5 h-5 lg:w-6 lg:h-6", colorClass)} />
                  </div>
                  <p className={cn("text-2xl lg:text-3xl font-bold", colorClass)}>{count}</p>
                  <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Fuel Consumption Chart */}
        <div className="animate-slide-in-up stagger-3">
          <FuelConsumptionChart />
        </div>

        {/* Cards - Horizontal compact list */}
        <TooltipProvider>
          <div className="space-y-2 animate-slide-in-up stagger-3">
            {filteredVehicles.map((vehicle) => {
              const TypeIcon = vehicleTypeIcons[vehicle.type];
              const status = statusLabels[vehicle.status];

              return (
                <div
                  key={vehicle.id}
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 p-3 rounded-xl border bg-card transition-all hover:shadow-md",
                    vehicle.blocked ? "border-destructive/50 bg-destructive/5" : "border-border"
                  )}
                >
                  {/* Vehicle Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    vehicle.blocked ? 'bg-destructive/10' : 'bg-muted'
                  )}>
                    <TypeIcon className={cn(
                      'w-5 h-5',
                      vehicle.blocked ? 'text-destructive' : 'text-muted-foreground'
                    )} />
                  </div>

                  {/* Main Info - flex-1 to fill space */}
                  <div className="flex-1 flex items-center gap-3 sm:gap-4 lg:gap-6 min-w-0 overflow-hidden">
                    {/* Name & Plate */}
                    <div className="min-w-0 w-24 sm:w-32 lg:w-40 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-foreground truncate text-sm">{vehicle.name}</p>
                        {vehicle.blocked && (
                          <Lock className="w-3 h-3 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
                    </div>

                    {/* Driver - hidden on small screens */}
                    <div className="hidden sm:flex items-center gap-2 w-28 lg:w-36 flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {vehicle.driver.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-foreground truncate">{vehicle.driver}</span>
                    </div>

                    {/* Status Badge */}
                    <Badge variant={status.variant} className="flex-shrink-0 text-xs">
                      {status.label}
                    </Badge>

                    {/* Odometer - hidden on mobile */}
                    <div className="hidden md:block text-sm w-24 text-right flex-shrink-0">
                      <span className="font-medium text-foreground">{vehicle.odometer.toLocaleString()} km</span>
                    </div>

                    {/* Fuel Bar - hidden on smaller screens */}
                    <div className="hidden lg:flex items-center gap-2 w-28 flex-shrink-0">
                      <Fuel className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            vehicle.fuel.percentage > 50
                              ? 'bg-accent'
                              : vehicle.fuel.percentage > 25
                              ? 'bg-warning'
                              : 'bg-destructive'
                          )}
                          style={{ width: `${vehicle.fuel.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{vehicle.fuel.percentage}%</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-blue-500/10"
                          onClick={() => handleFollowVehicle(vehicle)}
                        >
                          <Navigation className="w-4 h-4 text-blue-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Seguir</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-purple-500/10"
                          onClick={() => handleGeofence(vehicle)}
                        >
                          <MapPin className="w-4 h-4 text-purple-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cerca</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            vehicle.blocked ? "hover:bg-green-500/10" : "hover:bg-destructive/10"
                          )}
                          onClick={() => vehicle.blocked ? handleUnblockClick(vehicle) : handleBlockClick(vehicle)}
                        >
                          {vehicle.blocked ? (
                            <Unlock className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-destructive" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{vehicle.blocked ? 'Desbloquear' : 'Bloquear'}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-amber-500/10"
                          onClick={() => handleFuelRegister(vehicle)}
                        >
                          <Fuel className="w-4 h-4 text-amber-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Abastecer</TooltipContent>
                    </Tooltip>

                    {/* Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {vehicle.blocked ? (
                          <DropdownMenuItem
                            onClick={() => handleUnblockClick(vehicle)}
                            className="text-accent"
                          >
                            <Unlock className="w-4 h-4 mr-2" />
                            Desbloquear veículo
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleBlockClick(vehicle)}
                            className="text-destructive"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Bloquear veículo
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </div>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Bloquear Veículo
            </DialogTitle>
            <DialogDescription>
              Você está prestes a bloquear o veículo{' '}
              <strong>{selectedVehicle?.name}</strong> ({selectedVehicle?.plate}).
              Esta ação impedirá o funcionamento do veículo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">⚠️ Atenção</p>
              <p className="text-sm text-destructive/80 mt-1">
                O bloqueio do veículo pode afetar operações em andamento. Certifique-se de que
                o veículo está em local seguro antes de prosseguir.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blockReason">Motivo do bloqueio *</Label>
              <Textarea
                id="blockReason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Informe o motivo do bloqueio..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="confirmBlock"
                checked={confirmBlock}
                onCheckedChange={(checked) => setConfirmBlock(checked === true)}
              />
              <label htmlFor="confirmBlock" className="text-sm cursor-pointer">
                Confirmo que desejo bloquear este veículo
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockConfirm}
              disabled={!blockReason.trim() || !confirmBlock}
            >
              <Lock className="w-4 h-4 mr-2" />
              Bloquear Veículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock Dialog */}
      <AlertDialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear Veículo</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Deseja desbloquear o veículo{' '}
                <strong>{selectedVehicle?.name}</strong> ({selectedVehicle?.plate})?
              </p>
              {selectedVehicle?.blockedReason && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm font-medium text-foreground">Motivo do bloqueio:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedVehicle.blockedReason}
                  </p>
                  {selectedVehicle.blockedBy && selectedVehicle.blockedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Bloqueado por {selectedVehicle.blockedBy}{' '}
                      {formatDistanceToNow(selectedVehicle.blockedAt, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblockConfirm} className="bg-accent hover:bg-accent/90">
              <Unlock className="w-4 h-4 mr-2" />
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Vehicle Dialog - Multi-Step */}
      <Dialog open={newVehicleDialogOpen} onOpenChange={(open) => {
        setNewVehicleDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="space-y-4">
            <DialogTitle>Novo Dispositivo/Veículo</DialogTitle>
            
            {/* Indicador de etapas visual */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {stepLabels.map((label, index) => {
                const stepNum = index + 1;
                const isCompleted = stepNum < currentStep;
                const isCurrent = stepNum === currentStep;
                
                return (
                  <div key={stepNum} className="flex items-center">
                    {/* Step circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                          isCompleted && "bg-primary text-primary-foreground",
                          isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                          !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                      </div>
                      <span className={cn(
                        "text-xs mt-2 text-center leading-tight whitespace-nowrap",
                        isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {label}
                      </span>
                    </div>
                    
                    {/* Connector line */}
                    {index < stepLabels.length - 1 && (
                      <div className={cn(
                        "w-16 h-0.5 mx-3 -mt-5",
                        stepNum < currentStep ? "bg-primary" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Etapa {currentStep} de {totalSteps} • {currentStep === 1 ? "* Nome é obrigatório" : "* IMEI é obrigatório"}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
            {/* Etapa 1 - Dados do Veículo */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Nome e Placa */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleName">Nome/Identificação *</Label>
                    <Input
                      id="vehicleName"
                      value={newVehicle.name}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Fiorino #01"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehiclePlate">Placa</Label>
                    <Input
                      id="vehiclePlate"
                      value={newVehicle.plate}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                      placeholder="ABC-1234"
                      maxLength={8}
                    />
                  </div>
                </div>

                {/* Modelo e Cor */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Modelo</Label>
                    <Input
                      id="vehicleModel"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Fiat Fiorino 2022"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleColor">Cor</Label>
                    <Input
                      id="vehicleColor"
                      value={newVehicle.color}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="Branco"
                    />
                  </div>
                </div>

                {/* Tipo de veículo */}
                <div className="space-y-2">
                  <Label>Tipo de Veículo</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {(Object.entries(vehicleTypeLabels) as [VehicleType, string][]).map(([type, label]) => {
                      const Icon = vehicleTypeIcons[type];
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={newVehicle.type === type ? 'default' : 'outline'}
                          className="flex flex-col gap-1 h-auto py-2 px-1"
                          onClick={() => setNewVehicle(prev => ({ ...prev, type }))}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] leading-tight">{label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Etapa 2 - Dispositivo e Configurações */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* IMEI */}
                <div className="space-y-2">
                  <Label htmlFor="vehicleImei">IMEI do Rastreador *</Label>
                  <Input
                    id="vehicleImei"
                    value={newVehicle.imei}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, imei: e.target.value }))}
                    placeholder="867730051234567"
                    maxLength={17}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de identificação único do rastreador (15-17 dígitos)
                  </p>
                </div>

                {/* ICCID e Nº Chip M2M */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleIccid">ICCID</Label>
                    <Input
                      id="vehicleIccid"
                      value={newVehicle.iccid}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, iccid: e.target.value }))}
                      placeholder="89550000123456789012"
                      maxLength={22}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleM2m">Nº Chip M2M</Label>
                    <Input
                      id="vehicleM2m"
                      value={newVehicle.m2mNumber}
                      onChange={(e) => setNewVehicle(prev => ({ ...prev, m2mNumber: e.target.value }))}
                      placeholder="+5511999990000"
                    />
                  </div>
                </div>

                {/* Velocidade Máxima */}
                <div className="space-y-2">
                  <Label htmlFor="vehicleMaxSpeed">Velocidade Máxima (km/h)</Label>
                  <Input
                    id="vehicleMaxSpeed"
                    type="number"
                    value={newVehicle.maxSpeed}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, maxSpeed: parseInt(e.target.value) || 80 }))}
                    placeholder="80"
                    min={0}
                    max={300}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta será gerado quando ultrapassar esta velocidade
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t flex-row justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevStep}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setNewVehicleDialogOpen(false)}>
                Cancelar
              </Button>
              {currentStep < totalSteps ? (
                <Button onClick={handleNextStep}>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleAddVehicle}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default FleetPage;
