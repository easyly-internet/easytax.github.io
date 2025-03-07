import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { OpenAI } from 'openai';
import TaxAnalysis from '../models/taxAnalysis.model';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';
import { extractTextFromPDF } from '../services/documentProcessor';
import { processIncomeSources } from '../services/incomeProcessor';
import { processDeductions } from '../services/deductionProcessor';
import { calculateTaxLiability } from '../services/taxCalculator';
import { generateRecommendations } from '../services/recommendationGenerator';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze tax documents and generate tax filing recommendations
 * @route POST /api/tax-analysis/analyze
 */
export const analyzeTaxDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, financialYear } = req.body;

    if (!memberId || !financialYear) {
      return res.status(400).json({
        success: false,
        errors: { message: ['Member ID and financial year are required'] }
      });
    }

    // Check if analysis already exists
    const existingAnalysis = await TaxAnalysis.findOne({ memberId, financialYear });
    if (existingAnalysis) {
      return res.status(200).json({
        success: true,
        message: 'Tax analysis already exists',
        data: existingAnalysis
      });
    }

    // Fetch documents from document service
    const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8083';
    const documentsResponse = await axios.get(
      `${documentServiceUrl}/api/documents/${memberId}/${financialYear}`,
      {
        headers: {
          Authorization: req.headers.authorization
        }
      }
    );

    if (!documentsResponse.data.success) {
      return res.status(400).json({
        success: false,
        errors: { message: ['Failed to fetch documents'] }
      });
    }

    const { documents, protectedDocuments } = documentsResponse.data.data;

    if ((!documents || documents.length === 0) && (!protectedDocuments || protectedDocuments.length === 0)) {
      return res.status(400).json({
        success: false,
        errors: { message: ['No documents found for analysis'] }
      });
    }

    // Extract text from documents
    const documentTexts = [];

    // Process regular documents
    for (const doc of documents || []) {
      try {
        const documentPath = doc.path;
        const text = await extractTextFromPDF(documentPath);
        documentTexts.push({ name: doc.name, text });
      } catch (error) {
        logger.error(`Error extracting text from document ${doc.name}:`, error);
      }
    }

    // We don't process protected documents here since we don't have passwords

    if (documentTexts.length === 0) {
      return res.status(400).json({
        success: false,
        errors: { message: ['Failed to extract text from documents'] }
      });
    }

    // Process income sources
    const income = await processIncomeSources(documentTexts);

    // Process deductions
    const deductions = await processDeductions(documentTexts);

    // Calculate tax liability
    const taxLiability = calculateTaxLiability(income, deductions);

    // Generate recommendations
    const recommendations = await generateRecommendations(income, deductions, taxLiability);

    // Generate summary using AI
    const summaryChatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a tax consultant helping to summarize tax analysis in simple terms.'
        },
        {
          role: 'user',
          content: `Generate a brief summary (150-200 words) of the tax analysis for financial year ${financialYear} with the following details:
            Income: ${JSON.stringify(income)}
            Deductions: ${JSON.stringify(deductions)}
            Tax Liability: ${JSON.stringify(taxLiability)}

            Focus on explaining which tax regime is better for the taxpayer and why. Use simple language.`
        }
      ],
      model: 'gpt-3.5-turbo',
    });

    const summary = summaryChatCompletion.choices[0]?.message?.content || 'Summary not available';

    // Create tax analysis
    const taxAnalysis = new TaxAnalysis({
      memberId,
      financialYear,
      income,
      deductions,
      taxLiability,
      recommendations,
      summary,
      status: 'COMPLETED',
      completedAt: new Date()
    });

    await taxAnalysis.save();

    res.status(200).json({
      success: true,
      message: 'Tax analysis completed successfully',
      data: taxAnalysis
    });
  } catch (error) {
    logger.error('Error in analyzeTaxDocuments controller:', error);
    next(error);
  }
};

/**
 * Get tax analysis by member and financial year
 * @route GET /api/tax-analysis/:memberId/:financialYear
 */
export const getTaxAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, financialYear } = req.params;

    const taxAnalysis = await TaxAnalysis.findOne({ memberId, financialYear });

    if (!taxAnalysis) {
      return res.status(404).json({
        success: false,
        errors: { message: ['Tax analysis not found'] }
      });
    }

    res.status(200).json({
      success: true,
      data: taxAnalysis
    });
  } catch (error) {
    logger.error('Error in getTaxAnalysis controller:', error);
    next(error);
  }
};

/**
 * Compare old and new tax regimes
 * @route POST /api/tax-analysis/compare-regimes
 */
export const compareRegimes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { income, deductions } = req.body;

    if (!income || !deductions) {
      return res.status(400).json({
        success: false,
        errors: { message: ['Income and deductions are required'] }
      });
    }

    // Calculate tax liability for both regimes
    const taxLiability = calculateTaxLiability(income, deductions);

    res.status(200).json({
      success: true,
      data: taxLiability
    });
  } catch (error) {
    logger.error('Error in compareRegimes controller:', error);
    next(error);
  }
};

/**
 * Estimate refund amount
 * @route POST /api/tax-analysis/estimate-refund
 */
export const estimateRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { income, deductions, taxPaid } = req.body;

    if (!income || !deductions || taxPaid === undefined) {
      return res.status(400).json({
        success: false,
        errors: { message: ['Income, deductions, and tax paid are required'] }
      });
    }

    // Calculate tax liability
    const taxLiability = calculateTaxLiability(income, deductions);

    // Calculate refund amount
    const refundAmount = Math.max(0, taxPaid - Math.min(taxLiability.oldRegime, taxLiability.newRegime));

    res.status(200).json({
      success: true,
      data: {
        taxLiability,
        taxPaid,
        refundAmount
      }
    });
  } catch (error) {
    logger.error('Error in estimateRefund controller:', error);
    next(error);
  }
};

/**
 * Ask AI tax assistant a question
 * @route POST /api/tax-analysis/ask-assistant
 */
export const askTaxAssistant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, memberId, financialYear } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        errors: { message: ['Question is required'] }
      });
    }

    // Get tax analysis if available
    let taxAnalysisContext = '';
    if (memberId && financialYear) {
      const taxAnalysis = await TaxAnalysis.findOne({ memberId, financialYear });
      if (taxAnalysis) {
        taxAnalysisContext = `Based on your tax analysis for ${financialYear}:
        - Total Income: ₹${taxAnalysis.income.total.toLocaleString('en-IN')}
        - Total Deductions: ₹${taxAnalysis.deductions.total.toLocaleString('en-IN')}
        - Tax Liability (Old Regime): ₹${taxAnalysis.taxLiability.oldRegime.toLocaleString('en-IN')}
        - Tax Liability (New Regime): ₹${taxAnalysis.taxLiability.newRegime.toLocaleString('en-IN')}
        - Recommended Regime: ${taxAnalysis.taxLiability.recommended}
        `;
      }
    }

    // Generate response using AI
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful tax assistant for Indian taxpayers. Answer questions about income tax in India in a clear, concise manner.
            Be helpful but also be honest when you don't know something. Don't make up information.
            Always cite relevant sections of the Income Tax Act when appropriate.
            ${taxAnalysisContext}`
        },
        {
          role: 'user',
          content: question
        }
      ],
      model: 'gpt-3.5-turbo',
    });

    const answer = response.choices[0]?.message?.content || 'Sorry, I could not generate an answer.';

    res.status(200).json({
      success: true,
      data: {
        question,
        answer
      }
    });
  } catch (error) {
    logger.error('Error in askTaxAssistant controller:', error);
    next(error);
  }
};