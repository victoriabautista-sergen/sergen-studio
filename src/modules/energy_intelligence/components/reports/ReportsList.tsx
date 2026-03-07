import { FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Report } from '../../hooks/useReports';

interface ReportsListProps {
  reports: Report[];
  isLoading: boolean;
  deletingId: string | null;
  error: string | null;
  onDelete: (id: string) => void;
  onRetry: () => void;
}

export const ReportsList = ({
  reports,
  isLoading,
  deletingId,
  error,
  onDelete,
  onRetry,
}: ReportsListProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="mt-2">Cargando reportes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
        <p className="font-semibold">Error al cargar reportes:</p>
        <p className="text-sm mt-1">{error}</p>
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
          Reintentar
        </Button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <FileText className="w-12 h-12 text-gray-400 mx-auto" />
        <p className="mt-2 text-gray-500">No hay reportes disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {reports.map(report => (
        <div key={report.id} className="relative group">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="aspect-square flex items-center justify-center mb-2 bg-blue-50 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-center text-gray-700 truncate mb-3">
              {report.filename}
            </div>
            <div className="flex justify-center gap-2">
              <a
                href={supabase.storage.from('reports').getPublicUrl(report.file_path).data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </a>
              <Button
                size="sm"
                variant="destructive"
                className="flex items-center gap-1"
                onClick={() => onDelete(report.id)}
                disabled={deletingId === report.id}
              >
                {deletingId === report.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
