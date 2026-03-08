import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CoesData } from '../../types';

interface DailyForecastTableProps {
  data: CoesData[];
}

export const DailyForecastTable = ({ data }: DailyForecastTableProps) => {
  const formatTime = (dateStr: string) => dateStr.split('T')[1]?.substring(0, 5) ?? dateStr;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hora (UTC)</TableHead>
            <TableHead>Prog. Diaria (MW)</TableHead>
            <TableHead>Prog. Semanal (MW)</TableHead>
            <TableHead>Demanda Real (MW)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{formatTime(row.date)}</TableCell>
              <TableCell>{row.daily_forecast ?? '-'}</TableCell>
              <TableCell>{row.weekly_forecast ?? '-'}</TableCell>
              <TableCell>{row.executed_power ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
