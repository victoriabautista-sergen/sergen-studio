import { Zap } from "lucide-react";

interface RiskLevelIndicatorProps {
  riskLevel: string;
}

const getHeaderGradient = (level: string) => {
  switch (level) {
    case 'ALTO': return 'linear-gradient(135deg, hsl(0 70% 45%) 0%, hsl(0 60% 35%) 100%)';
    case 'MEDIO': return 'linear-gradient(135deg, hsl(45 80% 45%) 0%, hsl(40 70% 35%) 100%)';
    case 'BAJO': return 'linear-gradient(135deg, hsl(145 60% 35%) 0%, hsl(145 50% 25%) 100%)';
    default: return 'linear-gradient(135deg, hsl(195 70% 30%) 0%, hsl(195 60% 22%) 100%)';
  }
};

const getIconBg = (level: string) => {
  switch (level) {
    case 'ALTO': return 'hsl(0 70% 45%)';
    case 'MEDIO': return 'hsl(45 80% 45%)';
    case 'BAJO': return 'hsl(145 60% 35%)';
    default: return 'hsl(195 70% 30%)';
  }
};

export const RiskLevelIndicator = ({ riskLevel }: RiskLevelIndicatorProps) => (
  <div className="w-full rounded-xl overflow-hidden border border-border shadow-sm">
    <div className="px-4 py-2" style={{ background: getHeaderGradient(riskLevel) }}>
      <p className="text-white text-sm font-semibold tracking-wide">Riesgo Demanda Coincidente</p>
    </div>
    <div className="bg-card px-4 py-5 flex items-center justify-between">
      <p className="text-3xl font-bold text-foreground">{riskLevel}</p>
      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: getIconBg(riskLevel) }}>
        <Zap className="h-5 w-5 text-white" />
      </div>
    </div>
  </div>
);
