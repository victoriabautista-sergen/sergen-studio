import { Calendar, FilterX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportDateSelectorProps {
  availableYears: string[];
  availableMonths: string[];
  selectedYear: string | null;
  selectedMonth: string | null;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  onClearFilters: () => void;
}

export const ReportDateSelector = ({
  availableYears,
  availableMonths,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onClearFilters,
}: ReportDateSelectorProps) => (
  <Card className="p-4 mb-4">
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-semibold">Seleccionar Fecha</h2>
      <Calendar className="h-5 w-5 text-gray-500" />
    </div>
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Año</label>
        <Select value={selectedYear || ''} onValueChange={onYearChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Mes</label>
        <Select
          value={selectedMonth || ''}
          onValueChange={onMonthChange}
          disabled={!selectedYear || availableMonths.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(month => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    {(selectedYear || selectedMonth) && (
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="w-full flex items-center justify-center gap-2"
        >
          <FilterX className="h-4 w-4" />
          Quitar filtros
        </Button>
      </div>
    )}
  </Card>
);
