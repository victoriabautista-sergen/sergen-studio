interface RiskLevelIndicatorProps {
  riskLevel: string;
}

export const RiskLevelIndicator = ({ riskLevel }: RiskLevelIndicatorProps) => {
  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case "ALTO": return "#C00000";
      case "MEDIO": return "#D4A017";
      case "BAJO": return "#196B24";
      default: return "#D4A017";
    }
  };

  return (
    <div className="text-center w-[266px]">
      <p className="text-muted-foreground text-lg font-medium mb-2">Riesgo de coincidente</p>
      <p
        style={{ backgroundColor: getRiskLevelColor(riskLevel) }}
        className="text-white px-4 h-[66px] rounded w-full flex items-center justify-center text-2xl font-medium"
      >
        {riskLevel}
      </p>
    </div>
  );
};
