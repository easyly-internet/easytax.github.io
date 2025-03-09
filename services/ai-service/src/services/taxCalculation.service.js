// src/services/taxCalculation.service.js
import mongoose from 'mongoose';


// This would typically be imported from a models directory
const TaxAnalysis = mongoose.model('TaxAnalysis', new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Member'
  },
  financialYear: {
    type: String,
    required: true
  },
  incomeDetails: {
    salary: Number,
    interestIncome: Number,
    rentalIncome: Number,
    businessIncome: Number,
    capitalGains: Number,
    otherIncome: Number,
    totalIncome: Number
  },
  deductions: {
    section80C: Number,
    section80D: Number,
    housingLoan: Number,
    educationLoan: Number,
    nps: Number,
    donations: Number,
    otherDeductions: Number,
    totalDeductions: Number
  },
  taxLiability: {
    taxableIncome: Number,
    calculatedTax: Number,
    surcharge: Number,
    healthAndEducationCess: Number,
    totalTaxLiability: Number,
    tdsDeducted: Number,
    advanceTaxPaid: Number,
    selfAssessmentTaxPaid: Number,
    totalTaxPaid: Number,
    taxRefund: Number,
    taxDue: Number
  },
  regimeUsed: {
    type: String,
    enum: ['OLD', 'NEW'],
    default: 'OLD'
  },
  recommendations: [{
    category: String,
    title: String,
    description: String,
    potentialSavings: Number,
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}));

/**
 * Tax Calculation Service for processing tax data and calculations
 */
class TaxCalculationService {
  /**
   * Save tax analysis results to the database
   * @param {string} memberId - Member ID
   * @param {string} financialYear - Financial year
   * @param {Object} analysisResults - Tax analysis results
   * @returns {Promise<Object>} - Saved tax analysis record
   */
  async saveTaxAnalysis(memberId, financialYear, analysisResults) {
    try {
      // Check if analysis already exists for this member and year
      let taxAnalysis = await TaxAnalysis.findOne({ 
        memberId, 
        financialYear 
      });
      
      if (taxAnalysis) {
        // Update existing analysis
        taxAnalysis.incomeDetails = analysisResults.incomeDetails;
        taxAnalysis.deductions = analysisResults.deductions;
        taxAnalysis.taxLiability = analysisResults.taxLiability;
        taxAnalysis.updatedAt = Date.now();
      } else {
        // Create new analysis
        taxAnalysis = new TaxAnalysis({
          memberId,
          financialYear,
          incomeDetails: analysisResults.incomeDetails,
          deductions: analysisResults.deductions,
          taxLiability: analysisResults.taxLiability
        });
      }
      
      await taxAnalysis.save();
      console.info(`Tax analysis saved for member ${memberId} for FY ${financialYear}`);
      
      return taxAnalysis;
    } catch (error) {
      console.error('Error saving tax analysis:', error);
      throw new Error('Failed to save tax analysis');
    }
  }

  /**
   * Get tax summary for a member
   * @param {string} memberId - Member ID
   * @param {string} financialYear - Financial year
   * @returns {Promise<Object>} - Tax summary
   */
  async getTaxSummary(memberId, financialYear) {
    try {
      const taxAnalysis = await TaxAnalysis.findOne({ 
        memberId, 
        financialYear 
      });
      
      if (!taxAnalysis) {
        console.warn(`No tax analysis found for member ${memberId} for FY ${financialYear}`);
        return null;
      }
      
      return {
        incomeDetails: taxAnalysis.incomeDetails,
        deductions: taxAnalysis.deductions,
        taxLiability: taxAnalysis.taxLiability,
        regimeUsed: taxAnalysis.regimeUsed
      };
    } catch (error) {
      console.error('Error retrieving tax summary:', error);
      throw new Error('Failed to retrieve tax summary');
    }
  }

  /**
   * Get potential deductions for a member
   * @param {string} memberId - Member ID
   * @param {string} financialYear - Financial year
   * @returns {Promise<Object>} - Potential deductions
   */
  async getPotentialDeductions(memberId, financialYear) {
    try {
      const taxAnalysis = await TaxAnalysis.findOne({ 
        memberId, 
        financialYear 
      });
      
      if (!taxAnalysis) {
        console.warn(`No tax analysis found for member ${memberId} for FY ${financialYear}`);
        return {
          potentialDeductions: {},
          maximumLimits: this.getDeductionLimits(),
          currentDeductions: {}
        };
      }
      
      const deductionLimits = this.getDeductionLimits();
      const potentialDeductions = {};
      
      // Calculate potential additional deductions
      for (const [key, limit] of Object.entries(deductionLimits)) {
        const current = taxAnalysis.deductions[key] || 0;
        if (current < limit) {
          potentialDeductions[key] = limit - current;
        } else {
          potentialDeductions[key] = 0;
        }
      }
      
      return {
        potentialDeductions,
        maximumLimits: deductionLimits,
        currentDeductions: taxAnalysis.deductions
      };
    } catch (error) {
      console.error('Error calculating potential deductions:', error);
      throw new Error('Failed to calculate potential deductions');
    }
  }

