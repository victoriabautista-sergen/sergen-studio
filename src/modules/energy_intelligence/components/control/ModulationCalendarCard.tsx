import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isAfter, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ModulationLegend } from '../shared/ModulationLegend';

interface ModulationCalendarCardProps {
  date: Date | undefined;
  selectedMonth: Date;
  modulationData: { date: string; is_modulated: boolean }[];
  onDateSelect: (date: Date | undefined) => void;
  onMonthChange: (date: Date) => void;
}

export const ModulationCalendarCard = ({
  date,
  selectedMonth,
  modulationData,
  onDateSelect,
  onMonthChange,
}: ModulationCalendarCardProps) => {
  const isDateInFuture = (d: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isAfter(d, today);
  };

  const getDateClassName = (d: Date): string => {
    if (!isSameMonth(d, selectedMonth)) return 'text-white';

    const dateStr = format(d, 'yyyy-MM-dd');
    const modulationDay = modulationData.find(md => md.date === dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isAfter(d, today)) return 'text-gray-400';
    if (modulationDay?.is_modulated) return 'text-red-500 font-bold';
    return 'text-green-500';
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && !isDateInFuture(selectedDate)) {
      onDateSelect(selectedDate);
    }
  };

  return (
    <Card className="w-full flex-1 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-center">Calendario</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          month={selectedMonth}
          onMonthChange={onMonthChange}
          className="rounded-md border"
          locale={es}
          components={{
            Day: ({ date: dayDate }: { date: Date; displayMonth: Date }) => (
              <div
                className={cn(
                  'h-9 w-9 p-0 font-normal flex items-center justify-center',
                  getDateClassName(dayDate)
                )}
              >
                {dayDate.getDate()}
              </div>
            ),
          }}
        />
        <ModulationLegend />
      </CardContent>
    </Card>
  );
};
