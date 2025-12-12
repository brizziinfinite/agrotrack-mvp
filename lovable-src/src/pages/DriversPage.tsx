import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, MoreVertical, Edit, Trash2, Phone, Mail, User, CalendarIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  license: string;
  hireDate: Date;
  status: 'active' | 'inactive' | 'vacation';
  vehicleAssigned: string | null;
  totalTrips: number;
  totalKm: number;
}

const initialDrivers: Driver[] = [
  { id: 'd1', name: 'Carlos Silva', email: 'carlos@email.com', phone: '(11) 99999-1234', license: 'AB', hireDate: new Date('2022-03-15'), status: 'active', vehicleAssigned: 'Fiorino #01', totalTrips: 245, totalKm: 12450 },
  { id: 'd2', name: 'João Oliveira', email: 'joao@email.com', phone: '(11) 99999-5678', license: 'CE', hireDate: new Date('2021-07-20'), status: 'active', vehicleAssigned: 'Truck #02', totalTrips: 189, totalKm: 45670 },
  { id: 'd3', name: 'Pedro Santos', email: 'pedro@email.com', phone: '(11) 99999-9012', license: 'A', hireDate: new Date('2023-01-10'), status: 'active', vehicleAssigned: 'Moto #03', totalTrips: 320, totalKm: 8900 },
  { id: 'd4', name: 'Marcos Lima', email: 'marcos@email.com', phone: '(11) 99999-3456', license: 'D', hireDate: new Date('2020-11-05'), status: 'inactive', vehicleAssigned: null, totalTrips: 156, totalKm: 23400 },
  { id: 'd5', name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 99999-7890', license: 'B', hireDate: new Date('2023-06-01'), status: 'active', vehicleAssigned: 'Van #05', totalTrips: 210, totalKm: 15600 },
  { id: 'd6', name: 'Fernanda Reis', email: 'fernanda@email.com', phone: '(11) 99999-2345', license: 'B', hireDate: new Date('2022-09-12'), status: 'vacation', vehicleAssigned: null, totalTrips: 178, totalKm: 9800 },
];

// Calcula a próxima data de férias (aniversário de contratação)
const getNextVacationDate = (hireDate: Date): Date => {
  const today = new Date();
  const nextVacation = new Date(hireDate);
  nextVacation.setFullYear(today.getFullYear());
  
  if (nextVacation < today) {
    nextVacation.setFullYear(today.getFullYear() + 1);
  }
  
  return nextVacation;
};

const statusLabels = {
  active: { label: 'Ativo', variant: 'default' as const },
  inactive: { label: 'Inativo', variant: 'secondary' as const },
  vacation: { label: 'Férias', variant: 'outline' as const },
};

const licenseCategories = ['A', 'B', 'AB', 'C', 'D', 'E', 'CE', 'DE'];

const DriversPage = () => {
  const [search, setSearch] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [newDriverDialogOpen, setNewDriverDialogOpen] = useState(false);
  const [newDriver, setNewDriver] = useState<{
    name: string;
    email: string;
    phone: string;
    license: string;
    hireDate: Date | undefined;
  }>({
    name: '',
    email: '',
    phone: '',
    license: 'B',
    hireDate: undefined,
  });

  const handleAddDriver = () => {
    if (!newDriver.name.trim() || !newDriver.email.trim()) {
      toast.error('Preencha o nome e email do motorista');
      return;
    }

    if (!newDriver.hireDate) {
      toast.error('Preencha a data de contratação');
      return;
    }

    const driver: Driver = {
      id: `d${Date.now()}`,
      name: newDriver.name.trim(),
      email: newDriver.email.trim(),
      phone: newDriver.phone.trim(),
      license: newDriver.license,
      hireDate: newDriver.hireDate,
      status: 'active',
      vehicleAssigned: null,
      totalTrips: 0,
      totalKm: 0,
    };

    setDrivers(prev => [...prev, driver]);
    toast.success(`Motorista "${driver.name}" cadastrado com sucesso!`);
    setNewDriverDialogOpen(false);
    setNewDriver({ name: '', email: '', phone: '', license: 'B', hireDate: undefined });
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = drivers.filter((d) => d.status === 'active').length;
  const inactiveCount = drivers.filter((d) => d.status === 'inactive').length;
  const vacationCount = drivers.filter((d) => d.status === 'vacation').length;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Motoristas</h1>
            <p className="text-muted-foreground mt-1">Gerencie os motoristas da sua frota</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setNewDriverDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Novo Motorista
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 animate-slide-in-up">
          <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-accent/5 border border-accent/20">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-accent/10 flex items-center justify-center">
              <User className="w-4 h-4 lg:w-5 lg:h-5 text-accent" />
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">Ativos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-muted border border-border">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-muted flex items-center justify-center">
              <User className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{inactiveCount}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">Inativos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-primary/5 border border-primary/20">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{vacationCount}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">Férias</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative animate-slide-in-up stagger-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>

        {/* Mobile: Cards */}
        <div className="space-y-3 lg:hidden animate-slide-in-up stagger-3">
          {filteredDrivers.map((driver) => {
            const status = statusLabels[driver.status];
            return (
              <div key={driver.id} className="p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                      {driver.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{driver.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{driver.email}</p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="truncate">{driver.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CNH: </span>
                    <Badge variant="outline" className="text-xs">{driver.license}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contratação: </span>
                    <span className="text-foreground">{format(driver.hireDate, 'dd/MM/yyyy')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Próx. Férias: </span>
                    <span className="font-medium text-primary">{format(getNextVacationDate(driver.hireDate), 'dd/MM')}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Table */}
        <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden animate-slide-in-up stagger-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motorista</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CNH</TableHead>
                <TableHead>Contratação</TableHead>
                <TableHead>Próx. Férias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead className="text-right">Viagens</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => {
                const status = statusLabels[driver.status];
                return (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {driver.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{driver.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          {driver.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          {driver.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{driver.license}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{format(driver.hireDate, 'dd/MM/yyyy')}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-primary">
                        {format(getNextVacationDate(driver.hireDate), 'dd/MM/yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {driver.vehicleAssigned ? (
                        <span className="text-foreground">{driver.vehicleAssigned}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {driver.totalTrips}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* New Driver Dialog */}
      <Dialog open={newDriverDialogOpen} onOpenChange={setNewDriverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Motorista</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo motorista para cadastrá-lo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driverName">Nome completo *</Label>
              <Input
                id="driverName"
                value={newDriver.name}
                onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverEmail">E-mail *</Label>
              <Input
                id="driverEmail"
                type="email"
                value={newDriver.email}
                onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Ex: joao@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverPhone">Telefone</Label>
              <Input
                id="driverPhone"
                value={newDriver.phone}
                onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Ex: (11) 99999-1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverLicense">Categoria CNH</Label>
              <Select
                value={newDriver.license}
                onValueChange={(value) => setNewDriver(prev => ({ ...prev, license: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {licenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      Categoria {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Contratação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newDriver.hireDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDriver.hireDate ? (
                      format(newDriver.hireDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDriver.hireDate}
                    onSelect={(date) => setNewDriver(prev => ({ ...prev, hireDate: date }))}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                A data de férias será calculada anualmente a partir desta data.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDriverDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddDriver}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Motorista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DriversPage;
