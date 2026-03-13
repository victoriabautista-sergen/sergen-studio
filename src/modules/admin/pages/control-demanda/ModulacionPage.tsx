import { useState } from "react";
import { format, isAfter } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulationCalendarCard } from "@/modules/energy_intelligence/components/control/ModulationCalendarCard";
import { useModulationData } from "@/modules/energy_intelligence/hooks/useModulationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminShell from "../../components/AdminShell";

const ModulacionPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { modulationData, modulatedDays, isLoading, isDateModulated } =
    useModulationData(selectedMonth);
  const [saving, setSaving] = useState(false);

  const breadcrumbs = [
    { label: "Configuración de Módulos", href: "/admin-panel/modulos" },
    { label: "Control de Demanda", href: "/admin-panel/modulos/energy-intelligence" },
    { label: "Modulación" },
  ];

  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate || saving) return;

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
      setSelectedMonth(new Date(selectedMonth));
    } catch (err: any) {
      console.error(err);
      toast.error("Error al actualizar el día de modulación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Modulación</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Haz clic en un día pasado o actual para alternar su estado de modulación.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>
                Estado de modulación del mes seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Días modulados este mes:{" "}
                <strong className="text-foreground">{modulatedDays}</strong>
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
      </div>
    </AdminShell>
  );
};

export default ModulacionPage;
