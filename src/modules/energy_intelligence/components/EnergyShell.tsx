import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BarChart2, TrendingUp, History, FileText, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrivateRoute from '@/core/auth/components/PrivateRoute';
import sergenLogo from '@/assets/sergen-logo.png';
import { cn } from '@/lib/utils';

interface EnergyShellProps {
  children: React.ReactNode;
}

const navLinks = [
  { label: 'Control', href: '/energy-intelligence/control', icon: BarChart2 },
  { label: 'Pronósticos', href: '/energy-intelligence/forecast', icon: TrendingUp },
  { label: 'Histórico', href: '/energy-intelligence/historico', icon: History },
  { label: 'Reportes', href: '/energy-intelligence/reportes', icon: FileText },
  { label: 'Configuración', href: '/energy-intelligence/configuracion', icon: Settings },
];

const EnergyShell = ({ children }: EnergyShellProps) => {
  const location = useLocation();

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card shrink-0 z-10">
          <div className="container flex items-center h-16 gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <img src={sergenLogo} alt="SERGEN" className="h-7" />
            <span className="text-muted-foreground">/</span>
            <Zap className="h-5 w-5 text-muted-foreground" />
            <span className="font-heading font-semibold">Energy Intelligence</span>
          </div>
        </header>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 shrink-0 border-r bg-card flex flex-col">
            <nav className="flex flex-col gap-1 p-4 pt-6">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive =
                  location.pathname === link.href ||
                  location.pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container py-8">{children}</div>
          </main>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default EnergyShell;
