export const ModulationLegend = () => {
  return (
    <div className="flex items-center gap-4 mt-3 pt-2">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
        <span className="text-xs text-muted-foreground">Con modulación</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        <span className="text-xs text-muted-foreground">Sin modulación</span>
      </div>
    </div>
  );
};
