// src/controllers/documentProcessing.controller.js

const AIService = require('../../../shared/src/services/ai.service');
const DocumentService = require('../../../shared/src/services/document.service');

/**
 * Extract text from document
 */
exports.extractText = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    // Get document content
    const document = await DocumentService.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const content = await DocumentService.getDocumentContent(documentId);
    
    // Extract text using AI service
    const extractedText = await AIService.extractTextFromDocument(
      content, 
      document.mimeType
    );
    
    // Update document metadata with extracted text
    await DocumentService.updateDocumentMetadata(documentId, {
      textExtracted: true,
      textExtractionTimestamp: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: {
        documentId,
        extractedText
      }
    });
  } catch (error) {
    console.error('Error extracting text from document:', error);
    next(error);
  }
};

/**
 * Classify document type
 */
exports.classifyDocument = async (req, res, next) => {
  try {
    const { documentId, text } = req.body;
    
    if ((!documentId && !text) || (documentId && text)) {
      return res.status(400).json({
        success: false,
        message: 'Either document ID or text must be provided, but not both'
      });
    }

    let documentText = text;
    let documentMetadata = null;
    
    // If document ID is provided, get the document content
    if (documentId) {
      const document = await DocumentService.getDocumentById(documentId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      const content = await DocumentService.getDocumentContent(documentId);
      documentText = await AIService.extractTextFromDocument(
        content, 
        document.mimeType
      );
      documentMetadata = document;
    }
    
    // Classify document using AI service
    const documentType = await AIService.classifyDocumentType(documentText);
    
    // Update document metadata if document ID was provided
    if (documentId && documentMetadata) {
      await DocumentService.updateDocumentMetadata(documentId, {
        documentType,
        classificationTimestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        documentId: documentId || null,
        documentType
      }
    });
  } catch (error) {
    console.error('Error classifying document:', error);
    next(error);
  }
};

/**
 * Extract specific fields from a document
 */
exports.extractFields = async (req, res, next) => {
  try {
    const { documentId, documentType, fields } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Document type is required'
      });
    }

    // Get document content
    const document = await DocumentService.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const content = await DocumentService.getDocumentContent(documentId);
    
    // Extract text if not already available
    const documentText = await AIService.extractTextFromDocument(
      content, 
      document.mimeType
    );
    
    // Extract fields using AI service
    const extractedData = await AIService.extractRelevantData(
      documentText, 
      documentType,
      fields // Optional specific fields to extract
    );
    
    // Update document metadata with extracted data
    await DocumentService.updateDocumentMetadata(documentId, {
      fieldsExtracted: true,
      fieldsExtractionTimestamp: new Date(),
      extractedFields: extractedData.fields
    });
    
    res.status(200).json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    console.error('Error extracting fields from document:', error);
    next(error);
  }
};

/**
 * Validate document data
 */
exports.validateDocument = async (req, res, next) => {
  try {
    const { documentId, validationRules } = req.body;
    
    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    // Get document and its metadata
    const document = await DocumentService.getDocumentById(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if fields have been extracted
    if (!document.metadata || !document.metadata.extractedFields) {
      return res.status(400).json({
        success: false,
        message: 'Document fields must be extracted before validation'
      });
    }
    
    // Perform validation
    const validationResults = {
      isValid: true,
      fieldResults: {}
    };
    
    const fields = document.metadata.extractedFields;
    
    // Apply validation rules if provided, otherwise use default rules based on document type
    const rules = validationRules || getDefaultValidationRules(document.metadata.documentType);
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = fields[field];
      const result = validateField(value, rule);
      
      validationResults.fieldResults[field] = result;
      
      if (!result.isValid) {
        validationResults.isValid = false;
      }
    }
    
    // Update document metadata with validation results
    await DocumentService.updateDocumentMetadata(documentId, {
      validated: true,
      validationTimestamp: new Date(),
      validationResults
    });
    
    res.status(200).json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('Error validating document:', error);
    next(error);
  }
};

/**
 * Get default validation rules based on document type
 * @param {string} documentType - Document type
 * @returns {Object} - Validation rules
 */
function getDefaultValidationRules(documentType) {
  switch (documentType) {
    case 'FORM_16':
      return {
        grossSalary: { required: true, min: 0 },
        totalDeduction: { required: true, min: 0 },
        taxableIncome: { required: true, min: 0 },
        taxPaid: { required: true, min: 0 }
      };
    case 'FORM_26AS':
      return {
        tdsDeducted: { required: true, min: 0 },
        taxCollected: { required: true, min: 0 }
      };
    case 'INVESTMENT_PROOF':
      return {
        investmentType: { required: true },
        investmentAmount: { required: true, min: 0 }
      };
    default:
      return {};
  }
}

/**
 * Validate a field value against a rule
 * @param {any} value - Field value
 * @param {Object} rule - Validation rule
 * @returns {Object} - Validation result
 */
function validateField(value, rule) {
  const result = {
    isValid: true,
    errors: []
  };
  
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    result.isValid = false;
    result.errors.push('Field is required');
  }
  
  // Skip further validation if value is not present
  if (value === undefined || value === null || value === '') {
    return result;
  }
  
  // Check min value for numbers
  if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
    result.isValid = false;
    result.errors.push(`Value must be at least ${rule.min}`);
  }
  
  // Check max value for numbers
  if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
    result.isValid = false;
    result.errors.push(`Value must be at most ${rule.max}`);
  }
  
  // Check min length for strings
  if (rule.minLength !== undefined && typeof value === 'string' && value.length < rule.minLength) {
    result.isValid = false;
    result.errors.push(`Length must be at least ${rule.minLength}`);
  }
  
  // Check max length for strings
  if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
    result.isValid = false;
    result.errors.push(`Length must be at most ${rule.maxLength}`);
  }
  
  // Check regex pattern for strings
  if (rule.pattern && typeof value === 'string') {
    const regex = new RegExp(rule.pattern);
    if (!regex.test(value)) {
      result.isValid = false;
      result.errors.push('Value does not match required pattern');
    }
  }
  
  return result;
}