import { format } from 'date-fns';
import type { PowerData, ChartData } from '../types';

export const processMaximumData = (data: PowerData[]): ChartData[] => {
  if (!data || data.length === 0) return [];

  const dailyMaximums: Record<string, { fecha: string; max_power: number }> = {};

  data.forEach(item => {
    if (!item.fecha || typeof item.ejecutado !== 'number') return;

    const date = new Date(item.fecha);
    const hour = date.getUTCHours();

    if (hour >= 18 && hour <= 23) {
      const dateString = format(date, 'yyyy-MM-dd');
      if (!dailyMaximums[dateString] || item.ejecutado > dailyMaximums[dateString].max_power) {
        dailyMaximums[dateString] = { fecha: item.fecha, max_power: item.ejecutado };
      }
    }
  });

  if (Object.keys(dailyMaximums).length === 0) return [];

  const formattedData = Object.entries(dailyMaximums)
    .map(([, item]) => ({
      date: format(new Date(item.fecha), 'dd/MM'),
      fullDate: item.fecha,
      value: item.max_power,
      color: '#156082',
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  if (formattedData.length > 0) {
    let maxIdx = 0;
    for (let i = 1; i < formattedData.length; i++) {
      if (formattedData[i].value > formattedData[maxIdx].value) {
        maxIdx = i;
      }
    }
    formattedData[maxIdx].color = '#8B0000';
  }

  return formattedData;
};
