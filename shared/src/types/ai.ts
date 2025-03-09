
// AI Service Types
export interface TaxAnalysisRequest {
  memberId: string;
  financialYear: string;
  documents: Document[];
}

export interface TaxAnalysisResponse {
  memberId: string;
  financialYear: string;
  income: TaxIncomeBreakdown;
  deductions: TaxDeductionBreakdown;
  taxLiability: TaxLiabilityBreakdown;
  recommendations: TaxRecommendation[];
  summary: string;
}

export interface TaxIncomeBreakdown {
  salary: number;
  business: number;
  capitalGains: number;
  otherSources: number;
  total: number;
}

export interface TaxDeductionBreakdown {
  section80C: number;
  section80D: number;
  homeInterest: number;
  others: number;
  total: number;
}

export interface TaxLiabilityBreakdown {
  oldRegime: number;
  newRegime: number;
  recommended: 'OLD' | 'NEW';
  savings: number;
}

export interface TaxRecommendation {
  id: string;
  type: 'DEDUCTION' | 'INVESTMENT' | 'FILING';
  description: string;
  potentialSavings?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}