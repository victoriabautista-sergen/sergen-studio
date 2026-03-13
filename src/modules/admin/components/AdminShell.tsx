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
}

const AdminShell = ({ children, breadcrumbs = [] }: AdminShellProps) => (
  <PrivateRoute allowedRoles={["super_admin", "technical_user"]}>
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card shrink-0">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <img src={sergenLogo} alt="SERGEN" className="h-7" />
          <span className="text-muted-foreground">/</span>
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="font-heading font-semibold">SERGEN Admin Panel</span>
        </div>
      </header>

      {breadcrumbs.length > 0 && (
        <nav className="border-b bg-muted/30 shrink-0">
          <div className="container flex items-center h-10 gap-1.5 text-sm">
            <Link
              to="/admin-panel"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Panel
            </Link>
            {breadcrumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
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
        <div className="container py-8">{children}</div>
      </main>
    </div>
  </PrivateRoute>
);

export default AdminShell;
