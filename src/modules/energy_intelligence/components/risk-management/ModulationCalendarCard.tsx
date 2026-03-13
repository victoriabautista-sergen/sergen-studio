import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isAfter, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ModulationLegend } from "./ModulationLegend";

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
  onMonthChange
}: ModulationCalendarCardProps) => {
  const isDateInFuture = (d: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isAfter(d, today);
  };

  const getDateClassName = (d: Date): string => {
    if (!isSameMonth(d, selectedMonth)) {
      return "text-muted-foreground/30";
    }

    const dateStr = format(d, 'yyyy-MM-dd');
    const modulationDay = modulationData.find(md => md.date === dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isAfter(d, today)) return "text-muted-foreground";
    if (modulationDay?.is_modulated) return "text-red-500 font-bold";
    return "text-green-500";
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate && !isDateInFuture(selectedDate)) {
      onDateSelect(selectedDate);
    }
  };

  return (
    <Card className="w-full max-w-[350px] mx-auto mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-center w-full">Calendario</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          month={selectedMonth}
          onMonthChange={onMonthChange}
          className="rounded-md border"
          locale={es}
          components={{
            Day: ({ date: d }) => (
              <div
                className={cn(
                  "h-9 w-9 p-0 font-normal flex items-center justify-center",
                  getDateClassName(d)
                )}
              >
                {d.getDate()}
              </div>
            )
          }}
        />
        <ModulationLegend />
      </CardContent>
    </Card>
  );
};
