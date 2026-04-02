import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart2, FileText, Home, Receipt, FileCheck, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import PrivateRoute from '@/core/auth/components/PrivateRoute';
import { cn } from '@/lib/utils';

interface EnergyShellProps {
  children: React.ReactNode;
}

const navLinks = [
  { label: 'Inicio', href: '/dashboard', icon: Home },
  { label: 'Control de Demanda', href: '/energy-intelligence/control', icon: BarChart2 },
  { label: 'Generador de Reporte', href: '/energy-intelligence/reportes', icon: FileText },
  { label: 'Facturas', href: '/energy-intelligence/facturas', icon: Receipt },
  { label: 'Contratos y Adendas', href: '/energy-intelligence/contratos', icon: FileCheck },
];

const EnergyShell = ({ children }: EnergyShellProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "shrink-0 flex flex-col transition-all duration-300 ease-in-out relative",
            collapsed ? "w-0 overflow-hidden" : "w-72"
          )}
          style={{ background: 'linear-gradient(180deg, hsl(195 70% 30%) 0%, hsl(195 60% 22%) 100%)' }}
        >
          {/* Brand */}
          <div className="flex items-center h-14 px-5 gap-3 border-b border-white/10">
            <span className="font-heading font-bold text-white tracking-tight text-lg whitespace-nowrap">SERGEN</span>
          </div>

          <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive =
                link.href === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname === link.href ||
                    location.pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'text-white shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, hsl(25 95% 53%) 0%, hsl(15 90% 48%) 100%)',
                  } : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="absolute top-3 z-20 flex items-center justify-center h-8 w-8 rounded-md transition-colors hover:bg-muted/80 bg-card border border-border shadow-sm"
          style={{ left: collapsed ? '8px' : 'calc(18rem - 2.5rem)' }}
          title={collapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4 text-foreground" /> : <PanelLeftClose className="h-4 w-4 text-white" />}
        </button>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="px-8 py-8 max-w-[1400px]">{children}</div>
        </main>
      </div>
    </PrivateRoute>
  );
};

export default EnergyShell;
