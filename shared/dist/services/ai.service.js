"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("openai");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const documentService_1 = __importDefault(require("./document/documentService"));
class AIService {
    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            const configuration = new openai_1.Configuration({ apiKey });
            this.openai = new openai_1.OpenAIApi(configuration);
        }
        else {
            console.warn('OpenAI API key not found. AI features will be limited.');
        }
    }
    async analyzeTaxDocuments(documents) {
        try {
            console.info(`Analyzing ${documents.length} tax documents`);
            const results = {
                analysisId: Date.now().toString(),
                incomeDetails: {},
                deductions: {},
                taxLiability: {},
                timestamp: new Date()
            };
            for (const document of documents) {
                const content = await documentService_1.default.getDocumentContent(document.id);
                const extractedText = await this.extractTextFromDocument(content, document.mimeType);
                const documentType = await this.classifyDocumentType(extractedText);
                const extractedData = await this.extractRelevantData(extractedText, documentType);
                this.updateAnalysisResults(results, extractedData, documentType);
                await documentService_1.default.updateDocumentMetadata(document.id, {
                    documentType,
                    analysisStatus: 'COMPLETED',
                    analysisTimestamp: new Date()
                });
            }
            this.calculateAggregatedValues(results);
            console.info('Document analysis completed successfully');
            return results;
        }
        catch (error) {
            console.error('Error analyzing tax documents:', error);
            throw new Error('Failed to analyze tax documents');
        }
    }
    async extractTextFromDocument(content, mimeType) {
        if (mimeType.includes('pdf')) {
            return "Extracted text from PDF";
        }
        else if (mimeType.includes('image')) {
            return "Extracted text from image";
        }
        else {
            return content.toString('utf-8');
        }
    }
    async classifyDocumentType(text) {
        if (!this.openai) {
            if (text.includes('Form 16') || text.includes('TDS')) {
                return 'FORM_16';
            }
            else if (text.includes('Form 26AS')) {
                return 'FORM_26AS';
            }
            else if (text.includes('investment') || text.includes('80C')) {
                return 'INVESTMENT_PROOF';
            }
            else {
                return 'OTHER';
            }
        }
        const prompt = `Classify the following tax document text into one of these categories: 
    FORM_16, FORM_26AS, INVESTMENT_PROOF, BANK_STATEMENT, RENT_RECEIPT, OTHER.
    
    Document text:
    ${text.substring(0, 1000)}...
    
    Document type:`;
        const response = await this.openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 50,
            temperature: 0.3,
        });
        const documentType = response.data.choices[0].text.trim();
        return documentType;
    }
    async extractRelevantData(text, documentType) {
        const extractedData = {
            documentType,
            fields: {}
        };
        switch (documentType) {
            case 'FORM_16':
                extractedData.fields = this.extractForm16Data(text);
                break;
            case 'FORM_26AS':
                extractedData.fields = this.extractForm26ASData(text);
                break;
            case 'INVESTMENT_PROOF':
                extractedData.fields = this.extractInvestmentData(text);
                break;
            default:
                extractedData.fields = {};
        }
        return extractedData;
    }
    extractForm16Data(text) {
        return {
            grossSalary: this.extractNumber(text, /gross salary.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
            totalDeduction: this.extractNumber(text, /total deduction.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
            taxableIncome: this.extractNumber(text, /taxable income.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
            taxPaid: this.extractNumber(text, /tax paid.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
        };
    }
    extractForm26ASData(text) {
        return {
            tdsDeducted: this.extractNumber(text, /tds deducted.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
            taxCollected: this.extractNumber(text, /tax collected.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
        };
    }
    extractInvestmentData(text) {
        return {
            investmentType: this.extractText(text, /type.*?:?\\s*([A-Za-z0-9\\s]+)/i),
            investmentAmount: this.extractNumber(text, /amount.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
        };
    }
    extractNumber(text, regex) {
        const match = text.match(regex);
        if (match && match[1]) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
        return null;
    }
    extractText(text, regex) {
        const match = text.match(regex);
        if (match && match[1]) {
            return match[1].trim();
        }
        return null;
    }
    updateAnalysisResults(results, extractedData, documentType) {
        switch (documentType) {
            case 'FORM_16':
                results.incomeDetails.salary = extractedData.fields.grossSalary || 0;
                results.taxLiability.taxPaid = extractedData.fields.taxPaid || 0;
                break;
            case 'FORM_26AS':
                results.taxLiability.tdsDeducted = extractedData.fields.tdsDeducted || 0;
                break;
            case 'INVESTMENT_PROOF':
                const type = extractedData.fields.investmentType || 'Other';
                const amount = extractedData.fields.investmentAmount || 0;
                if (!results.deductions[type]) {
                    results.deductions[type] = 0;
                }
                results.deductions[type] += amount;
                break;
        }
    }
    calculateAggregatedValues(results) {
        results.incomeDetails.totalIncome = Object.values(results.incomeDetails).reduce((total, val) => total + val, 0);
        results.deductions.totalDeductions = Object.values(results.deductions).reduce((total, val) => total + val, 0);
        results.taxLiability.taxableIncome = results.incomeDetails.totalIncome - results.deductions.totalDeductions;
        results.taxLiability.calculatedTax = this.calculateTax(results.taxLiability.taxableIncome);
        results.taxLiability.taxRefund = Math.max(0, results.taxLiability.tdsDeducted - results.taxLiability.calculatedTax);
        results.taxLiability.taxDue = Math.max(0, results.taxLiability.calculatedTax - results.taxLiability.tdsDeducted);
    }
    calculateTax(taxableIncome) {
        if (taxableIncome <= 250000) {
            return 0;
        }
        else if (taxableIncome <= 500000) {
            return (taxableIncome - 250000) * 0.05;
        }
        else if (taxableIncome <= 750000) {
            return 12500 + (taxableIncome - 500000) * 0.1;
        }
        else if (taxableIncome <= 1000000) {
            return 37500 + (taxableIncome - 750000) * 0.15;
        }
        else if (taxableIncome <= 1250000) {
            return 75000 + (taxableIncome - 1000000) * 0.2;
        }
        else if (taxableIncome <= 1500000) {
            return 125000 + (taxableIncome - 1250000) * 0.25;
        }
        else {
            return 187500 + (taxableIncome - 1500000) * 0.3;
        }
    }
    async getTaxSavingRecommendations(memberId, financialYear) {
        try {
            const taxSummary = await this.getTaxSummary(memberId, financialYear);
            const recommendations = [];
            const section80CDeductions = taxSummary.deductions.section80C || 0;
            const maxSection80CLimit = 150000;
            if (section80CDeductions < maxSection80CLimit) {
                recommendations.push({
                    category: 'SECTION_80C',
                    title: 'Maximize Section 80C Deductions',
                    description: `You have utilized ₹${section80CDeductions.toLocaleString()} out of ₹${maxSection80CLimit.toLocaleString()} under Section 80C. Consider investing ₹${(maxSection80CLimit - section80CDeductions).toLocaleString()} more in tax-saving instruments like PPF, ELSS, or NPS to maximize your deductions.`,
                    potentialSavings: this.calculateTaxSavings(taxSummary.taxLiability.taxableIncome, maxSection80CLimit - section80CDeductions),
                    priority: 'HIGH'
                });
            }
            return recommendations;
        }
        catch (error) {
            console.error('Error generating tax recommendations:', error);
            throw new Error('Failed to generate tax recommendations');
        }
    }
    calculateTaxSavings(taxableIncome, additionalDeduction) {
        const currentTax = this.calculateTax(taxableIncome);
        const reducedTax = this.calculateTax(taxableIncome - additionalDeduction);
        return Math.max(0, currentTax - reducedTax);
    }
}
module.exports = new AIService();
//# sourceMappingURL=ai.service.js.map