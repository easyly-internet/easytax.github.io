import api from './api';

export interface Member {
  id: string;
  panNumber: string;
  fullName: string;
  email: string;
  userId: string;
  documents?: string[];
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberYear {
  id: string;
  memberId: string;
  financialYear: string;
  documents?: Array<{
    path: string;
    name: string;
  }>;
  protectedDocuments?: Array<{
    path: string;
    name: string;
    password: string;
  }>;
  receipts?: Array<{
    path: string;
    name: string;
  }>;
  remark?: string[];
  adminRemark?: string[];
  status: 'TobeStarted' | 'InProgress' | 'Completed' | 'Rejected';
  amounts?: Array<{
    refundAmount: number;
    feeAmount: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFilters {
  user_id?: string;
  from_date?: string;
  to_date?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface NewMemberData {
  panNumber: string;
  fullName: string;
  email: string;
  remark?: string;
  panCard?: File;
  aadharCard?: File;
}

export interface MemberYearUploadDocument {
  memberId: string;
  financial_year: string;
  documents: File[];
  documentNames: string[];
}

export interface MemberYearProtectedDocument extends MemberYearUploadDocument {
  passwords: string[];
}

const memberService = {
  // Get all members with optional filtering
  getMembers: async (filters: MemberFilters = {}): Promise<Member[]> => {
    return api.get('/members', filters);
  },

  // Get a specific member by ID
  getMember: async (id: string): Promise<Member> => {
    return api.get(`/members/${id}`);
  },

  // Create a new member
  createMember: async (data: NewMemberData): Promise<Member> => {
    const formData = new FormData();
    formData.append('panNumber', data.panNumber);
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);

    if (data.remark) {
      formData.append('remark', data.remark);
    }

    if (data.panCard) {
      formData.append('panCard', data.panCard);
    }

    if (data.aadharCard) {
      formData.append('aadharCard', data.aadharCard);
    }

    // Using fetch for multipart form data
    const response = await fetch(`${process.env.REACT_APP_API_URL}/members`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Member creation failed');
    }

    return response.json();
  },

  // Update a member
  updateMember: async (id: string, data: Partial<NewMemberData>): Promise<Member> => {
    const formData = new FormData();

    if (data.panNumber) formData.append('panNumber', data.panNumber);
    if (data.fullName) formData.append('fullName', data.fullName);
    if (data.email) formData.append('email', data.email);
    if (data.remark) formData.append('remark', data.remark);
    if (data.panCard) formData.append('panCard', data.panCard);
    if (data.aadharCard) formData.append('aadharCard', data.aadharCard);

    // Using fetch for multipart form data
    const response = await fetch(`${process.env.REACT_APP_API_URL}/members/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Member update failed');
    }

    return response.json();
  },

  // Get member years for a specific member
  getMemberYears: async (memberId: string): Promise<MemberYear[]> => {
    return api.get(`/members/${memberId}/years`);
  },

  // Get a specific member year
  getMemberYear: async (memberId: string, financialYear: string): Promise<MemberYear> => {
    return api.get(`/members/${memberId}/years/${financialYear}`);
  },

  // Upload documents for a member year
  uploadDocuments: async (data: MemberYearUploadDocument): Promise<MemberYear> => {
    const formData = new FormData();
    formData.append('member_id', data.memberId);
    formData.append('financial_year', data.financial_year);

    data.documents.forEach((file, index) => {
      formData.append(`document_${index + 1}`, file);
      formData.append(`document_name_${index + 1}`, data.documentNames[index]);
    });

    const response = await fetch(`${process.env.REACT_APP_API_URL}/members/${data.memberId}/document-store`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Document upload failed');
    }

    return response.json();
  },

  // Upload protected documents for a member year
  uploadProtectedDocuments: async (data: MemberYearProtectedDocument): Promise<MemberYear> => {
    const formData = new FormData();
    formData.append('member_id', data.memberId);
    formData.append('financial_year', data.financial_year);

    data.documents.forEach((file, index) => {
      formData.append(`protected_documents[${index}]`, file);
      formData.append(`passwords[${index}]`, data.passwords[index]);
    });

    const response = await fetch(`${process.env.REACT_APP_API_URL}/members/${data.memberId}/document-store`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Protected document upload failed');
    }

    return response.json();
  },

  // Add a remark to a member year
  addRemark: async (memberYearId: string, remark: string): Promise<MemberYear> => {
    return api.post('/add-remark', { member_year_id: memberYearId, remark });
  },

  // Remove a document from a member year
  removeDocument: async (memberYearId: string, documentIndex: number): Promise<void> => {
    return api.post('/remove-document', { member_year_id: memberYearId, document_index: documentIndex });
  },

  // Remove a protected document from a member year
  removeProtectedDocument: async (memberYearId: string, protectedDocumentIndex: number): Promise<void> => {
    return api.post('/remove-protected-document', {
      member_year_id: memberYearId,
      protected_document_index: protectedDocumentIndex
    });
  },

  // Export member data
  exportMembers: async (filters: MemberFilters = {}): Promise<Blob> => {
    const response = await api.request<Blob>({
      url: '/export-members',
      method: 'GET',
      responseType: 'blob',
      params: filters
    });

    return response;
  },

  // Search members
  searchMembers: async (query: string): Promise<Member[]> => {
    return api.get('/members/search', { query });
  }
};

export default memberService;