import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHistoricalPowerData, getMonthLabel, type ViewMode } from "./useHistoricalPowerData";
import { HistoricalPowerChart } from "./HistoricalPowerChart";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HistoricalPowerMaximum = () => {
  const [view, setView] = useState<ViewMode>("current");
  const { data, isLoading, error } = useHistoricalPowerData(view);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Potencia Máxima – {getMonthLabel(view)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "current" ? "previous" : "current")}
          >
            {view === "current" ? "Ver mes anterior" : "Volver al mes actual"}
          </Button>
        </CardTitle>
            {view === "current" ? "Ver mes anterior" : "Volver al mes actual"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 flex-col">
            <div className="flex items-center text-destructive mb-3">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <HistoricalPowerChart data={data} />
        )}
      </CardContent>
    </Card>
  );
};
