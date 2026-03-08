import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CoesData } from '../../types';

interface ForecastTableProps {
  data: CoesData[];
}

export const ForecastTable = ({ data }: ForecastTableProps) => {
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) return '-';
    return `${value}`;
  };

  const formatDate = (isoString: string): string => {
    const d = new Date(isoString);
    const dia = d.getUTCDate().toString().padStart(2, '0');
    const mes = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}/${d.getUTCFullYear()} ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  };

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Prog. Diaria (MW)</TableHead>
          <TableHead>Prog. Semanal (MW)</TableHead>
          <TableHead>Demanda Real (MW)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{formatDate(item.date)}</TableCell>
            <TableCell>{formatNumber(item.daily_forecast)}</TableCell>
            <TableCell>{formatNumber(item.weekly_forecast)}</TableCell>
            <TableCell>{formatNumber(item.executed_power)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
