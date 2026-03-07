
// Document type validation
export type DocumentType = 'invoice' | 'contract' | 'report' | 'profile';

export const isValidDocumentType = (type: string): boolean => {
  const validDocumentTypes: DocumentType[] = ['invoice', 'contract', 'report', 'profile'];
  return validDocumentTypes.includes(type as DocumentType);
};

// Determine bucket name based on document type
export const getBucketName = (type: DocumentType): string => {
  switch (type) {
    case 'profile':
      return 'profiles';
    case 'contract':
      return 'contracts';
    case 'report':
      return 'reports';
    default:
      return 'invoices';
  }
};

// Create unique file path with user prefix
export const createFilePath = (userId: string, fileExt: string): string => {
  const userFolderPrefix = `user_${userId.toString().substring(0, 8)}`;
  return `${userFolderPrefix}/${crypto.randomUUID()}.${fileExt}`;
};