  /**
   * Get deduction limits for the current financial year
   * @returns {Object} - Deduction limits
   */
  getDeductionLimits() {
    // These would typically come from a configuration or database
    return {
      section80C: 150000,
      section80D: 25000, // For individuals below 60 years
      housingLoan: 200000, // Interest on housing loan for self-occupied property
      educationLoan: Infinity, // No limit on education loan interest
      nps: 50000 // Additional deduction under 80CCD(1B)
    };
  }

  /**
   * Simulate tax scenarios
   * @param {string} memberId - Member ID
   * @param {string} financialYear - Financial year
   * @param {Array} scenarios - Array of tax scenarios to simulate
   * @returns {Promise<Object>} - Simulation results
   */
  async simulateScenarios(memberId, financialYear, scenarios) {
    try {
      // Get current tax analysis
      const taxAnalysis = await TaxAnalysis.findOne({ 
        memberId, 
        financialYear 
      });
      
      if (!taxAnalysis) {
        throw new Error(`No tax analysis found for member ${memberId} for FY ${financialYear}`);
      }
      
      // Process each scenario
      const results = {
        baseScenario: {
          taxableIncome: taxAnalysis.taxLiability.taxableIncome,
          totalTaxLiability: taxAnalysis.taxLiability.totalTaxLiability
        },
        scenarios: []
      };
      
      for (const scenario of scenarios) {
        const simulatedResult = this.calculateScenarioTax(taxAnalysis, scenario);
        results.scenarios.push({
          scenarioName: scenario.name,
          changes: scenario.changes,
          taxableIncome: simulatedResult.taxableIncome,
          totalTaxLiability: simulatedResult.totalTaxLiability,
          savings: results.baseScenario.totalTaxLiability - simulatedResult.totalTaxLiability
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error simulating tax scenarios:', error);
      throw new Error('Failed to simulate tax scenarios');
    }
  }

  /**
   * Calculate taxes for a specific scenario
   * @param {Object} taxAnalysis - Current tax analysis
   * @param {Object} scenario - Scenario to simulate
   * @returns {Object} - Simulated tax calculations
   */
  calculateScenarioTax(taxAnalysis, scenario) {
    // Create a deep copy of the current analysis
    const simulation = JSON.parse(JSON.stringify(taxAnalysis));
    
    // Apply changes from the scenario
    for (const change of scenario.changes) {
      if (change.type === 'INCOME') {
        if (simulation.incomeDetails[change.category] !== undefined) {
          simulation.incomeDetails[change.category] = change.value;
        }
      } else if (change.type === 'DEDUCTION') {
        if (simulation.deductions[change.category] !== undefined) {
          simulation.deductions[change.category] = change.value;
        }
      }
    }
    
    // Recalculate total income
    simulation.incomeDetails.totalIncome = Object.values(simulation.incomeDetails)
      .filter(val => typeof val === 'number' && val !== simulation.incomeDetails.totalIncome)
      .reduce((sum, val) => sum + val, 0);
    
    // Recalculate total deductions
    simulation.deductions.totalDeductions = Object.values(simulation.deductions)
      .filter(val => typeof val === 'number' && val !== simulation.deductions.totalDeductions)
      .reduce((sum, val) => sum + val, 0);
    
    // Recalculate taxable income
    simulation.taxLiability.taxableIncome = 
      simulation.incomeDetails.totalIncome - simulation.deductions.totalDeductions;
    
    // Recalculate tax
    simulation.taxLiability.calculatedTax = 
      this.calculateTax(simulation.taxLiability.taxableIncome, simulation.regimeUsed);
    
    // Add cess
    simulation.taxLiability.healthAndEducationCess = 
      simulation.taxLiability.calculatedTax * 0.04;
    
    // Calculate total tax liability
    simulation.taxLiability.totalTaxLiability = 
      simulation.taxLiability.calculatedTax + simulation.taxLiability.healthAndEducationCess;
    
    return {
      taxableIncome: simulation.taxLiability.taxableIncome,
      totalTaxLiability: simulation.taxLiability.totalTaxLiability
    };
  }

  /**
   * Calculate tax based on income and tax regime
   * @param {number} taxableIncome - Taxable income
   * @param {string} regime - Tax regime ('OLD' or 'NEW')
   * @returns {number} - Calculated tax amount
   */
  calculateTax(taxableIncome, regime = 'OLD') {
    if (regime === 'NEW') {
      // New tax regime calculation (2023-24)
      if (taxableIncome <= 300000) {
        return 0;
      } else if (taxableIncome <= 600000) {
        return (taxableIncome - 300000) * 0.05;
      } else if (taxableIncome <= 900000) {
        return 15000 + (taxableIncome - 600000) * 0.1;
      } else if (taxableIncome <= 1200000) {
        return 45000 + (taxableIncome - 900000) * 0.15;
      } else if (taxableIncome <= 1500000) {
        return 90000 + (taxableIncome - 1200000) * 0.2;
      } else {
        return 150000 + (taxableIncome - 1500000) * 0.3;
      }
    } else {
      // Old tax regime calculation (2023-24)
      if (taxableIncome <= 250000) {
        return 0;
      } else if (taxableIncome <= 500000) {
        return (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        return 12500 + (taxableIncome - 500000) * 0.2;
      } else {
        return 112500 + (taxableIncome - 1000000) * 0.3;
      }
    }
  }
}