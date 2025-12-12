import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Map,
  Car,
  FileText,
  Settings,
  Users,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Truck,
  Target,
  X,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mapa', icon: Map, label: 'Mapa em Tempo Real' },
  { to: '/frota', icon: Car, label: 'Gestão de Frota' },
  { to: '/cercas', icon: Target, label: 'Cercas Virtuais' },
  { to: '/motoristas', icon: Users, label: 'Motoristas' },
  { to: '/manutencao', icon: Wrench, label: 'Manutenção' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  return (
    <>
      {/* Overlay for mobile */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen gradient-sidebar border-r border-sidebar-border flex flex-col z-50',
          'transition-transform duration-300 ease-out lg:transition-[width] lg:translate-x-0',
          // Mobile: slide in/out
          collapsed ? '-translate-x-full' : 'translate-x-0',
          // Desktop: collapse to mini
          collapsed ? 'lg:w-[68px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span
              className={cn(
                'font-semibold text-sidebar-foreground text-lg whitespace-nowrap transition-all duration-300',
                collapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'
              )}
            >
              FleetTrack
            </span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden w-7 h-7 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Toggle button for desktop */}
          <button
            onClick={onToggle}
            className={cn(
              'hidden lg:flex w-7 h-7 rounded-lg bg-sidebar-accent items-center justify-center text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200',
              collapsed && 'absolute -right-3 bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-muted transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground group',
                    collapsed && 'lg:justify-center lg:px-0'
                  )}
                  activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                  onClick={onToggle}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={cn(
                      'text-sm font-medium whitespace-nowrap transition-all duration-300',
                      collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div
            className={cn(
              'flex items-center gap-3 overflow-hidden',
              collapsed && 'lg:justify-center'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-sidebar-foreground">JS</span>
            </div>
            <div
              className={cn(
                'transition-all duration-300 overflow-hidden',
                collapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'
              )}
            >
              <p className="text-sm font-medium text-sidebar-foreground whitespace-nowrap">
                João Silva
              </p>
              <p className="text-xs text-sidebar-muted whitespace-nowrap">
                Administrador
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};