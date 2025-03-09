import { Deduction, TaxCalculation, TaxLiability } from "../../types/tax";
export declare function calculateTaxLiability(income: number, deductions: Deduction[]): Promise<TaxLiability>;
export declare enum TaxFilingStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    DOCUMENTS_REQUIRED = "DOCUMENTS_REQUIRED",
    READY_FOR_FILING = "READY_FOR_FILING",
    FILED = "FILED",
    VERIFICATION_PENDING = "VERIFICATION_PENDING",
    REFUND_INITIATED = "REFUND_INITIATED",
    COMPLETED = "COMPLETED",
    ERROR = "ERROR"
}
export declare const calculateTax: (memberId: string, financialYear: string, incomeDetails: {
    gross_income: number;
    deductions: Deduction[];
}) => Promise<TaxCalculation>;
export declare const getTaxFilingStatus: (memberId: string, financialYear: string) => Promise<TaxFilingStatus>;
export declare const updateTaxFilingStatus: (memberId: string, financialYear: string, status: TaxFilingStatus) => Promise<void>;
