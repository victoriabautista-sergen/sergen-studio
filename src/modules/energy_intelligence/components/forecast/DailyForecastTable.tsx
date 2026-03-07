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
            <TableHead>Reprogramado (MW)</TableHead>
            <TableHead>Pronóstico (MW)</TableHead>
            <TableHead>Límite Inferior (MW)</TableHead>
            <TableHead>Límite Superior (MW)</TableHead>
            <TableHead>Ejecutado (MW)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{formatTime(row.fecha)}</TableCell>
              <TableCell>{row.reprogramado ?? '-'}</TableCell>
              <TableCell>{row.pronostico ?? '-'}</TableCell>
              <TableCell>{row.rango_inferior ?? '-'}</TableCell>
              <TableCell>{row.rango_superior ?? '-'}</TableCell>
              <TableCell>{row.ejecutado ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
