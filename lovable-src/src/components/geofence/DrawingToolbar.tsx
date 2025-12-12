import { Button } from '@/components/ui/button';
import { Circle, Hexagon, X, Check, Undo2, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DrawingMode = 'none' | 'circle' | 'polygon';

interface DrawingToolbarProps {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  canConfirm?: boolean;
  instruction?: string;
}

export const DrawingToolbar = ({
  mode,
  onModeChange,
  onConfirm,
  onCancel,
  onUndo,
  canUndo = false,
  canConfirm = false,
  instruction,
}: DrawingToolbarProps) => {
  const isDrawing = mode !== 'none';
  
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] flex flex-col items-center gap-2 pointer-events-auto">
      {/* Main toolbar */}
      <div className={cn(
        "bg-card border border-border rounded-xl shadow-xl p-2 flex items-center gap-2",
        isDrawing && "ring-2 ring-primary/50 bg-card"
      )}>
        {mode === 'none' ? (
          <>
            <div className="flex items-center gap-1 px-2 text-sm font-medium text-muted-foreground">
              <MousePointer2 className="w-4 h-4" />
              Ferramentas:
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onModeChange('circle')}
            >
              <Circle className="w-4 h-4" />
              Desenhar Círculo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onModeChange('polygon')}
            >
              <Hexagon className="w-4 h-4" />
              Desenhar Polígono
            </Button>
          </>
        ) : (
          <>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-lg",
              mode === 'circle' ? "bg-teal-500/20 text-teal-600" : "bg-blue-500/20 text-blue-600"
            )}>
              {mode === 'circle' ? (
                <Circle className="w-4 h-4" />
              ) : (
                <Hexagon className="w-4 h-4" />
              )}
              <span className="font-semibold text-sm">
                {mode === 'circle' ? 'Modo Círculo' : 'Modo Polígono'}
              </span>
            </div>
            
            <div className="w-px h-6 bg-border" />
            
            {canUndo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={onUndo}
                title="Desfazer último ponto"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onCancel}
              title="Cancelar desenho"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className={cn(
                "gap-1 transition-all",
                canConfirm 
                  ? "bg-primary hover:bg-primary/90 animate-pulse" 
                  : "opacity-50"
              )}
              onClick={onConfirm}
              disabled={!canConfirm}
            >
              <Check className="w-4 h-4" />
              Confirmar
            </Button>
          </>
        )}
      </div>
      
      {/* Instruction badge */}
      {instruction && isDrawing && (
        <div className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-fade-in",
          mode === 'circle' 
            ? "bg-teal-500 text-white" 
            : "bg-blue-500 text-white"
        )}>
          {instruction}
        </div>
      )}
    </div>
  );
};
