import { EnergyData } from "../../types/energy";
import { RiskManagementCard } from "./RiskManagementCard";
import { ModulationCalendarCard } from "./ModulationCalendarCard";
import { useRiskManagement } from "./useRiskManagement";

interface RiskManagementProps {
  energyData: EnergyData[];
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export const RiskManagement = ({ energyData, date, setDate }: RiskManagementProps) => {
  const {
    maxPower,
    settings,
    modulatedDays,
    modulationData,
    selectedMonth,
    setSelectedMonth,
  } = useRiskManagement(energyData, date, setDate);

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
