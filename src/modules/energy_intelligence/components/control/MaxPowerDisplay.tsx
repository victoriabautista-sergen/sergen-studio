import { Zap } from "lucide-react";

interface MaxPowerDisplayProps {
  maxPower: number;
}

export const MaxPowerDisplay = ({ maxPower }: MaxPowerDisplayProps) => (
  <div className="w-full rounded-xl overflow-hidden border border-border shadow-sm">
    <div className="px-4 py-2" style={{ background: 'hsl(220 15% 90%)' }}>
      <p className="text-sm font-semibold tracking-wide" style={{ color: 'hsl(220 20% 10%)' }}>Potencia Máxima</p>
    </div>
    <div className="bg-card px-4 py-5 flex items-center justify-between">
      <p className="text-3xl font-bold text-foreground">
        {maxPower.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg font-medium text-muted-foreground">MW</span>
      </p>
      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(195 70% 30%)' }}>
        <Zap className="h-5 w-5 text-white" />
      </div>
    </div>
  </div>
);
