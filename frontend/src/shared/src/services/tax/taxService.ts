// Path: shared/src/services/taxService.ts

import {Deduction, TaxCalculation, TaxLiability} from "../../types/tax";

export async function calculateTaxLiability(
    income: number,
    deductions: Deduction[]
): Promise<TaxLiability> {
  return {
    oldRegime: income * 0.1 - deductions.reduce((sum, d) => sum + d.amount, 0),
    newRegime: income * 0.08 - deductions.reduce((sum, d) => sum + d.amount, 0),
    recommended: 'oldRegime',
  };
}


export enum TaxFilingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DOCUMENTS_REQUIRED = 'DOCUMENTS_REQUIRED',
  READY_FOR_FILING = 'READY_FOR_FILING',
  FILED = 'FILED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  REFUND_INITIATED = 'REFUND_INITIATED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export const calculateTax = async (
    memberId: string,
    financialYear: string,
    incomeDetails: {
  gross_income: number;
  deductions: Deduction[];
}
): Promise<TaxCalculation> => {
  // Implementation would go here - replace with actual API call
  const response = await fetch('/api/tax/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      member_id: memberId,
      financial_year: financialYear,
      ...incomeDetails,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate tax');
  }

  return await response.json();
};

export const getTaxFilingStatus = async (
    memberId: string,
    financialYear: string
): Promise<TaxFilingStatus> => {
  // Implementation would go here - replace with actual API call
  const response = await fetch(`/api/tax/status?member_id=${memberId}&financial_year=${financialYear}`);

  if (!response.ok) {
    throw new Error('Failed to get tax filing status');
  }

  const data = await response.json();
  return data.status;
};

export const updateTaxFilingStatus = async (
    memberId: string,
    financialYear: string,
    status: TaxFilingStatus
): Promise<void> => {
  // Implementation would go here - replace with actual API call
  const response = await fetch('/api/tax/status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      member_id: memberId,
      financial_year: financialYear,
      status,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update tax filing status');
  }
};