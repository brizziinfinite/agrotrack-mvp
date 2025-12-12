import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
import { FileText, Download, Calendar, Route, Clock, Gauge, Fuel, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
}

const reportTypes: ReportType[] = [
  { id: 'trips', title: 'Viagens', description: 'Relatório completo de todas as viagens realizadas', icon: Route, color: 'bg-primary/10 text-primary' },
  { id: 'stops', title: 'Paradas', description: 'Análise detalhada de paradas e tempo ocioso', icon: MapPin, color: 'bg-warning/10 text-warning' },
  { id: 'speed', title: 'Velocidade', description: 'Histórico de velocidade e infrações', icon: Gauge, color: 'bg-destructive/10 text-destructive' },
  { id: 'hours', title: 'Horas Trabalhadas', description: 'Controle de jornada e horas extras', icon: Clock, color: 'bg-accent/10 text-accent' },
  { id: 'fuel', title: 'Consumo', description: 'Análise de consumo de combustível estimado', icon: Fuel, color: 'bg-secondary/10 text-secondary' },
];

const recentReports = [
  { id: 'r1', name: 'Viagens_Janeiro_2024.pdf', date: '15/01/2024', size: '2.4 MB' },
  { id: 'r2', name: 'Consumo_Semanal_S02.xlsx', date: '14/01/2024', size: '845 KB' },
  { id: 'r3', name: 'Velocidade_Frota_2024.pdf', date: '12/01/2024', size: '1.8 MB' },
  { id: 'r4', name: 'Horas_Trabalhadas_Dez.xlsx', date: '02/01/2024', size: '632 KB' },
];

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    vehicles: 'all',
    format: 'pdf',
  });

  const handleGenerateReport = async () => {
    if (!formData.startDate || !formData.endDate) {
      toast.error('Selecione o período do relatório');
      return;
    }

    setIsGenerating(true);
    
    // Simula a geração do relatório
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast.success(`Relatório de ${selectedReport?.title} gerado com sucesso!`);
    setIsGenerating(false);
    setSelectedReport(null);
    setFormData({ startDate: '', endDate: '', vehicles: 'all', format: 'pdf' });
  };

  const handleDownload = (reportName: string) => {
    toast.success(`Download iniciado: ${reportName}`);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Gere e baixe relatórios detalhados da sua frota</p>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-in-up">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${report.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Calendar className="w-4 h-4" />
                      Gerar Relatório
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Reports */}
        <div className="rounded-2xl border border-border bg-card p-5 animate-slide-in-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Relatórios Recentes</h3>
              <p className="text-sm text-muted-foreground">Seus últimos relatórios gerados</p>
            </div>
          </div>

          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{report.name}</p>
                    <p className="text-sm text-muted-foreground">{report.date} • {report.size}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDownload(report.name)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Relatório de {selectedReport?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicles">Veículos</Label>
              <Select
                value={formData.vehicles}
                onValueChange={(value) => setFormData({ ...formData, vehicles: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  <SelectItem value="active">Apenas ativos</SelectItem>
                  <SelectItem value="inactive">Apenas inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => setFormData({ ...formData, format: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Relatório'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ReportsPage;
