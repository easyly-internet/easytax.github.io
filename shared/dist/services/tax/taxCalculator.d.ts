import { IncomeSource } from "./incomeProcessor";
import { Deduction } from "../../types/tax";
export interface TaxLiability {
    oldRegime: number;
    newRegime: number;
    recommended: 'OLD' | 'NEW';
}
export declare const calculateTaxLiability: (income: IncomeSource[], deductions: Deduction[]) => Promise<TaxLiability>;
