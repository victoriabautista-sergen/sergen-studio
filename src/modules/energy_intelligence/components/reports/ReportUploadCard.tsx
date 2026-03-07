import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUploader } from '../shared/DocumentUploader';

interface ReportUploadCardProps {
  uploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export const ReportUploadCard = ({ uploading, onFileUpload, className }: ReportUploadCardProps) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className="flex items-center text-lg">
        <Upload className="mr-2 h-5 w-5 text-blue-500" />
        Subir Reporte
      </CardTitle>
    </CardHeader>
    <CardContent>
      <DocumentUploader
        id="ei-report-upload"
        label="Seleccionar archivo"
        accept=".pdf"
        isUploading={uploading}
        onUpload={onFileUpload}
        description="Arrastra o da clic para subir un reporte (Solo PDF)"
      />
    </CardContent>
  </Card>
);
