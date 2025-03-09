// Path: shared/src/services/document/taxCalculator.ts

import axios from 'axios';
import {IncomeSource} from "./incomeProcessor";
import {Deduction} from "../../types/tax";

export interface TaxLiability {
    oldRegime: number;
    newRegime: number;
    recommended: 'OLD' | 'NEW';
}

export const calculateTaxLiability = async (income: IncomeSource[], deductions: Deduction[]): Promise<TaxLiability> => {
    try {
        const response = await axios.post(`${process.env.ANALYSIS_SERVICE_URL}/api/tax/calculate`, { income, deductions });

        if (!response.data.success) {
            throw new Error('Failed to calculate tax liability');
        }

        return response.data.taxLiability;
    } catch (error) {
        console.error('Error calculating tax liability:', error);
        throw error;
    }
};
