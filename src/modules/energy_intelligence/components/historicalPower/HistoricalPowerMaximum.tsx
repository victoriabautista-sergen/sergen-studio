import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHistoricalPowerData } from "./useHistoricalPowerData";
import { HistoricalPowerChart } from "./HistoricalPowerChart";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

export const HistoricalPowerMaximum = () => {
  const { data, isLoading, error, refetch } = useHistoricalPowerData();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Potencia Máxima (18:00 - 23:00)</span>
          <button
            onClick={refetch}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </CardTitle>
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
            <button
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={refetch}
            >
              Reintentar
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64 flex-col">
            <p className="text-muted-foreground">
              No hay datos disponibles en el rango horario de 18:00 a 23:00
            </p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={refetch}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <HistoricalPowerChart data={data} />
        )}
      </CardContent>
    </Card>
  );
};
