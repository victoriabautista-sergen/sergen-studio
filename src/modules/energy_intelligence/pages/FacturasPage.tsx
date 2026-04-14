import { useState } from 'react';
import EnergyShell from '../components/EnergyShell';
import { useDocumentManagement } from '../hooks/useDocumentManagement';
import { ReportUploadCard } from '../components/reports/ReportUploadCard';
import { FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const FacturasPage = () => {
  const {
    documents,
    isLoading,
    uploading,
    deletingId,
    error,
    handleFileUpload,
    handleDelete,
    fetchDocuments,
  } = useDocumentManagement('invoice');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === documents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(documents.map(d => d.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      for (const id of selected) {
        await handleDelete(id);
      }
      setSelected(new Set());
      toast({ title: 'Facturas eliminadas', description: `${selected.size} factura(s) eliminada(s) correctamente.` });
    } catch {
      toast({ title: 'Error', description: 'Hubo un error al eliminar algunas facturas.', variant: 'destructive' });
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <EnergyShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Facturas</h1>
        <p className="text-muted-foreground mt-1">Gestión de facturas de electricidad subidas al sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ReportUploadCard uploading={uploading} onFileUpload={handleFileUpload} title="Subir Factura" description="Arrastra o da clic para subir una factura (Solo PDF)" />
        </div>
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Cargando facturas...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-4">
              <p className="font-semibold">Error al cargar facturas:</p>
              <p className="text-sm mt-1">{error}</p>
              <Button onClick={fetchDocuments} variant="outline" size="sm" className="mt-2">Reintentar</Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-lg border border-border">
              <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <p className="mt-2 text-muted-foreground">No hay facturas disponibles</p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selected.size === documents.length && documents.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selected.size > 0 ? `${selected.size} seleccionada(s)` : 'Seleccionar todas'}
                  </span>
                </div>
                {selected.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="flex items-center gap-2"
                  >
                    {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Eliminar ({selected.size})
                  </Button>
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="relative group">
                    <div className={`bg-card rounded-lg border p-4 hover:shadow-md transition-all ${selected.has(doc.id) ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
                      {/* Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selected.has(doc.id)}
                          onCheckedChange={() => toggleSelect(doc.id)}
                        />
                      </div>

                      <div className="aspect-square flex items-center justify-center mb-2 bg-primary/5 rounded-lg">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-sm font-medium text-center text-foreground truncate mb-3">
                        {doc.filename}
                      </div>
                      <div className="flex justify-center gap-2">
                        <a
                          href={supabase.storage.from('invoices').getPublicUrl(doc.file_path).data.publicUrl}
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
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                        >
                          {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </EnergyShell>
  );
};

export default FacturasPage;
