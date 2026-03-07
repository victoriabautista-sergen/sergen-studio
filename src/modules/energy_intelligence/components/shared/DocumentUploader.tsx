import { Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DocumentUploaderProps {
  id: string;
  label: string;
  accept: string;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string;
}

export const DocumentUploader = ({
  id,
  label,
  accept,
  isUploading,
  onUpload,
  description,
}: DocumentUploaderProps) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input type="file" id={id} className="hidden" accept={accept} onChange={onUpload} />
    <Label
      htmlFor={id}
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center block cursor-pointer hover:border-gray-400 mt-2"
    >
      {isUploading ? (
        <Loader2 className="w-6 h-6 mx-auto animate-spin" />
      ) : (
        <Upload className="w-6 h-6 mx-auto" />
      )}
      <p className="text-gray-600 text-sm mt-1">
        {description || 'Arrastra o da clic para subir un archivo'}
      </p>
    </Label>
  </div>
);
