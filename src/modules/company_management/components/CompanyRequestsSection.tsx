import { useState } from "react";
import { CalendarDays, Headphones, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const REQUEST_TYPES = [
  {
    id: "visita",
    title: "Agendar visita técnica",
    description: "Solicitar la visita de un ingeniero a planta.",
    icon: CalendarDays,
  },
  {
    id: "soporte",
    title: "Solicitar soporte",
    description: "Reportar un problema o solicitar asistencia técnica.",
    icon: Headphones,
  },
];

const CompanyRequestsSection = () => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    toast({ title: "Solicitud enviada", description: "Nos pondremos en contacto contigo pronto." });
    setSelected(null);
    setMessage("");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {REQUEST_TYPES.map((rt) => {
          const Icon = rt.icon;
          return (
            <Card
              key={rt.id}
              className={`cursor-pointer transition-all ${
                selected === rt.id
                  ? "border-primary ring-1 ring-primary/20"
                  : "hover:border-primary/30"
              }`}
              onClick={() => setSelected(selected === rt.id ? null : rt.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{rt.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{rt.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle de la solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe tu solicitud con el mayor detalle posible…"
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={handleSend} disabled={!message.trim()}>
                <Send className="h-4 w-4 mr-2" />Enviar solicitud
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyRequestsSection;
