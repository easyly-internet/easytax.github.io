// src/controllers/insights.controller.js
import mongoose from 'mongoose';

const TaxCalculationService = require('../services/taxCalculation.service');
const AIService = require('../services/ai.service');
const DocumentService = require('../services/document.service');

// Import models
const TaxAnalysis = mongoose.model('TaxAnalysis');
const Member = mongoose.model('Member');
const Document = mongoose.model('Document');

/**
 * Get tax payment trends for a member
 */
exports.getTaxTrends = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }

    // Get tax analysis for multiple years
    const taxAnalysisRecords = await TaxAnalysis.find({ memberId })
      .sort({ financialYear: 1 });
    
    if (!taxAnalysisRecords || taxAnalysisRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tax records found for this member'
      });
    }
    
    // Extract trend data
    const trends = {
      years: [],
      income: [],
      deductions: [],
      taxableIncome: [],
      taxPaid: []
    };
    
    taxAnalysisRecords.forEach(record => {
      trends.years.push(record.financialYear);
      trends.income.push(record.incomeDetails.totalIncome || 0);
      trends.deductions.push(record.deductions.totalDeductions || 0);
      trends.taxableIncome.push(record.taxLiability.taxableIncome || 0);
      trends.taxPaid.push(record.taxLiability.totalTaxPaid || 0);
    });
    
    // Calculate year-over-year changes
    const yoyChanges = calculateYoYChanges(trends);
    
    res.status(200).json({
      success: true,
      data: {
        trends,
        yoyChanges
      }
    });
  } catch (error) {
    console.error('Error retrieving tax trends:', error);
    next(error);
  }
};

/**
 * Calculate year-over-year percentage changes
 * @param {Object} trends - Trend data
 * @returns {Object} - YoY changes
 */
function calculateYoYChanges(trends) {
  const changes = {
    income: [],
    deductions: [],
    taxableIncome: [],
    taxPaid: []
  };
  
  // Calculate percentage changes for each metric
  for (let i = 1; i < trends.years.length; i++) {
    changes.income.push(calculatePercentChange(trends.income[i - 1], trends.income[i]));
    changes.deductions.push(calculatePercentChange(trends.deductions[i - 1], trends.deductions[i]));
    changes.taxableIncome.push(calculatePercentChange(trends.taxableIncome[i - 1], trends.taxableIncome[i]));
    changes.taxPaid.push(calculatePercentChange(trends.taxPaid[i - 1], trends.taxPaid[i]));
  }
  
  return changes;
}

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Previous value
 * @param {number} newValue - Current value
 * @returns {number} - Percentage change
 */
function calculatePercentChange(oldValue, newValue) {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Get income analysis for a member
 */
exports.getIncomeAnalysis = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { financialYear } = req.query;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }
    
    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year is required'
      });
    }

    // Get tax analysis for the specified year
    const taxAnalysis = await TaxAnalysis.findOne({ 
      memberId, 
      financialYear 
    });
    
    if (!taxAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'No tax records found for this member and financial year'
      });
    }
    
    // Extract income details
    const incomeDetails = taxAnalysis.incomeDetails;
    
    // Calculate income breakdown percentages
    const totalIncome = incomeDetails.totalIncome || 0;
    const breakdown = {};
    
    for (const [source, amount] of Object.entries(incomeDetails)) {
      if (source !== 'totalIncome' && typeof amount === 'number') {
        breakdown[source] = {
          amount,
          percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
        };
      }
    }
    
    // Generate insights based on income breakdown
    const insights = generateIncomeInsights(breakdown, totalIncome);
    
    res.status(200).json({
      success: true,
      data: {
        financialYear,
        totalIncome,
        breakdown,
        insights
      }
    });
  } catch (error) {
    console.error('Error retrieving income analysis:', error);
    next(error);
  }
};

/**
 * Generate insights based on income breakdown
 * @param {Object} breakdown - Income breakdown
 * @param {number} totalIncome - Total income
 * @returns {Array} - Array of insights
 */
