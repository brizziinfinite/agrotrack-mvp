import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { mockVehicles } from '@/data/mockVehicles';
import { Geofence } from '@/data/mockGeofences';

interface GeofenceDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (geofence: Omit<Geofence, 'id' | 'createdAt'>) => void;
  geofence?: Geofence | null;
  defaultCoordinates?: Geofence['coordinates'];
  defaultType?: 'circle' | 'polygon';
}

const colorOptions = [
  { value: '#0d9488', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
];

export const GeofenceDialog = ({
  open,
  onClose,
  onSave,
  geofence,
  defaultCoordinates,
  defaultType = 'circle',
}: GeofenceDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'circle' | 'polygon'>('circle');
  const [radius, setRadius] = useState(500);
  const [color, setColor] = useState('#0d9488');
  const [alertOnEnter, setAlertOnEnter] = useState(true);
  const [alertOnExit, setAlertOnExit] = useState(true);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [coordinates, setCoordinates] = useState<Geofence['coordinates'] | null>(null);

  useEffect(() => {
    if (geofence) {
      setName(geofence.name);
      setDescription(geofence.description || '');
      setType(geofence.type);
      setRadius(geofence.coordinates.radius || 500);
      setColor(geofence.color);
      setAlertOnEnter(geofence.alertOnEnter);
      setAlertOnExit(geofence.alertOnExit);
      setSelectedVehicles(geofence.assignedVehicles);
      setActive(geofence.active);
      setCoordinates(geofence.coordinates);
    } else {
      setName('');
      setDescription('');
      setType(defaultType);
      setRadius(defaultCoordinates?.radius || 500);
      setColor('#0d9488');
      setAlertOnEnter(true);
      setAlertOnExit(true);
      setSelectedVehicles([]);
      setActive(true);
      setCoordinates(defaultCoordinates || null);
    }
  }, [geofence, open, defaultCoordinates, defaultType]);

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const defaultCenter = { lat: -23.5505, lng: -46.6333 };
    const finalCoordinates: Geofence['coordinates'] =
      type === 'circle'
        ? { 
            center: coordinates?.center || geofence?.coordinates.center || defaultCenter, 
            radius: radius 
          }
        : { 
            points: coordinates?.points || geofence?.coordinates.points || [defaultCenter] 
          };

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      coordinates: finalCoordinates,
      color,
      active,
      alertOnEnter,
      alertOnExit,
      assignedVehicles: selectedVehicles,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {geofence ? 'Editar Cerca Virtual' : 'Nova Cerca Virtual'}
          </DialogTitle>
          <DialogDescription>
            {geofence
              ? 'Edite as configurações da cerca virtual'
              : 'Configure uma nova cerca virtual para monitorar veículos'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Base Central"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional..."
              rows={2}
            />
          </div>

          {/* Show coordinates info */}
          {coordinates && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium text-foreground mb-1">
                {type === 'circle' ? 'Círculo definido' : 'Polígono definido'}
              </p>
              {type === 'circle' && coordinates.center && (
                <p className="text-muted-foreground text-xs">
                  Centro: {coordinates.center.lat.toFixed(5)}, {coordinates.center.lng.toFixed(5)}
                </p>
              )}
              {type === 'polygon' && coordinates.points && (
                <p className="text-muted-foreground text-xs">
                  {coordinates.points.length} pontos definidos
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={type} 
                onValueChange={(v) => setType(v as 'circle' | 'polygon')}
                disabled={!!coordinates}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Círculo</SelectItem>
                  <SelectItem value="polygon">Polígono</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: opt.value }}
                        />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === 'circle' && (
            <div className="space-y-2">
              <Label htmlFor="radius">Raio (metros)</Label>
              <Input
                id="radius"
                type="number"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                min={50}
                max={10000}
              />
            </div>
          )}

          <div className="space-y-3">
            <Label>Alertas</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Alerta ao entrar</span>
              <Switch checked={alertOnEnter} onCheckedChange={setAlertOnEnter} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Alerta ao sair</span>
              <Switch checked={alertOnExit} onCheckedChange={setAlertOnExit} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Cerca Ativa</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="space-y-2">
            <Label>Veículos Monitorados</Label>
            <div className="max-h-36 overflow-y-auto space-y-2 border border-border rounded-lg p-3">
              {mockVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`vehicle-${vehicle.id}`}
                    checked={selectedVehicles.includes(vehicle.id)}
                    onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                  />
                  <label
                    htmlFor={`vehicle-${vehicle.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {vehicle.name} ({vehicle.plate})
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {geofence ? 'Salvar' : 'Criar Cerca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
