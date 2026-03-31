import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaxPowerDisplay } from './MaxPowerDisplay';
import { TimeRangeDisplay } from './TimeRangeDisplay';
import { RiskLevelIndicator } from './RiskLevelIndicator';
import { ModulatedDaysCounter } from './ModulatedDaysCounter';

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
  modulatedDays,
}: RiskManagementCardProps) => (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-center w-full">Gestión de riesgo</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <MaxPowerDisplay maxPower={maxPower} />
      <TimeRangeDisplay timeRange={timeRange} />
      <RiskLevelIndicator riskLevel={riskLevel} />
      <ModulatedDaysCounter modulatedDays={modulatedDays} />
    </CardContent>
  </Card>
);