function generateIncomeInsights(breakdown, totalIncome) {
  const insights = [];
  
  // Check income diversification
  const incomeSourceCount = Object.keys(breakdown).length;
  if (incomeSourceCount === 1) {
    insights.push({
      type: 'RISK',
      title: 'Income Diversification',
      description: 'Your income is currently from a single source. Consider diversifying income streams to reduce financial risk.'
    });
  } else if (incomeSourceCount > 3) {
    insights.push({
      type: 'POSITIVE',
      title: 'Well-Diversified Income',
      description: 'You have multiple income streams, which provides good financial stability.'
    });
  }
  
  // Check for passive income
  const passiveIncomeSources = ['interestIncome', 'rentalIncome', 'dividendIncome'];
  let totalPassiveIncome = 0;
  
  for (const source of passiveIncomeSources) {
    if (breakdown[source]) {
      totalPassiveIncome += breakdown[source].amount;
    }
  }
  
  const passiveIncomePercentage = totalIncome > 0 ? (totalPassiveIncome / totalIncome) * 100 : 0;
  
  if (passiveIncomePercentage < 10) {
    insights.push({
      type: 'SUGGESTION',
      title: 'Increase Passive Income',
      description: 'Less than 10% of your income is from passive sources. Consider investing in assets that generate passive income.'
    });
  } else if (passiveIncomePercentage > 30) {
    insights.push({
      type: 'POSITIVE',
      title: 'Strong Passive Income',
      description: 'Over 30% of your income is from passive sources, which is excellent for financial independence.'
    });
  }
  
  // Income threshold insights
  if (totalIncome > 1500000) {
    insights.push({
      type: 'INFORMATION',
      title: 'High Income Bracket',
      description: 'Your income places you in the highest tax bracket. Consider tax-efficient investment strategies.'
    });
  }
  
  return insights;
}

/**
 * Get potential deduction opportunities
 */
exports.getDeductionOpportunities = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { financialYear } = req.query;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }
    
    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year is required'
      });
    }

    // Get potential deductions
    const deductionData = await TaxCalculationService.getPotentialDeductions(
      memberId, 
      financialYear
    );
    
    // Generate deduction opportunities
    const opportunities = [];
    
    for (const [category, potential] of Object.entries(deductionData.potentialDeductions)) {
      if (potential > 0) {
        const limit = deductionData.maximumLimits[category] || 0;
        const current = deductionData.currentDeductions[category] || 0;
        
        opportunities.push({
          category,
          currentAmount: current,
          potentialAdditional: potential,
          maxLimit: limit,
          utilizationPercentage: (current / limit) * 100,
          description: getDeductionDescription(category, current, potential)
        });
      }
    }
    
    // Sort opportunities by potential tax savings (highest first)
    opportunities.sort((a, b) => b.potentialAdditional - a.potentialAdditional);
    
    res.status(200).json({
      success: true,
      data: {
        financialYear,
        opportunities
      }
    });
  } catch (error) {
    console.error('Error retrieving deduction opportunities:', error);
    next(error);
  }
};

/**
 * Get description for deduction opportunity
 * @param {string} category - Deduction category
 * @param {number} current - Current deduction amount
 * @param {number} potential - Potential additional deduction
 * @returns {string} - Description
 */
function getDeductionDescription(category, current, potential) {
  switch (category) {
    case 'section80C':
      return `You have utilized ₹${current.toLocaleString()} out of ₹1,50,000 under Section 80C. Invest an additional ₹${potential.toLocaleString()} in eligible investments like PPF, ELSS, or life insurance premiums to maximize your deduction.`;
    case 'section80D':
      return `You have claimed ₹${current.toLocaleString()} for health insurance premiums under Section 80D. You can claim up to ₹${potential.toLocaleString()} more by purchasing health insurance for yourself, spouse, children, or parents.`;
    case 'housingLoan':
      return `You have claimed ₹${current.toLocaleString()} as interest on housing loan. You can claim up to ₹${potential.toLocaleString()} more under this section.`;
    case 'educationLoan':
      return `You have claimed ₹${current.toLocaleString()} as interest on education loan. There is no limit on this deduction, so ensure you claim the entire amount of interest paid.`;
    case 'nps':
      return `You have invested ₹${current.toLocaleString()} in NPS under Section 80CCD(1B). You can invest up to ₹${potential.toLocaleString()} more to claim additional tax benefits beyond the 80C limit.`;
    default:
      return `You have utilized ₹${current.toLocaleString()} out of the available deduction. You can claim up to ₹${potential.toLocaleString()} more in this category.`;
  }
}

