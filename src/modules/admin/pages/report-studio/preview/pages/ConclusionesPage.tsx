import { useEffect, useState } from "react";
import { ReportData, MESES } from "../../types";
import { format, subMonths, isAfter, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const ConclusionesPage = ({ data, pageNumber }: { data: ReportData; pageNumber?: number }) => {
  const h7 = data.hoja7_data;
  const dg = data.datos_generales;

  const mesIndex = MESES.indexOf(dg.mes || "");
  const year = parseInt(dg.anio) || new Date().getFullYear();
  const month = mesIndex >= 0 ? mesIndex : new Date().getMonth();
  const reportDate = new Date(year, month, 1);
  const prevMonth = subMonths(reportDate, 1);
  const prevMonthName = MESES[prevMonth.getMonth()];
  const prevYear = prevMonth.getFullYear();
  const prevMonthIdx = prevMonth.getMonth();

  // Fetch live modulation data from DB
  const [liveModulationDays, setLiveModulationDays] = useState<{ date: string; is_modulated: boolean }[]>([]);
  const [liveCounts, setLiveCounts] = useState<{ modulados: number; libres: number } | null>(null);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const start = format(startOfMonth(prevMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(prevMonth), 'yyyy-MM-dd');

        const { data: modData, error } = await supabase
          .from('modulation_days')
          .select('date, is_modulated')
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: true });

        if (!error && modData) {
          setLiveModulationDays(modData);
          const totalDaysInMonth = endOfMonth(prevMonth).getDate();
          const modulados = modData.filter(d => d.is_modulated).length;
          setLiveCounts({ modulados, libres: totalDaysInMonth - modulados });
        }
      } catch (err) {
        console.error('Error fetching live modulation data:', err);
      }
    };
    fetchLiveData();
  }, [prevYear, prevMonthIdx]);

  // Use live data if available, otherwise fallback to saved h7 data
  const modulationDays = liveModulationDays.length > 0 ? liveModulationDays : (h7.modulation_days || []);
  const diasModulados = liveCounts?.modulados ?? h7.dias_modulados;
  const diasLibres = liveCounts?.libres ?? h7.dias_libres;

  const firstDay = new Date(prevYear, prevMonthIdx, 1);
  const lastDay = new Date(prevYear, prevMonthIdx + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = (firstDay.getDay() + 6) % 7;

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) currentWeek.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const getDayColor = (day: number): string => {
    const d = new Date(prevYear, prevMonthIdx, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isAfter(d, today)) return "#9ca3af";
    const dateStr = format(d, 'yyyy-MM-dd');
    const modDay = modulationDays.find(md => md.date === dateStr);
    if (modDay?.is_modulated) return "#dc2626";
    return "#16a34a";
  };

  const allConclusions = [
    ...(h7.conclusiones_auto || []),
    ...(h7.conclusiones_manuales ? h7.conclusiones_manuales.split("\n").filter(Boolean) : []),
  ];

  const renderMarkdownBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );
  };

  return (
    <div className="flex flex-col h-full text-[12px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#1B3A5C" }}>
      <div className="flex-1">
        {/* Header */}
        <p className="text-[14px] font-bold" style={{ color: "#1B3A5C" }}>Sergen Eficiencia Energética</p>
        <hr className="border-t border-gray-300 my-2" />

        {/* MODULACIONES */}
        <h1 className="text-[14px] font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          III. MODULACIONES
        </h1>

        <p className="text-[12px] mb-3" style={{ color: "#1B3A5C" }}>
          Es importante indicar que en el mes de {prevMonthName.toLowerCase()} del {prevYear} la empresa SERGEN gestionó la demanda energética <strong>{diasModulados} días</strong>, siendo unos de los menores intervalos de modulación en el mercado.
        </p>

        {/* Modulation table */}
        <div className="flex justify-center mb-3">
          <table className="text-[12px]" style={{ borderCollapse: "collapse", border: "0.5px solid #E8792B" }}>
            <thead>
              <tr>
                <th className="px-4 py-1 text-left text-white font-semibold" style={{ backgroundColor: "#E8792B", border: "0.5px solid #E8792B" }}>MODULACIÓN</th>
                <th className="px-4 py-1 text-center text-white font-semibold" style={{ backgroundColor: "#E8792B", border: "0.5px solid #E8792B" }}>DÍAS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-1" style={{ color: "#1B3A5C", border: "0.5px solid #E8792B" }}>Días con rango horario</td>
                <td className="px-4 py-1 text-center font-bold" style={{ color: "#E8792B", border: "0.5px solid #E8792B" }}>{diasModulados} días</td>
              </tr>
              <tr>
                <td className="px-4 py-1" style={{ color: "#1B3A5C", border: "0.5px solid #E8792B" }}>Días libre</td>
                <td className="px-4 py-1 text-center font-bold" style={{ color: "#E8792B", border: "0.5px solid #E8792B" }}>{diasLibres} días</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[12px] mb-3" style={{ color: "#1B3A5C" }}>
          A continuación, se muestra el calendario del mes de {prevMonthName.toLowerCase()} del {prevYear} identificando con color <span className="font-bold" style={{ color: "#16a34a" }}>verde</span> los días que se envió "uso libre de equipos" y de color <span className="font-bold" style={{ color: "#dc2626" }}>rojo</span> los días que se envió restricción horaria.
        </p>

        {/* Calendar */}
        <div className="flex justify-center mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[12px]" style={{ color: "#1B3A5C" }}>{"<"}</span>
              <span className="text-[13px] font-semibold" style={{ color: "#1B3A5C" }}>
                {prevMonthName.toLowerCase()} {prevYear}
              </span>
              <span className="text-[12px]" style={{ color: "#1B3A5C" }}>{">"}</span>
            </div>
            <table className="text-[11px] border-0" style={{ borderCollapse: "collapse", border: "none" }}>
              <thead>
                <tr>
                  {["lu", "ma", "mi", "ju", "vi", "sá", "do"].map(d => (
                    <th key={d} className="px-2 py-1 font-medium text-gray-500 border-0" style={{ border: "none" }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => (
                  <tr key={wi} className="border-0">
                    {week.map((day, di) => {
                      if (!day) return <td key={di} className="px-2 py-1 border-0" style={{ border: "none" }}></td>;
                      const color = getDayColor(day);
                      const isBold = color === "#dc2626";
                      return (
                        <td
                          key={di}
                          className={`px-2 py-1 text-center border-0 ${isBold ? "font-bold" : ""}`}
                          style={{ color, border: "none" }}
                        >
                          {day}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CONCLUSIONES */}
        <h1 className="text-[14px] font-semibold mt-4 mb-3" style={{ color: "#1B3A5C" }}>
          IV. CONCLUSIONES
        </h1>

        <div className="space-y-2">
          {allConclusions.map((c, i) => (
            <div key={i} className="flex gap-2 text-[12px]" style={{ color: "#1B3A5C" }}>
              <span className="font-bold" style={{ color: "#1B3A5C" }}>{i + 1}.</span>
              <span>{renderMarkdownBold(c)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pdf-footer flex justify-between text-[11px] text-gray-500 border-t border-gray-200 pt-2 mt-auto">
        <span>Sergen Eficiencia Energética S.A.C. - Documento confidencial</span>
        <span>Página {pageNumber ?? 7}</span>
      </div>
    </div>
  );
};

export default ConclusionesPage;
