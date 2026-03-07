import { useDocumentManagement } from './useDocumentManagement';
import type { Document } from '../types';

export interface Report extends Document {}

export const useReports = () => {
  const {
    documents,
    isLoading,
    uploading,
    deletingId,
    error,
    handleFileUpload,
    handleDelete,
    fetchDocuments,
  } = useDocumentManagement('report');

  return {
    reports: documents as Report[],
    isLoading,
    uploading,
    deletingId,
    error,
    handleFileUpload,
    handleDelete,
    fetchReports: fetchDocuments,
  };
};
