export interface Deduction {
    name: string;
    amount: number;
    section?: string;
}
export interface TaxCalculation {
    id: string;
    member_id: string;
    financial_year: string;
    gross_income: number;
    deductions: Deduction[];
    taxable_income: number;
    tax_payable: number;
    tax_paid: number;
    tax_refund: number;
    created_at?: string;
    updated_at?: string;
}
export interface TaxLiability {
    oldRegime: number;
    newRegime: number;
    recommended: string;
}
