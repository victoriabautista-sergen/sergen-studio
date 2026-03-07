import { useState } from 'react';
import { useForecastSettings } from '../../hooks/useForecastSettings';
import { useModulationData } from '../../hooks/useModulationData';
import { useMaxPower } from '../../hooks/useMaxPower';
import { RiskManagementCard } from './RiskManagementCard';
import { ModulationCalendarCard } from './ModulationCalendarCard';

interface RiskManagementProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export const RiskManagement = ({ date, setDate }: RiskManagementProps) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const settings = useForecastSettings();
  const maxPower = useMaxPower(date);
  const { modulationData, modulatedDays } = useModulationData(selectedMonth);

  return (
    <>
      <RiskManagementCard
        maxPower={maxPower}
        timeRange={settings.modulation_time}
        riskLevel={settings.risk_level}
        modulatedDays={modulatedDays}
      />
      <ModulationCalendarCard
        date={date}
        selectedMonth={selectedMonth}
        modulationData={modulationData}
        onDateSelect={setDate}
        onMonthChange={setSelectedMonth}
      />
    </>
  );
};
