import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GeofenceMap } from '@/components/geofence/GeofenceMap';
import { GeofenceDialog } from '@/components/geofence/GeofenceDialog';
import { Geofence, mockGeofences } from '@/data/mockGeofences';
import { mockVehicles } from '@/data/mockVehicles';
import { useGeofenceAlerts } from '@/hooks/useGeofenceAlerts';
import { GeofenceAlertToast } from '@/components/geofence/GeofenceAlertToast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  MapPin,
  Edit,
  Trash2,
  Bell,
  BellOff,
  Circle,
  Hexagon,
  Car,
  Move,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { ScrollArea } from '@/components/ui/scroll-area';

const GeofencesPage = () => {
  const [geofences, setGeofences] = useState<Geofence[]>(mockGeofences);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGeofenceDialog, setEditingGeofenceDialog] = useState<Geofence | null>(null);
  const [editingGeofenceOnMap, setEditingGeofenceOnMap] = useState<Geofence | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [geofenceToDelete, setGeofenceToDelete] = useState<Geofence | null>(null);
  const [clickedPosition, setClickedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [drawnCoordinates, setDrawnCoordinates] = useState<Geofence['coordinates'] | null>(null);
  const [drawnType, setDrawnType] = useState<'circle' | 'polygon'>('circle');
  const [showAlerts, setShowAlerts] = useState(false);

  // Real-time geofence alerts
  const { alerts, activeAlerts, acknowledgeAlert } = useGeofenceAlerts(
    mockVehicles,
    geofences,
    true
  );

  const handleCreateGeofence = () => {
    setEditingGeofenceDialog(null);
    setDialogOpen(true);
  };

  const handleEditGeofence = (geofence: Geofence) => {
    setEditingGeofenceDialog(geofence);
    setDialogOpen(true);
  };

  const handleEditOnMap = (geofence: Geofence) => {
    if (editingGeofenceOnMap?.id === geofence.id) {
      setEditingGeofenceOnMap(null);
      toast.info('Modo de edição desativado');
    } else {
      setEditingGeofenceOnMap(geofence);
      setSelectedGeofence(geofence);
      toast.info(`Editando "${geofence.name}" - Arraste os pontos para ajustar`, {
        duration: 4000,
      });
    }
  };

  const handleGeofenceUpdate = (geofenceId: string, coordinates: Geofence['coordinates']) => {
    setGeofences((prev) =>
      prev.map((g) =>
        g.id === geofenceId ? { ...g, coordinates } : g
      )
    );
    
    // Update editingGeofenceOnMap reference
    setEditingGeofenceOnMap((prev) => 
      prev?.id === geofenceId ? { ...prev, coordinates } : prev
    );
    
    toast.success('Cerca atualizada!');
  };

  const handleDeleteClick = (geofence: Geofence) => {
    setGeofenceToDelete(geofence);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (geofenceToDelete) {
      setGeofences((prev) => prev.filter((g) => g.id !== geofenceToDelete.id));
      toast.success(`Cerca "${geofenceToDelete.name}" excluída com sucesso`);
      setDeleteDialogOpen(false);
      setGeofenceToDelete(null);
      if (selectedGeofence?.id === geofenceToDelete.id) {
        setSelectedGeofence(null);
      }
    }
  };

  const handleSaveGeofence = (data: Omit<Geofence, 'id' | 'createdAt'>) => {
    if (editingGeofenceDialog) {
      setGeofences((prev) =>
        prev.map((g) =>
          g.id === editingGeofenceDialog.id
            ? { ...g, ...data }
            : g
        )
      );
      toast.success(`Cerca "${data.name}" atualizada com sucesso`);
    } else {
      const newGeofence: Geofence = {
        ...data,
        id: `g${Date.now()}`,
        createdAt: new Date(),
        coordinates: clickedPosition
          ? { center: clickedPosition, radius: data.coordinates.radius || 500 }
          : data.coordinates,
      };
      setGeofences((prev) => [...prev, newGeofence]);
      toast.success(`Cerca "${data.name}" criada com sucesso`);
      setClickedPosition(null);
    }
  };

  const handleToggleActive = (geofence: Geofence) => {
    setGeofences((prev) =>
      prev.map((g) =>
        g.id === geofence.id ? { ...g, active: !g.active } : g
      )
    );
    toast.success(
      geofence.active
        ? `Cerca "${geofence.name}" desativada`
        : `Cerca "${geofence.name}" ativada`
    );
  };

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    // Only used as fallback when not in drawing mode
    setClickedPosition(latlng);
    setDrawnCoordinates({ center: latlng, radius: 500 });
    setDrawnType('circle');
    setEditingGeofenceDialog(null);
    setDialogOpen(true);
  };

  const handleDrawingComplete = (type: 'circle' | 'polygon', coordinates: Geofence['coordinates']) => {
    setDrawnType(type);
    setDrawnCoordinates(coordinates);
    setEditingGeofenceDialog(null);
    setDialogOpen(true);
    
    toast.success(
      type === 'circle' 
        ? 'Círculo desenhado! Configure os detalhes da cerca.' 
        : 'Polígono desenhado! Configure os detalhes da cerca.',
      { duration: 3000 }
    );
  };

  const getVehiclesInGeofence = (geofence: Geofence) => {
    return mockVehicles.filter((v) => geofence.assignedVehicles.includes(v.id));
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4">
        {/* Left Panel - Geofences List */}
        <div className="w-full lg:w-96 flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cercas Virtuais</h1>
              <p className="text-sm text-muted-foreground">
                Clique no mapa para criar uma nova cerca
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showAlerts ? "default" : "outline"}
                size="sm"
                className="gap-2 relative"
                onClick={() => setShowAlerts(!showAlerts)}
              >
                <AlertTriangle className="w-4 h-4" />
                Alertas
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {activeAlerts.length}
                  </span>
                )}
              </Button>
              <Button onClick={handleCreateGeofence} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Nova
              </Button>
            </div>
          </div>

          {/* Alerts Panel */}
          {showAlerts && activeAlerts.length > 0 && (
            <div className="p-3 rounded-xl border border-warning/30 bg-warning/5 space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Alertas em Tempo Real
              </h4>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {activeAlerts.slice(0, 3).map((alert) => (
                    <GeofenceAlertToast
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={() => acknowledgeAlert(alert.id)}
                      onViewOnMap={() => {
                        const geofence = geofences.find((g) => g.id === alert.geofenceId);
                        if (geofence) {
                          setSelectedGeofence(geofence);
                          setShowAlerts(false);
                        }
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {geofences.map((geofence) => {
              const vehiclesInside = getVehiclesInGeofence(geofence);
              const isSelected = selectedGeofence?.id === geofence.id;

              return (
                <div
                  key={geofence.id}
                  className={cn(
                    'p-4 rounded-xl border bg-card cursor-pointer transition-all duration-200 hover:shadow-md',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border'
                  )}
                  onClick={() => setSelectedGeofence(geofence)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${geofence.color}20` }}
                      >
                        {geofence.type === 'circle' ? (
                          <Circle className="w-5 h-5" style={{ color: geofence.color }} />
                        ) : (
                          <Hexagon className="w-5 h-5" style={{ color: geofence.color }} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{geofence.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {geofence.type === 'circle'
                            ? `Raio: ${geofence.coordinates.radius}m`
                            : `${geofence.coordinates.points?.length || 0} pontos`}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={geofence.active}
                      onCheckedChange={() => handleToggleActive(geofence)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {geofence.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {geofence.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    {geofence.alertOnEnter && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Bell className="w-3 h-3" />
                        Entrada
                      </Badge>
                    )}
                    {geofence.alertOnExit && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <BellOff className="w-3 h-3" />
                        Saída
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {vehiclesInside.length} veículo(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={editingGeofenceOnMap?.id === geofence.id ? "default" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOnMap(geofence);
                        }}
                        title="Editar no mapa"
                      >
                        <Move className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditGeofence(geofence);
                        }}
                        title="Editar detalhes"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(geofence);
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {geofences.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-foreground mb-1">
                  Nenhuma cerca virtual
                </h3>
                <p className="text-sm text-muted-foreground">
                  Clique no mapa ou no botão "Nova" para criar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-border animate-slide-in-up">
          <GeofenceMap
            geofences={geofences}
            selectedGeofence={selectedGeofence}
            editingGeofence={editingGeofenceOnMap}
            onMapClick={handleMapClick}
            onGeofenceClick={setSelectedGeofence}
            onDrawingComplete={handleDrawingComplete}
            onGeofenceUpdate={handleGeofenceUpdate}
          />
        </div>
      </div>

      <GeofenceDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setClickedPosition(null);
          setDrawnCoordinates(null);
        }}
        onSave={handleSaveGeofence}
        geofence={editingGeofenceDialog}
        defaultCoordinates={drawnCoordinates || undefined}
        defaultType={drawnType}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cerca Virtual</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a cerca "{geofenceToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default GeofencesPage;
