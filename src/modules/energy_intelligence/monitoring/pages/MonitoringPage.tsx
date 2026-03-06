import { useState } from "react";
import { Zap } from "lucide-react";
import ModuleLayout from "@/shared/components/ModuleLayout";
import { RiskManagement } from "../components/risk-management/RiskManagement";
import { PowerCharts } from "../components/forecast/PowerCharts";
import { HistoricalPowerMaximum } from "../components/historicalPower/HistoricalPowerMaximum";

const ControlDemandaPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <ModuleLayout title="Control de Demanda" icon={Zap}>
      <div className="mb-4">
        <h2 className="text-2xl font-heading font-bold mb-1">Control de Demanda</h2>
        <p className="text-sm text-muted-foreground">
          Panel de gestión de riesgo, pronóstico COES y potencia máxima histórica
        </p>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <RiskManagement energyData={[]} date={date} setDate={setDate} />
        </div>
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <PowerCharts />
          <HistoricalPowerMaximum />
        </div>
      </div>
    </ModuleLayout>
  );
};

export default ControlDemandaPage;
