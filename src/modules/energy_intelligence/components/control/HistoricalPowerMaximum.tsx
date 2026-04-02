import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useHistoricalPowerData, getMonthLabel, type ViewMode } from '../historicalPower/useHistoricalPowerData';
import { HistoricalPowerChart } from '../historicalPower/HistoricalPowerChart';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/core/auth/context/AuthContext';

export const HistoricalPowerMaximum = () => {
  const { role } = useAuthContext();
  const canSeeTime = role === "super_admin" || role === "technical_user";
  const [view, setView] = useState<ViewMode>("current");
  const { data, isLoading, error } = useHistoricalPowerData(view);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-2xl">
          <span>Potencia Máxima – {getMonthLabel(view)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "current" ? "previous" : "current")}
          >
            {view === "current" ? "Ver mes anterior" : "Volver al mes actual"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-2 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 flex-col gap-3">
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </div>
        ) : (
          <HistoricalPowerChart data={data} showTime={canSeeTime && view === "current"} />
        )}
      </CardContent>
    </Card>
  );
};
