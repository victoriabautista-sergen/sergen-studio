import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchDocuments, uploadDocument, deleteDocument } from '../services/documentService';
import { getDocumentTypeDisplay } from '../utils/documentUtils';
import type { Document, DocumentType } from '../types';

export const useDocumentManagement = (documentType: DocumentType) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentsList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const docs = await fetchDocuments(documentType);
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      toast.error(`No se pudieron cargar ${getDocumentTypeDisplay(documentType)}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [documentType]);

  useEffect(() => {
    fetchDocumentsList();
  }, [fetchDocumentsList]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf'];
    if (documentType !== 'report') {
      allowedTypes.push(
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        documentType === 'report'
          ? 'Solo se aceptan archivos PDF.'
          : 'Solo se aceptan PDF, XLS y XLSX.'
      );
      return;
    }

    try {
      setUploading(true);
      await uploadDocument(documentType, file);
      toast.success(`${getDocumentTypeDisplay(documentType, true)} subido correctamente`);
      fetchDocumentsList();
    } catch (err: any) {
      toast.error(`No se pudo subir ${getDocumentTypeDisplay(documentType)}: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteDocument(id);
      toast.success(`${getDocumentTypeDisplay(documentType, true)} eliminado correctamente`);
      fetchDocumentsList();
    } catch (err: any) {
      toast.error(`No se pudo eliminar ${getDocumentTypeDisplay(documentType)}: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return {
    documents,
    isLoading,
    uploading,
    deletingId,
    error,
    handleFileUpload,
    handleDelete,
    fetchDocuments: fetchDocumentsList,
  };
};