/**
 * Compare old and new tax regimes
 */
exports.compareTaxRegimes = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { financialYear } = req.query;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }
    
    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year is required'
      });
    }

    // Get tax analysis for the member
    const taxAnalysis = await TaxAnalysis.findOne({ 
      memberId, 
      financialYear 
    });
    
    if (!taxAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'No tax records found for this member and financial year'
      });
    }
    
    // Calculate tax under both regimes
    const oldRegimeTax = TaxCalculationService.calculateTax(
      taxAnalysis.taxLiability.taxableIncome,
      'OLD'
    );
    
    const newRegimeTax = TaxCalculationService.calculateTax(
      // For new regime, we need to add back certain deductions that are not allowed
      taxAnalysis.taxLiability.taxableIncome + estimateDisallowedDeductions(taxAnalysis.deductions),
      'NEW'
    );
    
    // Add health and education cess (4%)
    const oldRegimeTotalTax = oldRegimeTax * 1.04;
    const newRegimeTotalTax = newRegimeTax * 1.04;
    
    // Determine the beneficial regime
    const taxDifference = oldRegimeTotalTax - newRegimeTotalTax;
    const beneficialRegime = taxDifference > 0 ? 'NEW' : 'OLD';
    
    // Generate recommendations
    const recommendations = generateRegimeRecommendations(
      beneficialRegime,
      Math.abs(taxDifference),
      taxAnalysis
    );
    
    res.status(200).json({
      success: true,
      data: {
        financialYear,
        oldRegime: {
          taxableIncome: taxAnalysis.taxLiability.taxableIncome,
          calculatedTax: oldRegimeTax,
          healthAndEducationCess: oldRegimeTax * 0.04,
          totalTaxLiability: oldRegimeTotalTax
        },
        newRegime: {
          taxableIncome: taxAnalysis.taxLiability.taxableIncome + estimateDisallowedDeductions(taxAnalysis.deductions),
          calculatedTax: newRegimeTax,
          healthAndEducationCess: newRegimeTax * 0.04,
          totalTaxLiability: newRegimeTotalTax
        },
        taxDifference: Math.abs(taxDifference),
        beneficialRegime,
        recommendations
      }
    });
  } catch (error) {
    console.error('Error comparing tax regimes:', error);
    next(error);
  }
};

/**
 * Estimate disallowed deductions in the new tax regime
 * @param {Object} deductions - Deduction amounts
 * @returns {number} - Total disallowed deductions
 */
function estimateDisallowedDeductions(deductions) {
  // Deductions not allowed in the new regime
  const disallowedCategories = [
    'section80C', 
    'housingLoan',
    'lta',
    'hra',
    'section80TTA',
    'standardDeduction'
  ];
  
  let totalDisallowed = 0;
  
  for (const category of disallowedCategories) {
    if (deductions[category]) {
      totalDisallowed += deductions[category];
    }
  }
  
  return totalDisallowed;
}

/**
 * Generate recommendations for tax regime selection
 * @param {string} beneficialRegime - More beneficial regime
 * @param {number} taxDifference - Tax difference amount
 * @param {Object} taxAnalysis - Tax analysis data
 * @returns {Array} - Array of recommendations
 */
