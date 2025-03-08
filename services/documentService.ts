import api from './api';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  financialYear: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  url?: string;
  memberId?: string;
  password?: string;
  isProtected: boolean;
}

export interface DocumentUploadParams {
  file: File;
  financialYear: string;
  documentName: string;
  isProtected?: boolean;
  password?: string;
  memberId?: string;
}

export interface DocumentListFilters {
  financialYear?: string;
  status?: string;
  memberId?: string;
  page?: number;
  limit?: number;
}

const documentService = {
  // Get all documents with optional filtering
  getDocuments: async (filters: DocumentListFilters = {}): Promise<{ documents: Document[], totalCount: number }> => {
    return api.get('/documents', filters);
  },

  // Get a specific document by ID
  getDocument: async (id: string): Promise<Document> => {
    return api.get(`/documents/${id}`);
  },

  // Upload a new document
  uploadDocument: async (params: DocumentUploadParams): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('financialYear', params.financialYear);
    formData.append('documentName', params.documentName);

    if (params.isProtected) {
      formData.append('isProtected', 'true');
      if (params.password) {
        formData.append('password', params.password);
      }
    }

    if (params.memberId) {
      formData.append('memberId', params.memberId);
    }

    // Using the raw axios instance for multipart form data
    const response = await fetch(`${process.env.REACT_APP_API_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return response.json();
  },

  // Delete a document
  deleteDocument: async (id: string): Promise<void> => {
    return api.delete(`/documents/${id}`);
  },

  // Download a document
  downloadDocument: async (id: string, password?: string): Promise<Blob> => {
    const url = `/documents/${id}/download`;
    const config = password ? { params: { password } } : {};

    const response = await api.request<Blob>({
      url,
      method: 'GET',
      responseType: 'blob',
      ...config
    });

    return response;
  },

  // Get document URL for direct download (expires after a short time)
  getDocumentUrl: async (id: string, password?: string): Promise<{ url: string, expiresAt: string }> => {
    const config = password ? { password } : undefined;
    return api.post(`/documents/${id}/url`, config);
  },

  // Protect an existing document with password
  protectDocument: async (id: string, password: string): Promise<Document> => {
    return api.post(`/documents/${id}/protect`, { password });
  },

  // Remove password protection from document
  removeProtection: async (id: string, currentPassword: string): Promise<Document> => {
    return api.post(`/documents/${id}/remove-protection`, { currentPassword });
  }
};

export default documentService;