import api from './api';

export interface TaxDocument {
  id: string;
  type: 'Form16' | 'Form16A' | 'InvestmentProof' | 'BankStatement' | 'Other';
  extractedData: Record<string, any>;
  uploadDate: string;
  documentId: string;
  memberId: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
}

export interface TaxCalculation {
  id: string;
  memberId: string;
  financialYear: string;
  oldRegime: {
    grossIncome: number;
    deductions: Record<string, number>;
    taxableIncome: number;
    taxAmount: number;
  };
  newRegime: {
    grossIncome: number;
    deductions: Record<string, number>;
    taxableIncome: number;
    taxAmount: number;
  };
  recommendedRegime: 'OLD' | 'NEW';
  status: 'DRAFT' | 'FINAL';
  createdAt: string;
  updatedAt: string;
}

export interface TaxRecommendation {
  id: string;
  memberId: string;
  financialYear: string;
  category: 'INVESTMENT' | 'INSURANCE' | 'TAXSAVING' | 'GENERAL';
  title: string;
  description: string;
  potentialSavings: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

export interface TaxFilingStatus {
  id: string;
  memberId: string;
  financialYear: string;
  status: 'NOT_STARTED' | 'DOCUMENTS_UPLOADED' | 'ANALYSIS_COMPLETED' | 'REVIEW_PENDING' | 'FILED' | 'REFUND_INITIATED' | 'COMPLETED';
  itrType: string;
  filingDate?: string;
  acknowledgementNumber?: string;
  refundAmount?: number;
  refundStatus?: 'PENDING' | 'PROCESSED' | 'CREDITED';
  remarks?: string[];
}

const taxService = {
  // Extract data from a tax document
  extractDocumentData: async (documentId: string): Promise<TaxDocument> => {
    return api.post(`/ai/extract-document/${documentId}`);
  },

  // Calculate taxes for a member for a specific financial year
  calculateTaxes: async (memberId: string, financialYear: string): Promise<TaxCalculation> => {
    return api.post('/ai/calculate-tax', { memberId, financialYear });
  },

  // Get tax calculation for a member
  getTaxCalculation: async (memberId: string, financialYear: string): Promise<TaxCalculation> => {
    return api.get(`/ai/tax-calculation/${memberId}/${financialYear}`);
  },

  // Get tax recommendations for a member
  getTaxRecommendations: async (memberId: string, financialYear: string): Promise<TaxRecommendation[]> => {
    return api.get(`/ai/recommendations/${memberId}/${financialYear}`);
  },

  // Get tax filing status for a member
  getTaxFilingStatus: async (memberId: string, financialYear: string): Promise<TaxFilingStatus> => {
    return api.get(`/ai/filing-status/${memberId}/${financialYear}`);
  },

  // Update tax filing status
  updateTaxFilingStatus: async (
    memberId: string,
    financialYear: string,
    status: Partial<TaxFilingStatus>
  ): Promise<TaxFilingStatus> => {
    return api.put(`/ai/filing-status/${memberId}/${financialYear}`, status);
  },

  // Generate tax filing report
  generateTaxReport: async (memberId: string, financialYear: string): Promise<Blob> => {
    const response = await api.request<Blob>({
      url: `/ai/generate-report/${memberId}/${financialYear}`,
      method: 'GET',
      responseType: 'blob'
    });

    return response;
  },

  // Ask a tax-related question to AI
  askTaxQuestion: async (question: string, context?: {
    memberId?: string,
    financialYear?: string
  }): Promise<{
    answer: string,
    references?: Array<{ title: string, url: string }>
  }> => {
    return api.post('/ai/ask', { question, ...context });
  },

  // Submit tax filing for processing
  submitTaxFiling: async (
    memberId: string,
    financialYear: string,
    regimeType: 'OLD' | 'NEW',
    verificationMethod: 'AADHAAR_OTP' | 'NET_BANKING' | 'DSC'
  ): Promise<TaxFilingStatus> => {
    return api.post('/ai/submit-filing', {
      memberId,
      financialYear,
      regimeType,
      verificationMethod
    });
  }
};

export default taxService;