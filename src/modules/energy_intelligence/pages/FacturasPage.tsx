import EnergyShell from '../components/EnergyShell';
import { useDocumentManagement } from '../hooks/useDocumentManagement';
import { ReportUploadCard } from '../components/reports/ReportUploadCard';
import { ReportsList } from '../components/reports/ReportsList';

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

  return (
    <EnergyShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Facturas</h1>
        <p className="text-muted-foreground mt-1">Gestión de facturas de electricidad subidas al sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ReportUploadCard uploading={uploading} onFileUpload={handleFileUpload} />
        </div>
        <div className="lg:col-span-3">
          <ReportsList
            reports={documents}
            isLoading={isLoading}
            deletingId={deletingId}
            error={error}
            onDelete={handleDelete}
            onRetry={fetchDocuments}
          />
        </div>
      </div>
    </EnergyShell>
  );
};

export default FacturasPage;
