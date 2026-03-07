import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { exportToCSV } from '../../utils/exportUtils';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface ExportDataDialogProps {
  data: any[];
  filename: string;
}

export const ExportDataDialog = ({ data, filename }: ExportDataDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    exportToCSV(data, filename);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar datos</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Button variant="outline" onClick={handleExport}>
            Exportar a CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