function generateRegimeRecommendations(beneficialRegime, taxDifference, taxAnalysis) {
  const recommendations = [];
  
  if (beneficialRegime === 'OLD') {
    recommendations.push({
      title: 'Old Tax Regime is Beneficial',
      description: `Based on your income and deductions, the old tax regime is more beneficial, saving you approximately ₹${taxDifference.toLocaleString()} in taxes.`,
      action: 'Continue with the old tax regime and maximize your eligible deductions.'
    });
    
    // Check if there are unused deduction opportunities
    const deductions = taxAnalysis.deductions;
    const section80CLimit = 150000;
    const section80DLimit = 25000;
    
    if ((deductions.section80C || 0) < section80CLimit) {
      const potential = section80CLimit - (deductions.section80C || 0);
      recommendations.push({
        title: 'Maximize Section 80C Deductions',
        description: `You can invest an additional ₹${potential.toLocaleString()} under Section 80C to further reduce your tax liability.`,
        action: 'Consider investing in PPF, ELSS mutual funds, or paying life insurance premiums.'
      });
    }
    
    if ((deductions.section80D || 0) < section80DLimit) {
      const potential = section80DLimit - (deductions.section80D || 0);
      recommendations.push({
        title: 'Health Insurance Premium Deduction',
        description: `You can claim an additional ₹${potential.toLocaleString()} under Section 80D for health insurance premiums.`,
        action: 'Consider purchasing health insurance for yourself or your family members.'
      });
    }
  } else {
    recommendations.push({
      title: 'New Tax Regime is Beneficial',
      description: `Based on your income and deductions, the new tax regime is more beneficial, saving you approximately ₹${taxDifference.toLocaleString()} in taxes.`,
      action: 'Consider switching to the new tax regime for this financial year.'
    });
    
    recommendations.push({
      title: 'Simplified Tax Compliance',
      description: 'The new tax regime offers simplified tax compliance with fewer deductions and exemptions to track.',
      action: 'When filing your tax return, select the new tax regime option.'
    });
    
    // If the difference is small, suggest an alternative strategy
    if (taxDifference < 10000) {
      recommendations.push({
        title: 'Consider Long-Term Benefits',
        description: `The tax savings of ₹${taxDifference.toLocaleString()} is relatively small. Consider if the investment benefits of the old regime might be more valuable in the long run.`,
        action: 'Evaluate your long-term financial goals before deciding.'
      });
    }
  }
  
  return recommendations;
}

/**
 * Generate tax planning report with AI insights
 */
exports.generateAITaxPlan = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { financialYear } = req.query;
    
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }
    
    // Get member details
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Get tax analysis data
    const taxAnalysisData = await TaxAnalysis.findOne({ 
      memberId, 
      financialYear: financialYear || getCurrentFinancialYear() 
    });
    
    // Get uploaded documents
    const documents = await Document.find({ 
      memberId,
      financialYear: financialYear || getCurrentFinancialYear()
    });
    
    // Extract financial data from documents if tax analysis is missing
    let financialData = {};
    if (!taxAnalysisData && documents.length > 0) {
      // Process Form 16 and other documents to extract financial data
      financialData = await DocumentService.extractFinancialData(documents);
    }
    
    // Use AI service to generate personalized tax insights
    const taxPlan = await AIService.generateTaxPlan({
      member,
      taxAnalysis: taxAnalysisData,
      extractedData: financialData,
      documents
    });
    
    res.status(200).json({
      success: true,
      data: taxPlan
    });
  } catch (error) {
    console.error('Error generating AI tax plan:', error);
    next(error);
  }
};

/**
 * Get the current financial year (e.g., "2023-2024")
 * @returns {string} - Current financial year
 */
function getCurrentFinancialYear() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // January is 0
  const currentYear = today.getFullYear();
  
  // In India, financial year starts from April 1
  if (currentMonth >= 4) { // April onwards
    return `${currentYear}-${currentYear + 1}`;
  } else { // January to March
    return `${currentYear - 1}-${currentYear}`;
  }
}

/**
 * Analyze form 16 and extract key information
 */
