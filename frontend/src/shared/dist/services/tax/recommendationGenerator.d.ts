import { TaxLiability } from "./taxCalculator";
import { IncomeSource } from "./incomeProcessor";
import { Deduction } from "../../types/tax";
export interface Recommendation {
    id: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
export declare const generateRecommendations: (income: IncomeSource[], deductions: Deduction[], taxLiability: TaxLiability) => Promise<Recommendation[]>;
