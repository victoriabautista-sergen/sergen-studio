import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModulePlaceholderProps {
  name: string;
  description: string;
  icon: React.ElementType;
}

const ModulePlaceholder = ({ name, description, icon: Icon }: ModulePlaceholderProps) => {
  const navigate = useNavigate();

  return (
    <Card className="max-w-2xl mx-auto animate-fade-in">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-heading text-2xl">{name}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <p className="text-muted-foreground">{description}</p>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Construction className="h-5 w-5" />
          <span className="text-sm">Módulo en desarrollo — próximamente disponible</span>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Volver al Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModulePlaceholder;
