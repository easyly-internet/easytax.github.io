import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { OpenAI } from 'openai';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';

import documentExtractor from './utils/documentExtractor';
import { TaxRules } from './utils/taxRules';
import { authenticate } from './middleware/auth.middleware';
import errorHandler from './middleware/error.middleware';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase for document storage
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 8003;

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: function (req, file, cb) {
      cb(null, `${uuidv4()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept PDFs and images
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF or image files.'));
    }
  },
});

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Analyze document for tax filing
 */
app.post('/api/analyze-document', authenticate, upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document provided'
      });
    }

    const filePath = req.file.path;
    const userId = req.user.id;
    const documentType = req.body.documentType || 'unknown';
    const financialYear = req.body.financialYear || `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;

    // Extract text from document
    console.info(`Extracting text from ${documentType} document`);
    const extractedText = await documentExtractor.extractText(filePath, req.file.mimetype);

    // Analyze document with OpenAI
    console.info('Analyzing document with AI');
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert tax assistant analyzing financial documents for tax filing in India.
          Extract key information about income, deductions, investments, and other tax-relevant data.
          Format the response as JSON with the following structure:
          {
            "documentType": "Form16|InvestmentProof|BankStatement|Other",
            "incomeDetails": { "salary": number, "interest": number, "rental": number, "business": number, "capital": number, "other": number },
            "deductionDetails": { "80C": number, "80D": number, "80G": number, "others": {} },
            "taxPaid": { "tds": number, "advanceTax": number },
            "summary": "Brief summary of findings",
            "taxableIncome": number,
            "taxLiability": number,
            "recommendations": ["Specific tax saving recommendations based on this document"]
          }`
        },
        {
          role: "user",
          content: `Document type: ${documentType}\nExtracted text from the document:\n${extractedText}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content);

    // Calculate tax liability using tax rules
    const taxCalculator = new TaxRules(financialYear);
    const calculatedTaxLiability = taxCalculator.calculateTaxLiability({
      salary: analysisResult.incomeDetails.salary || 0,
      interest: analysisResult.incomeDetails.interest || 0,
      rental: analysisResult.incomeDetails.rental || 0,
      business: analysisResult.incomeDetails.business || 0,
      capital: analysisResult.incomeDetails.capital || 0,
      other: analysisResult.incomeDetails.other || 0
    }, {
      '80C': analysisResult.deductionDetails['80C'] || 0,
      '80D': analysisResult.deductionDetails['80D'] || 0,
      '80G': analysisResult.deductionDetails['80G'] || 0,
      'others': analysisResult.deductionDetails.others || {}
    });

    // Store document in Supabase
    const fileContent = fs.readFileSync(filePath);
    const filePath2 = `${userId}/${financialYear}/${documentType}-${Date.now()}.${req.file.originalname.split('.').pop()}`;

    const { data, error } = await supabase.storage
      .from('tax-documents')
      .upload(filePath2, fileContent, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Error storing document:', error);
      throw new Error('Error storing document');
    }

    // Store analysis in database
    await supabase.from('document_analyses')
      .insert({
        user_id: userId,
        document_path: filePath2,
        document_type: documentType,
        financial_year: financialYear,
        analysis_result: analysisResult,
        calculated_tax_liability: calculatedTaxLiability
      });

    // Clean up temp file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      data: {
        documentType: analysisResult.documentType,
        income: Object.values(analysisResult.incomeDetails).reduce((sum, val) => sum + (val || 0), 0),
        deductions: Object.values(analysisResult.deductionDetails)
          .filter(val => typeof val === 'number')
          .reduce((sum, val) => sum + (val || 0), 0),
        taxPaid: Object.values(analysisResult.taxPaid).reduce((sum, val) => sum + (val || 0), 0),
        taxableIncome: analysisResult.taxableIncome || 0,
        taxLiability: calculatedTaxLiability,
        summary: analysisResult.summary,
        recommendations: analysisResult.recommendations,
        documentPath: filePath2
      }
    });
  } catch (error) {
    console.error('Error analyzing document:', error);
    // Clean up temp file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * Get AI tax advice
 */
app.post('/api/tax-advice', authenticate, async (req, res, next) => {
  try {
    const { query, context } = req.body;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'No query provided'
      });
    }

    // Get user's document analyses for context
    let userContext = '';
    if (context) {
      userContext = `Financial context: ${JSON.stringify(context)}`;
    } else {
      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data.length > 0) {
        userContext = `Financial context from your documents: ${JSON.stringify(data.map(d => d.analysis_result))}`;
      }
    }

    // Generate advice with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert tax advisor in India. Provide clear, accurate advice on tax planning,
          filing, and optimization strategies based on Indian tax laws. Refer to the user's financial context
          when available, but provide general advice if specifics are not provided. Always clarify that
          your advice is informational and users should consult with a CA for final decisions.`
        },
        {
          role: "user",
          content: `${userContext}\n\nMy question is: ${query}`
        }
      ]
    });

    // Store interaction in database
    await supabase.from('ai_interactions')
      .insert({
        user_id: userId,
        query: query,
        response: completion.choices[0].message.content,
        context: context || null
      });

    res.status(200).json({
      success: true,
      data: {
        advice: completion.choices[0].message.content,
        source: 'ai-tax-assistant'
      }
    });
  } catch (error) {
    console.error('Error getting tax advice:', error);
    next(error);
  }
});

/**
 * Generate tax filing summary
 */
app.post('/api/tax-summary', authenticate, async (req, res, next) => {
  try {
    const { financialYear } = req.body;
    const userId = req.user.id;

    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year not provided'
      });
    }

    // Get all user document analyses for this financial year
    const { data, error } = await supabase
      .from('document_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('financial_year', financialYear);

    if (error) {
      throw new Error('Error fetching document analyses');
    }

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tax documents found for this financial year'
      });
    }

    // Aggregate data from all documents
    const aggregatedData = {
      income: {
        salary: 0,
        interest: 0,
        rental: 0,
        business: 0,
        capital: 0,
        other: 0
      },
      deductions: {
        '80C': 0,
        '80D': 0,
        '80G': 0,
        others: {}
      },
      taxPaid: {
        tds: 0,
        advanceTax: 0
      },
      documents: []
    };

    data.forEach(doc => {
      const result = doc.analysis_result;

      // Aggregate income
      Object.keys(result.incomeDetails).forEach(key => {
        if (aggregatedData.income[key] !== undefined) {
          aggregatedData.income[key] += (result.incomeDetails[key] || 0);
        }
      });

      // Aggregate deductions
      Object.keys(result.deductionDetails).forEach(key => {
        if (key !== 'others') {
          if (aggregatedData.deductions[key] !== undefined) {
            aggregatedData.deductions[key] += (result.deductionDetails[key] || 0);
          }
        } else if (result.deductionDetails.others) {
          Object.keys(result.deductionDetails.others).forEach(otherKey => {
            if (!aggregatedData.deductions.others[otherKey]) {
              aggregatedData.deductions.others[otherKey] = 0;
            }
            aggregatedData.deductions.others[otherKey] += result.deductionDetails.others[otherKey];
          });
        }
      });

      // Aggregate tax paid
      Object.keys(result.taxPaid).forEach(key => {
        if (aggregatedData.taxPaid[key] !== undefined) {
          aggregatedData.taxPaid[key] += (result.taxPaid[key] || 0);
        }
      });

      // Add document summary
      aggregatedData.documents.push({
        type: result.documentType,
        summary: result.summary
      });
    });

    // Calculate total income and deductions
    const totalIncome = Object.values(aggregatedData.income).reduce((sum, val) => sum + val, 0);
    const totalDeductions =
      Object.entries(aggregatedData.deductions)
        .filter(([key]) => key !== 'others')
        .reduce((sum, [_, val]) => sum + Number(val), 0) +
      Object.values(aggregatedData.deductions.others).reduce((sum, val) => sum + Number(val), 0);

    // Calculate tax liability
    const taxCalculator = new TaxRules(financialYear);
    const taxLiability = taxCalculator.calculateTaxLiability(
      aggregatedData.income,
      aggregatedData.deductions
    );

    // Calculate tax to be paid or refund
    const totalTaxPaid = Object.values(aggregatedData.taxPaid).reduce((sum, val) => sum + val, 0);
    const remainingTax = taxLiability - totalTaxPaid;

    // Generate AI insights
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert tax advisor. Based on the financial data provided, offer 3-5 specific
          tax optimization recommendations for Indian tax filing. Focus on legitimate ways to reduce tax
          liability, eligible deductions that may be overlooked, and proper documentation requirements.`
        },
        {
          role: "user",
          content: `Financial year: ${financialYear}
          Total income: ${totalIncome}
          Income breakdown: ${JSON.stringify(aggregatedData.income)}
          Current deductions: ${JSON.stringify(aggregatedData.deductions)}
          Calculated tax liability: ${taxLiability}
          Tax already paid: ${totalTaxPaid}`
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        financialYear,
        totalIncome,
        totalDeductions,
        taxableIncome: totalIncome - totalDeductions,
        taxLiability,
        taxPaid: totalTaxPaid,
        remainingTaxOrRefund: remainingTax,
        isRefund: remainingTax < 0,
        incomeBreakdown: aggregatedData.income,
        deductionBreakdown: aggregatedData.deductions,
        documents: aggregatedData.documents,
        insights: completion.choices[0].message.content
      }
    });
  } catch (error) {
    console.error('Error generating tax summary:', error);
    next(error);
  }
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.info(`AI Tax Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// src/utils/taxRules.ts
export class TaxRules {
  private financialYear: string;
  private oldRegimeLimits: { limit: number; rate: number }[];
  private newRegimeLimits: { limit: number; rate: number }[];
  private standardDeduction: number;
  private maxSection80C: number;
  private maxSection80D: number;

  constructor(financialYear: string) {
    this.financialYear = financialYear;

    // Set tax slabs based on financial year
    if (financialYear === '2023-2024') {
      // Old regime
      this.oldRegimeLimits = [
        { limit: 250000, rate: 0 },
        { limit: 500000, rate: 0.05 },
        { limit: 1000000, rate: 0.2 },
        { limit: Infinity, rate: 0.3 }
      ];

      // New regime (Budget 2023)
      this.newRegimeLimits = [
        { limit: 300000, rate: 0 },
        { limit: 600000, rate: 0.05 },
        { limit: 900000, rate: 0.1 },
        { limit: 1200000, rate: 0.15 },
        { limit: 1500000, rate: 0.2 },
        { limit: Infinity, rate: 0.3 }
      ];

      this.standardDeduction = 50000;
      this.maxSection80C = 150000;
      this.maxSection80D = 25000; // Basic, increases for senior citizens
    } else {
      // Default to 2022-2023 rules or other years
      this.oldRegimeLimits = [
        { limit: 250000, rate: 0 },
        { limit: 500000, rate: 0.05 },
        { limit: 1000000, rate: 0.2 },
        { limit: Infinity, rate: 0.3 }
      ];

      this.newRegimeLimits = [
        { limit: 250000, rate: 0 },
        { limit: 500000, rate: 0.05 },
        { limit: 750000, rate: 0.1 },
        { limit: 1000000, rate: 0.15 },
        { limit: 1250000, rate: 0.2 },
        { limit: 1500000, rate: 0.25 },
        { limit: Infinity, rate: 0.3 }
      ];

      this.standardDeduction = 50000;
      this.maxSection80C = 150000;
      this.maxSection80D = 25000;
    }
  }

  /**
   * Calculate taxable income after deductions
   */
  private calculateTaxableIncome(
    income: {
      salary: number;
      interest: number;
      rental: number;
      business: number;
      capital: number;
      other: number
    },
    deductions: {
      '80C': number;
      '80D': number;
      '80G': number;
      'others': Record<string, number>;
    },
    useNewRegime: boolean = false
  ): number {
    // Compute gross total income
    const grossIncome =
      income.salary +
      income.interest +
      income.rental +
      income.business +
      income.capital +
      income.other;

    if (useNewRegime) {
      // New regime has fewer deductions
      return Math.max(0, grossIncome - this.standardDeduction);
    } else {
      // Apply standard deduction to salary income
      let taxableIncome = grossIncome;

      // Apply standard deduction to salary
      if (income.salary > 0) {
        taxableIncome -= this.standardDeduction;
      }

      // Apply Section 80C deduction (up to max)
      taxableIncome -= Math.min(deductions['80C'] || 0, this.maxSection80C);

      // Apply Section 80D deduction (up to max)
      taxableIncome -= Math.min(deductions['80D'] || 0, this.maxSection80D);

      // Apply Section 80G deduction
      taxableIncome -= (deductions['80G'] || 0);

      // Apply other deductions
      Object.values(deductions.others || {}).forEach(amount => {
        taxableIncome -= amount;
      });

      return Math.max(0, taxableIncome);
    }
  }

  /**
   * Calculate tax based on tax slabs
   */
  private calculateTaxFromSlabs(
    taxableIncome: number,
    slabs: { limit: number; rate: number }[]
  ): number {
    let remainingIncome = taxableIncome;
    let tax = 0;
    let prevLimit = 0;

    for (const slab of slabs) {
      const taxableAmountInSlab = Math.min(
        Math.max(0, remainingIncome),
        slab.limit - prevLimit
      );

      tax += taxableAmountInSlab * slab.rate;
      remainingIncome -= taxableAmountInSlab;
      prevLimit = slab.limit;

      if (remainingIncome <= 0) break;
    }

    // Add cess (4%)
    tax += tax * 0.04;

    return tax;
  }

  /**
   * Calculate tax liability
   */
  public calculateTaxLiability(
    income: {
      salary: number;
      interest: number;
      rental: number;
      business: number;
      capital: number;
      other: number
    },
    deductions: {
      '80C': number;
      '80D': number;
      '80G': number;
      'others': Record<string, number>;
    }
  ): number {
    // Calculate taxable income for both regimes
    const oldRegimeTaxableIncome = this.calculateTaxableIncome(income, deductions, false);
    const newRegimeTaxableIncome = this.calculateTaxableIncome(income, deductions, true);

    // Calculate tax for both regimes
    const oldRegimeTax = this.calculateTaxFromSlabs(oldRegimeTaxableIncome, this.oldRegimeLimits);
    const newRegimeTax = this.calculateTaxFromSlabs(newRegimeTaxableIncome, this.newRegimeLimits);

    // Return the lower tax (more beneficial to taxpayer)
    return Math.min(oldRegimeTax, newRegimeTax);
  }
}