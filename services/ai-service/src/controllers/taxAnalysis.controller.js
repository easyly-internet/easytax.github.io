// src/controllers/taxAnalysis.controller.js
import mongoose from 'mongoose';
import DocumentService from '../../../shared/src/services/document.service';
import AIService from '../../../shared/src/services/ai.service';
import TaxCalculationService from '../../../shared/src/services/taxCalculation.service';


/**
 * Upload tax documents for analysis
 */
exports.uploadDocuments = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded'
      });
    }

    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }

    // Process the uploaded files
    const uploadedFiles = Array.isArray(req.files.documents) 
      ? req.files.documents 
      : [req.files.documents];
    
    const documentUploadResults = await DocumentService.uploadMultipleDocuments(
      memberId,
      uploadedFiles,
      'TAX_DOCUMENTS'
    );

    res.status(200).json({
      success: true,
      data: {
        uploadedDocuments: documentUploadResults,
        message: 'Documents uploaded successfully'
      }
    });
  } catch (error) {
    console.error('Error uploading tax documents:', error);
    next(error);
  }
};

/**
 * Analyze uploaded tax documents
 */
exports.analyzeDocuments = async (req, res, next) => {
  try {
    const { memberId, financialYear } = req.body;
    
    if (!memberId || !financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Member ID and financial year are required'
      });
    }

    // Get the member's documents
    const documents = await DocumentService.getMemberDocuments(memberId, financialYear);
    
    if (!documents || documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No documents found for analysis'
      });
    }

    // Send documents to AI service for analysis
    const analysisResults = await AIService.analyzeTaxDocuments(documents);
    
    // Save analysis results
    await TaxCalculationService.saveTaxAnalysis(memberId, financialYear, analysisResults);

    res.status(200).json({
      success: true,
      data: {
        analysisId: analysisResults.analysisId,
        message: 'Documents analyzed successfully'
      }
    });
  } catch (error) {
    console.error('Error analyzing tax documents:', error);
    next(error);
  }
};

/**
 * Get tax analysis summary for a member
 */
exports.getTaxSummary = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { financialYear } = req.query;
    
    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year is required'
      });
    }

    const taxSummary = await TaxCalculationService.getTaxSummary(memberId, financialYear);
    
    if (!taxSummary) {
      return res.status(404).json({
        success: false,
        message: 'Tax summary not found'
      });
    }

    res.status(200).json({
      success: true,
      data: taxSummary
    });
  } catch (error) {
    console.error('Error retrieving tax summary:', error);
    next(error);
  }
};

/**
 * Get potential deductions for a member
 */
exports.getPotentialDeductions = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { financialYear } = req.query;
    
    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year is required'
      });
    }

    const deductions = await TaxCalculationService.getPotentialDeductions(memberId, financialYear);
    
    res.status(200).json({
      success: true,
      data: deductions
    });
  } catch (error) {
    console.error('Error retrieving potential deductions:', error);
    next(error);
  }
};

/**
 * Get tax saving recommendations
 */
exports.getTaxRecommendations = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { financialYear } = req.query;
    
    if (!financialYear) {
      return res.status(400).json({
        success: false,
        message: 'Financial year is required'
      });
    }

    const recommendations = await AIService.getTaxSavingRecommendations(memberId, financialYear);
    
    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error retrieving tax recommendations:', error);
    next(error);
  }
};

/**
 * Simulate tax calculations with what-if scenarios
 */
exports.simulateTaxScenarios = async (req, res, next) => {
  try {
    const { memberId, financialYear, scenarios } = req.body;
    
    if (!memberId || !financialYear || !scenarios) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: memberId, financialYear, scenarios'
      });
    }

    const simulationResults = await TaxCalculationService.simulateScenarios(
      memberId, 
      financialYear, 
      scenarios
    );
    
    res.status(200).json({
      success: true,
      data: simulationResults
    });
  } catch (error) {
    console.error('Error simulating tax scenarios:', error);
    next(error);
  }
};