import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrivateRoute from "@/core/auth/components/PrivateRoute";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  fullWidth?: boolean;
}

const AdminShell = ({ children, breadcrumbs = [], fullWidth = false }: AdminShellProps) => (
  <PrivateRoute allowedRoles={["super_admin"]}>
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card shrink-0">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="font-heading font-bold text-foreground">SERGEN</span>
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="font-heading font-semibold">SERGEN Admin Panel</span>
        </div>
      </header>

      {breadcrumbs.length > 0 && (
        <nav className="border-b bg-muted/30 shrink-0">
          <div className="container flex items-center h-11 gap-2 text-base">
            <Link
              to="/admin-panel"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Panel
            </Link>
            {breadcrumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                {item.href ? (
                  <Link
                    to={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </div>
        </nav>
      )}

      <main className="flex-1">
        <div className={`${fullWidth ? 'max-w-[1920px] mx-auto px-8' : 'container'} py-8`}>{children}</div>
      </main>
    </div>
  </PrivateRoute>
);

export default AdminShell;
