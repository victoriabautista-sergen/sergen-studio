import { supabase } from '@/integrations/supabase/client';
import type { Document, DocumentType } from '../types';

const getFunctionBaseUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  return `${supabaseUrl}/functions/v1`;
};

const getAuthHeader = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');
  return `Bearer ${session.access_token}`;
};

export const fetchDocuments = async (documentType: DocumentType): Promise<Document[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const url = `${getFunctionBaseUrl()}/upload-file?userId=${session.user.id}&type=${documentType}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al cargar documentos: ${response.status} ${errorText}`);
  }

  return (await response.json()) || [];
};

export const uploadDocument = async (documentType: DocumentType, file: File): Promise<any> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', documentType);
  formData.append('userId', session.user.id);

  const response = await fetch(`${getFunctionBaseUrl()}/upload-file`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al subir archivo: ${response.status} ${errorText}`);
  }

  return await response.json();
};

export const deleteDocument = async (id: string): Promise<any> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No hay sesión activa');

  const response = await fetch(`${getFunctionBaseUrl()}/upload-file?id=${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al eliminar documento: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  if (!result.success) throw new Error('Error al eliminar el documento');
  return result;
};
