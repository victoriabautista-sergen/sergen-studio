import React, { forwardRef } from 'react';

export const ModulationLegend = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="bg-white p-4 rounded-lg border shadow-sm mt-4">
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className="text-sm">Con modulación</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-sm">Sin modulación</span>
      </div>
    </div>
  </div>
));

ModulationLegend.displayName = 'ModulationLegend';
