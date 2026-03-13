import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isAfter, isSameMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ModulationLegend } from '../shared/ModulationLegend';

interface ModulationCalendarCardProps {
  date: Date | undefined;
  selectedMonth: Date;
  modulationData: { date: string; is_modulated: boolean }[];
  onDateSelect: (date: Date | undefined) => void;
  onMonthChange: (date: Date) => void;
  editable?: boolean;
}

export const ModulationCalendarCard = ({
  date,
  selectedMonth,
  modulationData,
  onDateSelect,
  onMonthChange,
  editable = false,
}: ModulationCalendarCardProps) => {
  const isDateInFuture = (d: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isAfter(d, today);
  };

  const getDateClassName = (d: Date): string => {
    if (!isSameMonth(d, selectedMonth)) return 'text-muted-foreground/30';

    const dateStr = format(d, 'yyyy-MM-dd');
    const modulationDay = modulationData.find(md => md.date === dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isAfter(d, today)) return 'text-muted-foreground';
    if (modulationDay?.is_modulated) return 'text-red-500 font-bold';
    return 'text-green-500';
  };

  const handleDayClick = (dayDate: Date) => {
    if (!isDateInFuture(dayDate) && isSameMonth(dayDate, selectedMonth)) {
      onDateSelect(dayDate);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl text-center w-full">Calendario</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center flex-1 pt-2">
        <Calendar
          mode="single"
          selected={date}
          onSelect={() => {}}
          month={selectedMonth}
          onMonthChange={onMonthChange}
          className="rounded-md border"
          locale={es}
          components={{
            Day: ({ date: dayDate }: { date: Date; displayMonth: Date }) => {
              const isFuture = isDateInFuture(dayDate);
              const isCurrentMonth = isSameMonth(dayDate, selectedMonth);
              const isClickable = editable && !isFuture && isCurrentMonth;

              return (
                <button
                  type="button"
                  onClick={() => handleDayClick(dayDate)}
                  disabled={!isClickable && editable}
                  className={cn(
                    'h-9 w-9 p-0 font-normal flex items-center justify-center rounded-md transition-colors',
                    getDateClassName(dayDate),
                    isClickable && 'hover:bg-accent cursor-pointer',
                    !isClickable && editable && 'cursor-not-allowed',
                    date && isSameDay(dayDate, date) && 'ring-2 ring-primary'
                  )}
                >
                  {dayDate.getDate()}
                </button>
              );
            },
          }}
        />
        <ModulationLegend />
      </CardContent>
    </Card>
  );
};
