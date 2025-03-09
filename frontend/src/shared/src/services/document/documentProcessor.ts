// Path: shared/src/services/document/documentProcessor.ts

import axios from 'axios';

export const extractTextFromPDF = async (documentPath: string): Promise<string> => {
    try {
        const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8083';
        const response = await axios.post(`${documentServiceUrl}/api/documents/extract-text`, { path: documentPath });

        if (!response.data.success) {
            throw new Error('Failed to extract text from PDF');
        }

        return response.data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
};
