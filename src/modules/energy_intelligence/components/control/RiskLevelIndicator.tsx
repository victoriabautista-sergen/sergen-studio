interface RiskLevelIndicatorProps {
  riskLevel: string;
}

const getRiskColor = (level: string): string => {
  switch (level) {
    case 'ALTO': return '#C00000';
    case 'MEDIO': return '#156082';
    case 'BAJO': return '#196B24';
    default: return '#156082';
  }
};

export const RiskLevelIndicator = ({ riskLevel }: RiskLevelIndicatorProps) => (
  <div className="text-center w-[266px]">
    <p className="text-[#8E9196] text-lg font-medium mb-2">Riesgo de coincidente</p>
    <p
      style={{ backgroundColor: getRiskColor(riskLevel) }}
      className="text-white px-4 h-[66px] rounded w-full flex items-center justify-center text-2xl font-medium"
    >
      {riskLevel}
    </p>
  </div>
);
