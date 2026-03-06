export const ModulationLegend = () => {
  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm mt-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm">Con modulación</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm">Sin modulación</span>
        </div>
      </div>
    </div>
  );
};
