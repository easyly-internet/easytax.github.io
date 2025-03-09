// Path: shared/src/services/document/recommendationGenerator.ts

import axios from 'axios';
import {TaxLiability} from "./taxCalculator";

import {IncomeSource} from "./incomeProcessor";
import {Deduction} from "../../types/tax";


export interface Recommendation {
    id: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const generateRecommendations = async (
    income: IncomeSource[],
    deductions: Deduction[],
    taxLiability: TaxLiability
): Promise<Recommendation[]> => {
    try {
        const response = await axios.post(`${process.env.ANALYSIS_SERVICE_URL}/api/recommendations/generate`, { income, deductions, taxLiability });

        if (!response.data.success) {
            throw new Error('Failed to generate recommendations');
        }

        return response.data.recommendations;
    } catch (error) {
        console.error('Error generating recommendations:', error);
        throw error;
    }
};
