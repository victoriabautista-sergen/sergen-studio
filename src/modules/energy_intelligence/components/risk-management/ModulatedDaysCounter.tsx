import { CalendarDays } from "lucide-react";

interface ModulatedDaysCounterProps {
  modulatedDays: number;
}

export const ModulatedDaysCounter = ({ modulatedDays }: ModulatedDaysCounterProps) => {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border shadow-sm">
      <div className="px-4 py-2" style={{ background: 'linear-gradient(135deg, hsl(195 70% 30%) 0%, hsl(195 60% 22%) 100%)' }}>
        <p className="text-white text-sm font-semibold tracking-wide">Días Modulados</p>
      </div>
      <div className="bg-card px-4 py-5 flex items-center justify-between">
        <p className="text-3xl font-bold text-foreground">
          {modulatedDays} <span className="text-lg font-medium text-muted-foreground">días</span>
        </p>
        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(145 60% 35%)' }}>
          <CalendarDays className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
};
