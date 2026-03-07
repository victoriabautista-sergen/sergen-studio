import { format } from 'date-fns';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const rows = data.map(item => ({
    Fecha: item.fecha ? format(new Date(item.fecha), 'dd/MM/yyyy HH:mm') : '',
    'Reprogramación Diaria': item.reprogramado ?? item.reprogramacion_diaria ?? '',
    'Pronóstico': item.pronostico ?? '',
    'Rango Inferior': item.rango_inferior ?? '',
    'Rango Superior': item.rango_superior ?? '',
    'Ejecutado': item.ejecutado ?? '',
  }));

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = (row as any)[h];
        return val !== null && val !== undefined ? String(val) : '';
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
