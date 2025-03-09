// Path: shared/src/services/document/incomeProcessor.ts

import axios from 'axios';

export interface IncomeSource {
    id: string;
    type: string;
    amount: number;
    description?: string;
}

export const processIncomeSources = async (documentTexts: { name: string; text: string }[]): Promise<IncomeSource[]> => {
    try {
        const response = await axios.post(`${process.env.ANALYSIS_SERVICE_URL}/api/income/process`, { documents: documentTexts });

        if (!response.data.success) {
            throw new Error('Failed to process income sources');
        }

        return response.data.income;
    } catch (error) {
        console.error('Error processing income sources:', error);
        throw error;
    }
};
