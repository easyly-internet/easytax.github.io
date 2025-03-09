import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { OpenAI } from 'openai';
import TaxAnalysis from '../../../shared/src/models/taxAnalysis.model';

import { createError } from '../../../shared/src/utils/error';
import { extractTextFromPDF } from '../../../shared/src/services/document/documentProcessor';
import { processIncomeSources } from '../../../shared/src/services/tax/incomeProcessor';
import { processDeductions } from '../../../shared/src/services/tax/deductionProcessor';
import { calculateTaxLiability } from '../../../shared/src/services/tax/taxCalculator';
import { generateRecommendations } from '../../../shared/src/services/tax/recommendationGenerator';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyze tax documents and generate tax filing recommendations
 * @route POST /api/tax-analysis/analyze
 */
export const analyzeTaxDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, financialYear } = req.body;
    if (!memberId || !financialYear) {
      return res.status(400).json({ success: false, errors: { message: ['Member ID and financial year are required'] } });
    }

    const existingAnalysis = await TaxAnalysis.findOne({ memberId, financialYear });
    if (existingAnalysis) {
      return res.status(200).json({ success: true, message: 'Tax analysis already exists', data: existingAnalysis });
    }

    const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:8083';
    const documentsResponse = await axios.get(`${documentServiceUrl}/api/documents/${memberId}/${financialYear}`, {
      headers: { Authorization: req.headers.authorization }
    });

    if (!documentsResponse.data.success) {
      return res.status(400).json({ success: false, errors: { message: ['Failed to fetch documents'] } });
    }

    const { documents, protectedDocuments } = documentsResponse.data.data;
    if ((!documents || documents.length === 0) && (!protectedDocuments || protectedDocuments.length === 0)) {
      return res.status(400).json({ success: false, errors: { message: ['No documents found for analysis'] } });
    }

    const documentTexts = [];
    for (const doc of documents || []) {
      try {
        const text = await extractTextFromPDF(doc.path);
        documentTexts.push({ name: doc.name, text });
      } catch (error) {
        console.error(`Error extracting text from document ${doc.name}:`, error);
      }
    }

    if (documentTexts.length === 0) {
      return res.status(400).json({ success: false, errors: { message: ['Failed to extract text from documents'] } });
    }

    const income = await processIncomeSources(documentTexts);
    const documentTextsOnly = documentTexts.map(doc => doc.text);
    const deductionsRaw = await processDeductions(documentTextsOnly);
    const deductions = deductionsRaw.map(d => ({
      ...d,
      section: d.section || 'Unknown'
    }));
    const taxLiability = await calculateTaxLiability(income, deductions);
    const recommendations = await generateRecommendations(income, deductions, taxLiability);

    const summaryChatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a tax consultant helping to summarize tax analysis in simple terms.' },
        { role: 'user', content: `Generate a summary for ${financialYear}: Income: ${JSON.stringify(income)}, Deductions: ${JSON.stringify(deductions)}, Tax Liability: ${JSON.stringify(taxLiability)}` }
      ]
    });
    const summary = summaryChatCompletion.choices[0]?.message?.content || 'Summary not available';

    const taxAnalysis = new TaxAnalysis({
      memberId, financialYear, income, deductions, taxLiability, recommendations, summary, status: 'COMPLETED', completedAt: new Date()
    });
    await taxAnalysis.save();

    res.status(200).json({ success: true, message: 'Tax analysis completed successfully', data: taxAnalysis });
  } catch (error) {
    console.error('Error in analyzeTaxDocuments:', error);
    next(error);
  }
};

/**
 * Get tax analysis by member and financial year
 * @route GET /api/tax-analysis/:memberId/:financialYear
 */
export const getTaxAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taxAnalysis = await TaxAnalysis.findOne(req.params);
    if (!taxAnalysis) {
      return res.status(404).json({ success: false, errors: { message: ['Tax analysis not found'] } });
    }
    res.status(200).json({ success: true, data: taxAnalysis });
  } catch (error) {
    console.error('Error in getTaxAnalysis:', error);
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
      return res.status(400).json({ success: false, errors: { message: ['Income and deductions are required'] } });
    }
    res.status(200).json({ success: true, data: calculateTaxLiability(income, deductions) });
  } catch (error) {
    console.error('Error in compareRegimes:', error);
    next(error);
  }
};
//
// /**
//  * Estimate refund amount
//  * @route POST /api/tax-analysis/estimate-refund
//  */
// export const estimateRefund = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { income, deductions, taxPaid } = req.body;
//     if (!income || !deductions || taxPaid === undefined) {
//       return res.status(400).json({ success: false, errors: { message: ['Income, deductions, and tax paid are required'] } });
//     }
//     const taxLiability = calculateTaxLiability(income, deductions);
//     res.status(200).json({ success: true, data: { taxLiability, taxPaid, refundAmount: Math.max(0, taxPaid - Math.min(taxLiability.oldRegime, taxLiability.newRegime)) } });
//   } catch (error) {
//     console.error('Error in estimateRefund:', error);
//     next(error);
//   }
// };
