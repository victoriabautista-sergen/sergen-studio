import { format } from "date-fns";
import { PowerData, ChartData } from "../types";

export const processMaximumData = (data: PowerData[]): ChartData[] => {
  if (!data || data.length === 0) return [];

  const dailyMaximums: Record<string, { fecha: string; max_power: number }> = {};

  data.forEach(item => {
    if (!item.fecha || typeof item.ejecutado !== 'number') return;

    try {
      const date = new Date(item.fecha);
      const hour = date.getUTCHours();

      if (hour >= 18 && hour <= 23) {
        const dateString = format(date, 'yyyy-MM-dd');
        if (!dailyMaximums[dateString] || item.ejecutado > dailyMaximums[dateString].max_power) {
          dailyMaximums[dateString] = { fecha: item.fecha, max_power: item.ejecutado };
        }
      }
    } catch (error) {
      console.error('Error processing date:', error, item);
    }
  });

  if (Object.keys(dailyMaximums).length === 0) return [];

  const formattedData = Object.entries(dailyMaximums)
    .map(([, item]) => ({
      date: format(new Date(item.fecha), 'dd/MM'),
      fullDate: item.fecha,
      value: item.max_power,
      color: '#156082'
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  if (formattedData.length > 0) {
    const sortedByValue = [...formattedData].sort((a, b) => b.value - a.value);
    formattedData.forEach(item => {
      if (sortedByValue.length > 0 && item.value === sortedByValue[0].value) {
        item.color = '#D9001B';
      } else if (sortedByValue.length > 1 && item.value === sortedByValue[1].value) {
        item.color = '#F97316';
      } else {
        item.color = '#156082';
      }
    });
  }

  return formattedData;
};
