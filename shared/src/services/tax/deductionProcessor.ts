// Path: shared/src/services/document/deductionProcessor.ts


// export const processDeductions = async (documentTexts: { name: string; text: string }[]): Promise<Deduction[]> => {
//     try {
//         const response = await axios.post(`${process.env.ANALYSIS_SERVICE_URL}/api/deductions/process`, { documents: documentTexts });
//
//         if (!response.data.success) {
//             throw new Error('Failed to process deductions');
//         }
//
//         return response.data.deductions;
//     } catch (error) {
//         console.error('Error processing deductions:', error);
//         throw error;
//     }
// };

import {Deduction} from "../../types/tax";

export async function processDeductions(texts: string[]): Promise<Deduction[]> {
    return texts.map(text => ({
        name: text,
        amount: Math.random() * 1000,
        section: 'Unknown' // Assign a default value
    }));
}