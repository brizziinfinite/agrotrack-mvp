import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockVehicles } from '@/data/mockVehicles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, AlertTriangle, CheckCircle, Clock, Calendar, Droplet, Gauge, Fuel, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MaintenanceItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: 'oil' | 'tires' | 'brakes' | 'general' | 'filter';
  description: string;
  dueKm: number;
  currentKm: number;
  dueDate: Date;
  status: 'ok' | 'warning' | 'overdue';
}

interface FuelRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  date: Date;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer?: number;
  hourMeter?: number;
  fuelType: 'gasoline' | 'ethanol' | 'diesel' | 'gnv';
  station: string;
}

const mockFuelRecords: FuelRecord[] = [
  { id: 'f1', vehicleId: 'v1', vehicleName: 'Fiorino #01', date: new Date('2024-01-20'), liters: 45, pricePerLiter: 5.89, totalCost: 265.05, odometer: 125430, fuelType: 'gasoline', station: 'Posto Shell Centro' },
  { id: 'f2', vehicleId: 'v2', vehicleName: 'Truck #02', date: new Date('2024-01-19'), liters: 280, pricePerLiter: 6.15, totalCost: 1722.00, odometer: 354210, fuelType: 'diesel', station: 'Posto Ipiranga BR-101' },
  { id: 'f3', vehicleId: 'v3', vehicleName: 'Moto #03', date: new Date('2024-01-18'), liters: 12, pricePerLiter: 5.79, totalCost: 69.48, odometer: 45890, fuelType: 'gasoline', station: 'Posto Ale Jardins' },
  { id: 'f4', vehicleId: 'v6', vehicleName: 'Truck #06', date: new Date('2024-01-17'), liters: 320, pricePerLiter: 6.20, totalCost: 1984.00, odometer: 567890, fuelType: 'diesel', station: 'Posto BR Rodovia' },
  { id: 'f5', vehicleId: 'v4', vehicleName: 'Tractor #04', date: new Date('2024-01-16'), liters: 150, pricePerLiter: 6.10, totalCost: 915.00, hourMeter: 8450, fuelType: 'diesel', station: 'Tanque Interno' },
];

const fuelTypeLabels = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  diesel: 'Diesel',
  gnv: 'GNV',
};

const mockMaintenance: MaintenanceItem[] = [
  { id: 'm1', vehicleId: 'v1', vehicleName: 'Fiorino #01', type: 'oil', description: 'Troca de óleo', dueKm: 130000, currentKm: 125430, dueDate: new Date('2024-02-15'), status: 'ok' },
  { id: 'm2', vehicleId: 'v2', vehicleName: 'Truck #02', type: 'tires', description: 'Rodízio de pneus', dueKm: 360000, currentKm: 354210, dueDate: new Date('2024-01-25'), status: 'warning' },
  { id: 'm3', vehicleId: 'v3', vehicleName: 'Moto #03', type: 'brakes', description: 'Revisão de freios', dueKm: 50000, currentKm: 45890, dueDate: new Date('2024-03-01'), status: 'ok' },
  { id: 'm4', vehicleId: 'v6', vehicleName: 'Truck #06', type: 'general', description: 'Revisão completa', dueKm: 560000, currentKm: 567890, dueDate: new Date('2024-01-10'), status: 'overdue' },
  { id: 'm5', vehicleId: 'v4', vehicleName: 'Tractor #04', type: 'filter', description: 'Troca de filtros', dueKm: 9000, currentKm: 8450, dueDate: new Date('2024-02-01'), status: 'ok' },
];

const typeIcons = {
  oil: Droplet,
  tires: Gauge,
  brakes: AlertTriangle,
  general: Wrench,
  filter: Wrench,
};

const typeLabels = {
  oil: 'Óleo',
  tires: 'Pneus',
  brakes: 'Freios',
  general: 'Geral',
  filter: 'Filtros',
};

const statusConfig = {
  ok: { icon: CheckCircle, color: 'text-accent', bg: 'bg-accent/10', label: 'Em dia' },
  warning: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Próximo' },
  overdue: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Vencido' },
};

