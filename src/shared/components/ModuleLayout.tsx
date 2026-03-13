import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ModuleLayoutProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const ModuleLayout = ({ title, icon: Icon, children }: ModuleLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <h1 className="font-heading font-semibold">{title}</h1>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
};

export default ModuleLayout;