exports.analyzeForm16 = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    // Get document details
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if document is Form 16
    if (!document.name.toLowerCase().includes('form16') && 
        !document.name.toLowerCase().includes('form 16')) {
      return res.status(400).json({
        success: false,
        message: 'Document is not a Form 16'
      });
    }
    
    // Extract data from Form 16
    const form16Data = await DocumentService.extractForm16Data(document);
    
    // Generate insights based on Form 16 data
    const insights = await AIService.generateForm16Insights(form16Data);
    
    res.status(200).json({
      success: true,
      data: {
        form16Data,
        insights
      }
    });
  } catch (error) {
    console.error('Error analyzing Form 16:', error);
    next(error);
  }
};

/**
 * Dashboard summary with insights for all members
 */
exports.getDashboardInsights = async (req, res, next) => {
  try {
    // Get count of members
    const totalMembers = await Member.countDocuments();
    
    // Get active tax filings for current financial year
    const currentFinancialYear = getCurrentFinancialYear();
    const activeFilings = await TaxAnalysis.countDocuments({
      financialYear: currentFinancialYear,
      'taxLiability.filingStatus': { $ne: 'COMPLETED' }
    });
    
    // Get total pending refunds
    const pendingRefundAnalysis = await TaxAnalysis.find({
      'taxLiability.refundStatus': 'PENDING'
    });
    
    const totalPendingRefunds = pendingRefundAnalysis.reduce(
      (total, record) => total + (record.taxLiability.refundAmount || 0), 
      0
    );
    
    // Get top tax saving opportunities
    const taxSavingOpportunities = await aggregateTaxSavingOpportunities();
    
    // Get regime preference statistics
    const regimeStats = await aggregateRegimePreferences();
    
    res.status(200).json({
      success: true,
      data: {
        memberStats: {
          total: totalMembers,
          activeFilings,
          pendingRefunds: pendingRefundAnalysis.length,
          totalPendingRefundsAmount: totalPendingRefunds
        },
        taxSavingOpportunities,
        regimePreferences: regimeStats,
        currentFinancialYear
      }
    });
  } catch (error) {
    console.error('Error getting dashboard insights:', error);
    next(error);
  }
};

/**
 * Aggregate tax saving opportunities across all members
 * @returns {Array} - Aggregated tax saving opportunities
 */
async function aggregateTaxSavingOpportunities() {
  // This would typically involve a complex aggregation pipeline
  // Simplified version for illustration
  const opportunities = [
    {
      category: 'section80C',
      title: 'Section 80C Investments',
      potentialSavings: 46800,
      affectedMembers: 120,
      description: 'Investments in PPF, ELSS, life insurance premiums, etc.'
    },
    {
      category: 'section80D',
      title: 'Health Insurance Premiums',
      potentialSavings: 15600,
      affectedMembers: 85,
      description: 'Health insurance for self, spouse, children, and parents'
    },
    {
      category: 'housingLoan',
      title: 'Housing Loan Interest',
      potentialSavings: 60000,
      affectedMembers: 45,
      description: 'Interest paid on housing loans'
    },
    {
      category: 'nps',
      title: 'National Pension Scheme',
      potentialSavings: 15600,
      affectedMembers: 70,
      description: 'Additional contribution to NPS under Section 80CCD(1B)'
    }
  ];
  
  // Sort by potential savings * affected members (overall impact)
  return opportunities.sort((a, b) => 
    (b.potentialSavings * b.affectedMembers) - (a.potentialSavings * a.affectedMembers)
  );
}

/**
 * Aggregate tax regime preferences across all members
 * @returns {Object} - Regime preference statistics
 */
async function aggregateRegimePreferences() {
  // This would typically involve a database aggregation
  // Simplified version for illustration
  return {
    oldRegime: 65, // Percentage of members benefiting from old regime
    newRegime: 35, // Percentage of members benefiting from new regime
    averageSavings: {
      oldRegime: 18500,
      newRegime: 12800
    }
  };
}

module.exports = exports;