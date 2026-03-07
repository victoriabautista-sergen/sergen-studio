import type { DocumentType } from '../types';

export const getDocumentTypeDisplay = (type: DocumentType, singular = false): string => {
  switch (type) {
    case 'invoice': return singular ? 'la factura' : 'las facturas';
    case 'contract': return singular ? 'el contrato' : 'los contratos';
    case 'report': return singular ? 'el reporte' : 'los reportes';
    default: return singular ? 'el documento' : 'los documentos';
  }
};

export const getBucketName = (type: DocumentType): string => {
  switch (type) {
    case 'invoice': return 'invoices';
    case 'contract': return 'contracts';
    case 'report': return 'reports';
    default: return 'documents';
  }
};