const MaintenancePage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFuelDialogOpen, setIsFuelDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: '',
    description: '',
    dueKm: '',
    dueDate: '',
  });
  const [fuelFormData, setFuelFormData] = useState({
    vehicleId: '',
    date: '',
    liters: '',
    pricePerLiter: '',
    odometer: '',
    hourMeter: '',
    fuelType: '',
    station: '',
  });

  const overdueCount = mockMaintenance.filter((m) => m.status === 'overdue').length;
  const warningCount = mockMaintenance.filter((m) => m.status === 'warning').length;
  const okCount = mockMaintenance.filter((m) => m.status === 'ok').length;

  const totalFuelCost = mockFuelRecords.reduce((acc, r) => acc + r.totalCost, 0);
  const totalLiters = mockFuelRecords.reduce((acc, r) => acc + r.liters, 0);

  const handleSubmit = () => {
    if (!formData.vehicleId || !formData.type || !formData.description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    toast.success('Serviço de manutenção cadastrado com sucesso!');
    setIsDialogOpen(false);
    setFormData({ vehicleId: '', type: '', description: '', dueKm: '', dueDate: '' });
  };

  const handleFuelSubmit = () => {
    if (!fuelFormData.vehicleId || !fuelFormData.liters || !fuelFormData.pricePerLiter || !fuelFormData.fuelType) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!fuelFormData.odometer && !fuelFormData.hourMeter) {
      toast.error('Informe o odômetro (km) ou horímetro (h)');
      return;
    }
    
    toast.success('Abastecimento registrado com sucesso!');
    setIsFuelDialogOpen(false);
    setFuelFormData({ vehicleId: '', date: '', liters: '', pricePerLiter: '', odometer: '', hourMeter: '', fuelType: '', station: '' });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Manutenção & Abastecimento</h1>
            <p className="text-muted-foreground mt-1">Controle de manutenção e combustível da frota</p>
          </div>
        </div>

        <Tabs defaultValue="maintenance" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="maintenance" className="gap-2">
              <Wrench className="w-4 h-4" />
              Manutenção
            </TabsTrigger>
            <TabsTrigger value="fuel" className="gap-2">
              <Fuel className="w-4 h-4" />
              Abastecimento
            </TabsTrigger>
          </TabsList>

          {/* Manutenção Tab */}
          <TabsContent value="maintenance" className="space-y-6 mt-6">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Serviço
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Novo Serviço de Manutenção</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle">Veículo *</Label>
                      <Select
                        value={formData.vehicleId}
                        onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.name} - {vehicle.plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Serviço *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oil">Óleo</SelectItem>
                          <SelectItem value="tires">Pneus</SelectItem>
                          <SelectItem value="brakes">Freios</SelectItem>
                          <SelectItem value="filter">Filtros</SelectItem>
                          <SelectItem value="general">Revisão Geral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição *</Label>
                      <Input
                        id="description"
                        placeholder="Ex: Troca de óleo e filtro"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dueKm">Km Prevista</Label>
                        <Input
                          id="dueKm"
                          type="number"
                          placeholder="Ex: 150000"
                          value={formData.dueKm}
                          onChange={(e) => setFormData({ ...formData, dueKm: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Data Prevista</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmit}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 animate-slide-in-up">
              <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-destructive/5 border border-destructive/20">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{overdueCount}</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Vencidos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-warning/5 border border-warning/20">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{warningCount}</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Próximos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-accent/5 border border-accent/20">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{okCount}</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Em dia</p>
                </div>
              </div>
            </div>

            {/* Maintenance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-in-up stagger-2">
              {mockMaintenance.map((item) => {
                const TypeIcon = typeIcons[item.type];
                const status = statusConfig[item.status];
                const StatusIcon = status.icon;
                const progress = Math.min(100, (item.currentKm / item.dueKm) * 100);
                const kmRemaining = item.dueKm - item.currentKm;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg',
                      item.status === 'overdue' && 'border-destructive/30',
                      item.status === 'warning' && 'border-warning/30'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', status.bg)}>
                          <TypeIcon className={cn('w-6 h-6', status.color)} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{item.description}</h3>
                          <p className="text-sm text-muted-foreground">{item.vehicleName}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'gap-1',
                          item.status === 'overdue' && 'border-destructive text-destructive',
                          item.status === 'warning' && 'border-warning text-warning',
                          item.status === 'ok' && 'border-accent text-accent'
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-muted-foreground">Quilometragem</span>
                          <span className="font-medium text-foreground">
                            {item.currentKm.toLocaleString()} / {item.dueKm.toLocaleString()} km
                          </span>
                        </div>
                        <Progress
                          value={progress}
                          className={cn(
                            'h-2',
                            item.status === 'overdue' && '[&>div]:bg-destructive',
                            item.status === 'warning' && '[&>div]:bg-warning'
                          )}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {kmRemaining > 0 ? `${kmRemaining.toLocaleString()} km restantes` : `${Math.abs(kmRemaining).toLocaleString()} km excedidos`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Previsão: {item.dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Abastecimento Tab */}
          <TabsContent value="fuel" className="space-y-6 mt-6">
            <div className="flex justify-end">
              <Dialog open={isFuelDialogOpen} onOpenChange={setIsFuelDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Abastecimento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Registrar Abastecimento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Veículo *</Label>
                      <Select
                        value={fuelFormData.vehicleId}
                        onValueChange={(value) => setFuelFormData({ ...fuelFormData, vehicleId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.name} - {vehicle.plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={fuelFormData.date}
                          onChange={(e) => setFuelFormData({ ...fuelFormData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Combustível *</Label>
                        <Select
                          value={fuelFormData.fuelType}
                          onValueChange={(value) => setFuelFormData({ ...fuelFormData, fuelType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gasoline">Gasolina</SelectItem>
                            <SelectItem value="ethanol">Etanol</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="gnv">GNV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Litros *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 45.5"
                          value={fuelFormData.liters}
                          onChange={(e) => setFuelFormData({ ...fuelFormData, liters: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço/Litro *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 5.89"
                          value={fuelFormData.pricePerLiter}
                          onChange={(e) => setFuelFormData({ ...fuelFormData, pricePerLiter: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Odômetro (km)</Label>
                        <Input
                          type="number"
                          placeholder="Ex: 125430"
                          value={fuelFormData.odometer}
                          onChange={(e) => setFuelFormData({ ...fuelFormData, odometer: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Horímetro (h)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 1250.5"
                          value={fuelFormData.hourMeter}
                          onChange={(e) => setFuelFormData({ ...fuelFormData, hourMeter: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Posto</Label>
                      <Input
                        placeholder="Ex: Posto Shell Centro"
                        value={fuelFormData.station}
                        onChange={(e) => setFuelFormData({ ...fuelFormData, station: e.target.value })}
                      />
                    </div>

                    {fuelFormData.liters && fuelFormData.pricePerLiter && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground">Total estimado:</p>
                        <p className="text-xl font-bold text-primary">
                          R$ {(parseFloat(fuelFormData.liters) * parseFloat(fuelFormData.pricePerLiter)).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsFuelDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleFuelSubmit}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Fuel Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in-up">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{mockFuelRecords.length}</p>
                  <p className="text-sm text-muted-foreground">Registros</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent/5 border border-accent/20">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalLiters.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Litros</p>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-3 p-4 rounded-2xl bg-warning/5 border border-warning/20">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">R$ {totalFuelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-muted-foreground">Custo Total</p>
                </div>
              </div>
            </div>

            {/* Fuel Records */}
            <div className="space-y-3 animate-slide-in-up stagger-2">
              {mockFuelRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border bg-card p-4 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Fuel className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{record.vehicleName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {record.date.toLocaleDateString('pt-BR')} • {record.station}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">R$ {record.totalCost.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.liters}L × R$ {record.pricePerLiter.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                    <Badge variant="outline">{fuelTypeLabels[record.fuelType]}</Badge>
                    {record.odometer && (
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {record.odometer.toLocaleString()} km
                      </span>
                    )}
                    {record.hourMeter && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.hourMeter.toLocaleString()} h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MaintenancePage;
