import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { VehicleMap } from '@/components/map/VehicleMap';
import { VehicleSidebar } from '@/components/vehicles/VehicleSidebar';
import { RouteReplayControls } from '@/components/map/RouteReplayControls';
import { RouteReplayPanel } from '@/components/map/RouteReplayPanel';
import { Vehicle } from '@/data/mockVehicles';
import { RouteHistory } from '@/data/mockRouteHistory';
import { useRouteReplay } from '@/hooks/useRouteReplay';
import { Button } from '@/components/ui/button';
import { PanelRightOpen } from 'lucide-react';

const MapPage = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [replayPanelVehicle, setReplayPanelVehicle] = useState<Vehicle | null>(null);
  
  const replay = useRouteReplay();

  const handleReplayRequest = (vehicle: Vehicle) => {
    setReplayPanelVehicle(vehicle);
  };

  const handleSelectRoute = (route: RouteHistory) => {
    replay.setRoute(route);
    setReplayPanelVehicle(null);
    replay.play();
  };

  const handleCloseReplay = () => {
    replay.stop();
    replay.setRoute(null);
  };

  const replayMode = replay.route ? {
    active: true,
    route: replay.route,
    currentPosition: replay.interpolatedPosition,
    trailPoints: replay.trailPoints,
    currentIndex: replay.currentIndex,
  } : undefined;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Map Container */}
        <div className="flex-1 relative">
          <VehicleMap
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
            replayMode={replayMode}
          />

          {/* Toggle Sidebar Button */}
          {!replay.route && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 lg:hidden bg-card/90 backdrop-blur-sm shadow-lg hover:bg-card z-[1000]"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          )}

          {/* Replay Controls */}
          {replay.route && (
            <RouteReplayControls
              replay={replay}
              onClose={handleCloseReplay}
              vehicleName={replayPanelVehicle?.name || selectedVehicle?.name}
            />
          )}

          {/* Route Replay Panel */}
          {replayPanelVehicle && !replay.route && (
            <RouteReplayPanel
              vehicle={replayPanelVehicle}
              onClose={() => setReplayPanelVehicle(null)}
              onSelectRoute={handleSelectRoute}
            />
          )}

          {/* Selected Vehicle Info (Mobile) - Hidden during replay */}
          {selectedVehicle && !replay.route && (
            <div className="absolute bottom-4 left-4 right-4 lg:hidden z-[1000]">
              <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-4 shadow-xl animate-slide-in-up">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{selectedVehicle.name}</h3>
                  <span className="text-sm text-muted-foreground">{selectedVehicle.plate}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{Math.round(selectedVehicle.speed)}</p>
                    <p className="text-xs text-muted-foreground">km/h</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{selectedVehicle.todayKm}</p>
                    <p className="text-xs text-muted-foreground">km hoje</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{selectedVehicle.fuel.percentage}%</p>
                    <p className="text-xs text-muted-foreground">comb.</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{selectedVehicle.todayHours}h</p>
                    <p className="text-xs text-muted-foreground">horas</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Sidebar - Hidden during replay */}
        {!replay.route && (
          <VehicleSidebar
            onVehicleSelect={(v) => {
              setSelectedVehicle(v);
              setSidebarOpen(false);
            }}
            selectedVehicle={selectedVehicle}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onReplayRequest={handleReplayRequest}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default MapPage;
