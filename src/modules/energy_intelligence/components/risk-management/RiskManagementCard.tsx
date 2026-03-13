import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MaxPowerDisplay } from "./MaxPowerDisplay";
import { TimeRangeDisplay } from "./TimeRangeDisplay";
import { RiskLevelIndicator } from "./RiskLevelIndicator";
import { ModulatedDaysCounter } from "./ModulatedDaysCounter";

interface RiskManagementCardProps {
  maxPower: number;
  timeRange: string;
  riskLevel: string;
  modulatedDays: number;
}

export const RiskManagementCard = ({
  maxPower,
  timeRange,
  riskLevel,
  modulatedDays
}: RiskManagementCardProps) => {
  return (
    <Card className="w-full max-w-[385px] mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-center w-full">Gestión de riesgo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 flex flex-col items-center">
          <MaxPowerDisplay maxPower={maxPower} />
          <TimeRangeDisplay timeRange={timeRange} />
          <RiskLevelIndicator riskLevel={riskLevel} />
          <ModulatedDaysCounter modulatedDays={modulatedDays} />
        </div>
      </CardContent>
    </Card>
  );
};
