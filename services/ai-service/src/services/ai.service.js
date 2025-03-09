// src/services/ai.service.js
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import path from 'path';
import documentService from './document.service';

/**
 * AI Service for tax document analysis and recommendations
 */
class AIService {
  constructor() {
    // Initialize OpenAI client if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const configuration = new Configuration({ apiKey });
      this.openai = new OpenAIApi(configuration);
    } else {
      console.warn('OpenAI API key not found. AI features will be limited.');
    }
  }

  /**
   * Analyze tax documents using OpenAI
   * @param {Array} documents - Array of document objects
   * @returns {Promise<Object>} - Analysis results
   */
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

      // Process each document
      for (const document of documents) {
        // Get document content
        const content = await documentService.getDocumentContent(document.id);
        
        // Extract text from document (PDF/image)
        const extractedText = await this.extractTextFromDocument(content, document.mimeType);
        
        // Classify document type
        const documentType = await this.classifyDocumentType(extractedText);
        
        // Extract relevant data based on document type
        const extractedData = await this.extractRelevantData(extractedText, documentType);
        
        // Update analysis results
        this.updateAnalysisResults(results, extractedData, documentType);
        
        // Update document metadata with classification
        await documentService.updateDocumentMetadata(document.id, {
          documentType,
          analysisStatus: 'COMPLETED',
          analysisTimestamp: new Date()
        });
      }

      // Calculate aggregated values
      this.calculateAggregatedValues(results);
      
      console.info('Document analysis completed successfully');
      return results;
    } catch (error) {
      console.error('Error analyzing tax documents:', error);
      throw new Error('Failed to analyze tax documents');
    }
  }

  /**
   * Extract text from document
   * @param {Buffer} content - Document content as buffer
   * @param {string} mimeType - Document MIME type
   * @returns {Promise<string>} - Extracted text
   */
  async extractTextFromDocument(content, mimeType) {
    // Implementation would depend on the document type
    // For PDFs, you might use a library like pdf-parse
    // For images, you might use OCR via Tesseract or a cloud service
    
    // Simplified implementation
    if (mimeType.includes('pdf')) {
      // Use pdf-parse or similar
      return "Extracted text from PDF";
    } else if (mimeType.includes('image')) {
      // Use OCR
      return "Extracted text from image";
    } else {
      // Assume text
      return content.toString('utf-8');
    }
  }

  /**
   * Classify document type using AI
   * @param {string} text - Document text
   * @returns {Promise<string>} - Document type
   */
  async classifyDocumentType(text) {
    if (!this.openai) {
      // Fallback classification logic if OpenAI is not available
      if (text.includes('Form 16') || text.includes('TDS')) {
        return 'FORM_16';
      } else if (text.includes('Form 26AS')) {
        return 'FORM_26AS';
      } else if (text.includes('investment') || text.includes('80C')) {
        return 'INVESTMENT_PROOF';
      } else {
        return 'OTHER';
      }
    }

    // Use OpenAI for classification
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

  /**
   * Extract relevant data based on document type
   * @param {string} text - Document text
   * @param {string} documentType - Document type
   * @returns {Promise<Object>} - Extracted data
   */
  async extractRelevantData(text, documentType) {
    // Implementation would depend on the document type
    // Simplified version
    const extractedData = {
      documentType,
      fields: {}
    };

    switch (documentType) {
      case 'FORM_16':
        // Extract fields from Form 16
        extractedData.fields = this.extractForm16Data(text);
        break;
      case 'FORM_26AS':
        // Extract fields from Form 26AS
        extractedData.fields = this.extractForm26ASData(text);
        break;
      case 'INVESTMENT_PROOF':
        // Extract investment details
        extractedData.fields = this.extractInvestmentData(text);
        break;
      // Add more document types as needed
      default:
        // Generic extraction
        extractedData.fields = {};
    }

    return extractedData;
  }

  /**
   * Extract data from Form 16
   * @param {string} text - Document text
   * @returns {Object} - Extracted fields
   */
  extractForm16Data(text) {
    // Implementation would use regex or NLP to extract Form 16 fields
    // Simplified implementation
    return {
      grossSalary: this.extractNumber(text, /gross salary.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
      totalDeduction: this.extractNumber(text, /total deduction.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
      taxableIncome: this.extractNumber(text, /taxable income.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
      taxPaid: this.extractNumber(text, /tax paid.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
    };
  }

  /**
   * Extract data from Form 26AS
   * @param {string} text - Document text
   * @returns {Object} - Extracted fields
   */
  extractForm26ASData(text) {
    // Implementation for Form 26AS
    return {
      tdsDeducted: this.extractNumber(text, /tds deducted.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
      taxCollected: this.extractNumber(text, /tax collected.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
    };
  }

  /**
   * Extract investment data
   * @param {string} text - Document text
   * @returns {Object} - Extracted fields
   */
  extractInvestmentData(text) {
    // Implementation for investment proofs
    return {
      investmentType: this.extractText(text, /type.*?:?\\s*([A-Za-z0-9\\s]+)/i),
      investmentAmount: this.extractNumber(text, /amount.*?(?:Rs|INR)[.\\s]*([\\d,]+)/i),
    };
  }

  /**
   * Extract number using regex
   * @param {string} text - Text to search in
   * @param {RegExp} regex - Regular expression with capture group
   * @returns {number|null} - Extracted number or null
   */
  extractNumber(text, regex) {
    const match = text.match(regex);
    if (match && match[1]) {
      // Remove commas and convert to number
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Extract text using regex
   * @param {string} text - Text to search in
   * @param {RegExp} regex - Regular expression with capture group
   * @returns {string|null} - Extracted text or null
   */
  extractText(text, regex) {
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Update analysis results with extracted data
   * @param {Object} results - Analysis results object to update
   * @param {Object} extractedData - Extracted data from document
   * @param {string} documentType - Document type
   */
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

  /**
   * Calculate aggregated values in analysis results
   * @param {Object} results - Analysis results object to update
   */
  calculateAggregatedValues(results) {
    // Calculate total income
    results.incomeDetails.totalIncome = Object.values(results.incomeDetails).reduce((total, val) => total + val, 0);
    
    // Calculate total deductions
    results.deductions.totalDeductions = Object.values(results.deductions).reduce((total, val) => total + val, 0);
    
    // Calculate taxable income
    results.taxLiability.taxableIncome = results.incomeDetails.totalIncome - results.deductions.totalDeductions;
    
    // Tax calculation would depend on tax slabs and rules
    // Simplified calculation
    results.taxLiability.calculatedTax = this.calculateTax(results.taxLiability.taxableIncome);
    
    // Calculate refund/due
    results.taxLiability.taxRefund = Math.max(0, results.taxLiability.tdsDeducted - results.taxLiability.calculatedTax);
    results.taxLiability.taxDue = Math.max(0, results.taxLiability.calculatedTax - results.taxLiability.tdsDeducted);
  }

  /**
   * Calculate tax based on income (simplified)
   * @param {number} taxableIncome - Taxable income
   * @returns {number} - Calculated tax
   */
  calculateTax(taxableIncome) {
    // Simplified tax calculation based on 2023-24 old regime
    if (taxableIncome <= 250000) {
      return 0;
    } else if (taxableIncome <= 500000) {
      return (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 750000) {
      return 12500 + (taxableIncome - 500000) * 0.1;
    } else if (taxableIncome <= 1000000) {
      return 37500 + (taxableIncome - 750000) * 0.15;
    } else if (taxableIncome <= 1250000) {
      return 75000 + (taxableIncome - 1000000) * 0.2;
    } else if (taxableIncome <= 1500000) {
      return 125000 + (taxableIncome - 1250000) * 0.25;
    } else {
      return 187500 + (taxableIncome - 1500000) * 0.3;
    }
  }

  /**
   * Get tax saving recommendations
   * @param {string} memberId - Member ID
   * @param {string} financialYear - Financial year
   * @returns {Promise<Array>} - Array of recommendations
   */
  async getTaxSavingRecommendations(memberId, financialYear) {
    try {
      // Get tax summary for the member
      const taxSummary = await this.getTaxSummary(memberId, financialYear);
      
      // Generate recommendations based on the tax summary
      const recommendations = [];
      
      // Check for section 80C deductions
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
      
      // More recommendations based on tax data
      // ...
      
      return recommendations;
    } catch (error) {
      console.error('Error generating tax recommendations:', error);
      throw new Error('Failed to generate tax recommendations');
    }
  }

  /**
   * Calculate potential tax savings
   * @param {number} taxableIncome - Current taxable income
   * @param {number} additionalDeduction - Additional deduction amount
   * @returns {number} - Potential tax savings
   */
  calculateTaxSavings(taxableIncome, additionalDeduction) {
    const currentTax = this.calculateTax(taxableIncome);
    const reducedTax = this.calculateTax(taxableIncome - additionalDeduction);
    return Math.max(0, currentTax - reducedTax);
  }
}

module.exports = new AIService();