interface ModulatedDaysCounterProps {
  modulatedDays: number;
}

export const ModulatedDaysCounter = ({ modulatedDays }: ModulatedDaysCounterProps) => (
  <div className="text-center w-[266px]">
    <p className="text-[#8E9196] text-lg font-medium mb-2">Días modulados</p>
    <p
      style={{ backgroundColor: '#156082' }}
      className="text-white px-4 h-[66px] rounded w-full flex items-center justify-center text-2xl font-medium border"
    >
      {modulatedDays} días
    </p>
  </div>
);
