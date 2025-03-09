// Path: shared/src/services/documentService.ts

import { Document } from '../../types/document';

export const fetchDocuments = async (): Promise<Document[]> => {
  const response = await fetch(`/api/documents`);

  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  return await response.json();
};

export const uploadDocument = async (
    memberId: string,
    file: File,
    financialYear: string,
    isProtected: boolean = false,
    password?: string
): Promise<Document> => {
  // Implementation would go here - replace with actual API call
  const formData = new FormData();
  formData.append('file', file);
  formData.append('member_id', memberId);
  formData.append('financial_year', financialYear);
  formData.append('is_protected', String(isProtected));

  if (password) {
    formData.append('password', password);
  }

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload document');
  }

  return await response.json();
};

export const getDocumentsByMemberId = async (memberId: string, financialYear?: string): Promise<Document[]> => {
  // Implementation would go here - replace with actual API call
  let url = `/api/documents?member_id=${memberId}`;
  if (financialYear) {
    url += `&financial_year=${financialYear}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  return await response.json();
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  // Implementation would go here - replace with actual API call
  const response = await fetch(`/api/documents/${documentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete document');
  }
};