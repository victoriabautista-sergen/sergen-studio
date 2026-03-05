import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import sergenLogo from "@/assets/sergen-logo.png";

interface ModuleLayoutProps {
  title: string;
  children: React.ReactNode;
}

const ModuleLayout = ({ title, children }: ModuleLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center h-16 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={sergenLogo} alt="SERGEN" className="h-7" />
          <span className="text-muted-foreground">/</span>
          <h1 className="font-heading font-semibold">{title}</h1>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
};

export default ModuleLayout;
