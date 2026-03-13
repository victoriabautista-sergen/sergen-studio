import { useState } from "react";
import { format, isAfter } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulationCalendarCard } from "@/modules/energy_intelligence/components/control/ModulationCalendarCard";
import { useModulationData } from "@/modules/energy_intelligence/hooks/useModulationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ModulacionTab = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { modulationData, modulatedDays, isLoading, isDateModulated } =
    useModulationData(selectedMonth);
  const [saving, setSaving] = useState(false);

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isAfter(selectedDate, today)) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const currentlyModulated = isDateModulated(selectedDate);

    setSaving(true);
    try {
      const existing = modulationData.find((d) => d.date === dateStr);

      if (existing) {
        const { error } = await supabase
          .from("modulation_days")
          .update({ is_modulated: !currentlyModulated })
          .eq("date", dateStr);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("modulation_days")
          .insert({ date: dateStr, is_modulated: true });
        if (error) throw error;
      }

      toast.success(
        !currentlyModulated
          ? `${dateStr} marcado como modulado`
          : `${dateStr} marcado como no modulado`
      );

      setDate(selectedDate);
      // Force re-fetch by toggling month
      setSelectedMonth(new Date(selectedMonth));
    } catch (err: any) {
      console.error(err);
      toast.error("Error al actualizar el día de modulación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Configurar días de modulación</CardTitle>
          <CardDescription>
            Haz clic en un día pasado o actual para alternar su estado de
            modulación. Los días futuros no son editables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>Días modulados este mes: <strong className="text-foreground">{modulatedDays}</strong></span>
          </div>
        </CardContent>
      </Card>

      <ModulationCalendarCard
        date={date}
        selectedMonth={selectedMonth}
        modulationData={modulationData}
        onDateSelect={handleDateSelect}
        onMonthChange={setSelectedMonth}
      />
    </div>
  );
};

export default ModulacionTab;
