import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { EnergyData } from '../../types';

interface EnergyDataTableProps {
  energyData: EnergyData[];
}

export const EnergyDataTable = ({ energyData }: EnergyDataTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Datos de Energía</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Potencia Pronosticada (kW)</TableHead>
            <TableHead>Potencia Ejecutada (kW)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {energyData.map(data => (
            <TableRow key={data.id}>
              <TableCell>{format(new Date(data.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>{data.time}</TableCell>
              <TableCell>{data.forecasted_power.toFixed(2)}</TableCell>
              <TableCell>{data.executed_power.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
