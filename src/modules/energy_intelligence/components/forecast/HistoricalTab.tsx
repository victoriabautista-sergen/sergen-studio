import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ExportDataDialog } from '../shared/ExportDataDialog';
import { ConsoleOutput } from './ConsoleOutput';
import { HistoricalChart } from './HistoricalChart';

export const HistoricalTab = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [lastError, setLastError] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(false);

  const { data: historicalData, isLoading, refetch, error: fetchError } = useQuery({
    queryKey: ['ei-historical-data'],
    queryFn: async () => {
      setIsCheckingData(true);
      try {
        const { data, error } = await supabase
          .from('coes_historical')
          .select('*')
          .order('fecha', { ascending: true });

        if (error) {
          toast.error('Error al cargar los datos históricos: ' + error.message);
          throw error;
        }

        return data || [];
      } finally {
        setIsCheckingData(false);
      }
    },
  });

  const updateHistoricalData = async () => {
    if (!startDate || !endDate) {
      toast.error('Por favor selecciona las fechas de inicio y fin');
      return;
    }

    try {
      setLastError(null);
      const response = await supabase.functions.invoke('get-coes-historical', {
        body: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        },
      });

      if (response.error) {
        setLastError(response.error);
        throw new Error(response.error.message || 'Error desconocido');
      }

      if (response.data?.success) {
        toast.success(`Datos actualizados correctamente (${response.data.count} registros)`);
        refetch();
      } else {
        throw new Error('Error al actualizar los datos');
      }
    } catch (error: any) {
      setLastError(error);
      toast.error(`Error al actualizar los datos históricos: ${error.message}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    try {
      setIsUploading(true);
      setLastError(null);

      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('upload-historical-data', {
        body: formData,
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Datos históricos actualizados correctamente (${data.count} registros)`);
        await refetch();
      } else {
        throw new Error(data?.error || 'Error desconocido al procesar el archivo');
      }
    } catch (error: any) {
      setLastError(error);
      toast.error('Error al procesar el archivo: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const checkDatabaseContent = async () => {
    setIsCheckingData(true);
    try {
      const { count, error } = await supabase
        .from('coes_historical')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      const message =
        count === 0
          ? 'No hay registros en la tabla coes_historical'
          : `Hay ${count} registros en la tabla coes_historical`;

      toast.info(message);
      if (count && count > 0) refetch();
    } catch (error: any) {
      toast.error('Error al verificar registros: ' + error.message);
    } finally {
      setIsCheckingData(false);
    }
  };

  if (isLoading && !isCheckingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="font-semibold mb-2">Subir Datos Históricos</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="ei-excel-upload"
            disabled={isUploading}
          />
          <label htmlFor="ei-excel-upload">
            <Button variant="outline" disabled={isUploading} className="cursor-pointer" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Subiendo...' : 'Seleccionar Excel'}
              </span>
            </Button>
          </label>
          <Button variant="outline" onClick={checkDatabaseContent} disabled={isCheckingData}>
            {isCheckingData ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              'Verificar Registros'
            )}
          </Button>
          <p className="text-sm text-gray-500">Formatos soportados: .xlsx, .xls</p>
        </div>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Datos Históricos</h2>
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {startDate ? format(startDate, 'PP') : 'Fecha inicial'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  {endDate ? format(endDate, 'PP') : 'Fecha final'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={updateHistoricalData} disabled={!startDate || !endDate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar Datos
          </Button>
          {historicalData && historicalData.length > 0 && (
            <ExportDataDialog data={historicalData} filename="datos-historicos" />
          )}
        </div>
      </div>

      {(lastError || fetchError) && <ConsoleOutput error={lastError || fetchError} />}

      <div className="grid grid-cols-1 gap-6">
        {historicalData && historicalData.length > 0 ? (
          <>
            <div className="bg-white p-4 rounded-lg shadow h-[400px]">
              <HistoricalChart data={historicalData} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Demanda Programada</TableHead>
                    <TableHead>Reprogramación Diaria</TableHead>
                    <TableHead>Prog. Semanal</TableHead>
                    <TableHead>Ejecutado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalData.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell>{format(new Date(row.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>{row.demanda_programada?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{row.reprogramacion_diaria?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{row.prog_semanal?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{row.ejecutado?.toLocaleString() || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No hay datos históricos disponibles. Selecciona un rango de fechas y haz clic en "Actualizar
              Datos" o sube un archivo Excel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
