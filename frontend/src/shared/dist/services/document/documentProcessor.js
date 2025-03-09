"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromPDF = void 0;
const axios_1 = __importDefault(require("axios"));
const extractTextFromPDF = async (documentPath) => {
    try {
        const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8083';
        const response = await axios_1.default.post(`${documentServiceUrl}/api/documents/extract-text`, { path: documentPath });
        if (!response.data.success) {
            throw new Error('Failed to extract text from PDF');
        }
        return response.data.text;
    }
    catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
};
exports.extractTextFromPDF = extractTextFromPDF;
//# sourceMappingURL=documentProcessor.js.map