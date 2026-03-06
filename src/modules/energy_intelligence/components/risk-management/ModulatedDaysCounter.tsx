interface ModulatedDaysCounterProps {
  modulatedDays: number;
}

export const ModulatedDaysCounter = ({ modulatedDays }: ModulatedDaysCounterProps) => {
  return (
    <div className="text-center w-[266px]">
      <p className="text-muted-foreground text-lg font-medium mb-2">Días modulados</p>
      <p className="text-white px-4 h-[66px] rounded w-full flex items-center justify-center text-2xl font-medium bg-[#156082]">
        {modulatedDays} días
      </p>
    </div>
  );
};
