interface TimeRangeDisplayProps {
  timeRange: string;
}

export const TimeRangeDisplay = ({ timeRange }: TimeRangeDisplayProps) => (
  <div className="text-center w-[266px]">
    <p className="text-[#8E9196] text-lg font-medium mb-2">Rango horario</p>
    <p
      className="text-white px-4 h-[66px] rounded w-full flex items-center justify-center text-2xl font-medium"
      style={{ backgroundColor: '#156082' }}
    >
      {timeRange}
    </p>
  </div>
);
