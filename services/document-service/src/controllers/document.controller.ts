// src/controllers/document.controller.js
import mongoose from 'mongoose';
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const DocumentService = require('../../../shared/src/services/document.service');
const AIService = require('../../../shared/src/services/ai.service');
import '../models/index';

// Import models
const Document = mongoose.model('Document');
const Member = mongoose.model('Member');

/**
 * Get all documents for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const query = {};
    
    // If user is not admin, show only their documents
    if (!req.user.isAdmin) {
      query.userId = req.user._id;
    }
    
    // Get total count
    const total = await Document.countDocuments(query);
    
    // Get documents with pagination
    const documents = await Document.find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('memberId', 'name panNumber')
      .populate('userId', 'name email');
    
    res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    next(error);
  }
};

/**
 * Get a specific document by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id)
      .populate('memberId', 'name panNumber')
      .populate('userId', 'name email');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user has access to this document
    if (!req.user.isAdmin && document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this document'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error(`Error fetching document ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Upload a new document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    // Document upload is handled by multer middleware
    // which adds the file to req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const { memberId, documentType, financialYear, description } = req.body;
    
    // Validate member exists
    const member = await Member.findById(memberId);
    if (!member) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Create document record in database
    const document = await Document.create({
      name: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      documentType,
      financialYear,
      description,
      memberId,
      userId: req.user._id,
      uploadDate: new Date()
    });
    
    // If document is tax-related, try to extract data using AI
    if (['FORM16', 'FORM26AS', 'ITRV', 'TAXPAID', 'INVESTMENT_PROOF'].includes(documentType)) {
      // Process document asynchronously
      DocumentService.processDocument(document._id)
        .catch(err => console.error(`Error processing document ${document._id}:`, err));
    }
    
    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Delete uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    next(error);
  }
};

/**
 * Update document metadata
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documentType, description, financialYear } = req.body;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user has permission to update this document
    if (!req.user.isAdmin && document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this document'
      });
    }
    
    // Update document
    document.documentType = documentType || document.documentType;
    document.description = description || document.description;
    document.financialYear = financialYear || document.financialYear;
    document.lastModified = new Date();
    
    await document.save();
    
    res.status(200).json({
      success: true,
      data: document,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error(`Error updating document ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Delete a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user has permission to delete this document
    if (!req.user.isAdmin && document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this document'
      });
    }
    
    // Delete file from storage
    try {
      fs.unlinkSync(document.filePath);
    } catch (err) {
      console.warn(`Could not delete file for document ${id}:`, err);
    }
    
    // Delete document from database
    await Document.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error(`Error deleting document ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Get all documents for a specific member
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getMemberDocuments = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { financialYear } = req.query;
    
    // Validate member exists
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Check if user has access to this member's documents
    if (!req.user.isAdmin && member.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this member\'s documents'
      });
    }
    
    // Build query
    const query = { memberId };
    
    // Add financial year filter if provided
    if (financialYear) {
      query.financialYear = financialYear;
    }
    
    // Get documents
    const documents = await Document.find(query)
      .sort({ uploadDate: -1 })
      .populate('userId', 'name email');
    
    // Group documents by type
    const groupedDocuments = documents.reduce((groups, document) => {
      const type = document.documentType;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(document);
      return groups;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        member: {
          id: member._id,
          name: member.name,
          panNumber: member.panNumber
        },
        documents: groupedDocuments,
        totalDocuments: documents.length
      }
    });
  } catch (error) {
    console.error(`Error fetching documents for member ${req.params.memberId}:`, error);
    next(error);
  }
};

/**
 * Get list of document types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDocumentTypes = async (req, res, next) => {
  try {
    const documentTypes = [
      { code: 'FORM16', name: 'Form 16', description: 'Annual salary and tax statement from employer' },
      { code: 'FORM26AS', name: 'Form 26AS', description: 'Tax credit statement from income tax department' },
      { code: 'ITRV', name: 'ITR-V', description: 'Income tax return verification form' },
      { code: 'TAXPAID', name: 'Tax Payment Proof', description: 'Proof of tax payments' },
      { code: 'INVESTMENT_PROOF', name: 'Investment Proof', description: 'Proof of investments for tax savings' },
      { code: 'BANK_STATEMENT', name: 'Bank Statement', description: 'Bank account statement' },
      { code: 'IDENTITY_PROOF', name: 'Identity Proof', description: 'Government issued identity proof' },
      { code: 'PAN_CARD', name: 'PAN Card', description: 'Permanent Account Number card' },
      { code: 'AADHAAR_CARD', name: 'Aadhaar Card', description: 'Aadhaar identification card' },
      { code: 'RENT_RECEIPT', name: 'Rent Receipt', description: 'Receipts for rent paid' },
      { code: 'INSURANCE_POLICY', name: 'Insurance Policy', description: 'Insurance policy documents' },
      { code: 'OTHER', name: 'Other', description: 'Other supporting documents' }
    ];
    
    res.status(200).json({
      success: true,
      data: documentTypes
    });
  } catch (error) {
    console.error('Error fetching document types:', error);
    next(error);
  }
};

/**
 * Analyze a document using AI to extract data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.analyzeDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user has access to this document
    if (!req.user.isAdmin && document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to analyze this document'
      });
    }
    
    // Process document with AI
    const analysisResult = await DocumentService.processDocument(id, true);
    
    res.status(200).json({
      success: true,
      data: analysisResult,
      message: 'Document analyzed successfully'
    });
  } catch (error) {
    console.error(`Error analyzing document ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Upload multiple documents at once
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.batchUploadDocuments = async (req, res, next) => {
  try {
    // Batch upload is handled by multer middleware
    // which adds the files to req.files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const { memberId, financialYear, documentTypes, descriptions } = req.body;
    
    // Validate member exists
    const member = await Member.findById(memberId);
    if (!member) {
      // Delete uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Parse arrays from form data
    const types = JSON.parse(documentTypes);
    const descs = JSON.parse(descriptions);
    
    // Upload documents
    const uploadedDocuments = [];
    const failedUploads = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Create document record in database
        const document = await Document.create({
          name: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          fileType: file.mimetype,
          documentType: types[i] || 'OTHER',
          financialYear,
          description: descs[i] || '',
          memberId,
          userId: req.user._id,
          uploadDate: new Date()
        });
        
        uploadedDocuments.push(document);
        
        // If document is tax-related, queue it for processing
        if (['FORM16', 'FORM26AS', 'ITRV', 'TAXPAID', 'INVESTMENT_PROOF'].includes(types[i])) {
          // Process document asynchronously
          DocumentService.processDocument(document._id)
            .catch(err => console.error(`Error processing document ${document._id}:`, err));
        }
      } catch (err) {
        console.error(`Error uploading document ${file.originalname}:`, err);
        
        // Delete the file if upload failed
        fs.unlinkSync(file.path);
        
        failedUploads.push({
          name: file.originalname,
          error: err.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: {
        uploadedDocuments,
        failedUploads,
        totalUploaded: uploadedDocuments.length,
        totalFailed: failedUploads.length
      },
      message: 'Documents batch upload completed'
    });
  } catch (error) {
    console.error('Error processing batch upload:', error);
    
    // Delete uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.path) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    next(error);
  }
};

/**
 * Download a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if user has access to this document
    if (!req.user.isAdmin && document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this document'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    // Log download
    document.downloadCount = (document.downloadCount || 0) + 1;
    document.lastDownloaded = new Date();
    await document.save();
    
    // Send file
    res.download(document.filePath, document.name);
  } catch (error) {
    console.error(`Error downloading document ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Get documents for a specific financial year and member
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getDocumentsByFinancialYear = async (req, res, next) => {
  try {
    const { year, memberId } = req.params;
    
    // Validate member exists
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Check if user has access to this member's documents
    if (!req.user.isAdmin && member.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this member\'s documents'
      });
    }
    
    // Get documents
    const documents = await Document.find({
      memberId,
      financialYear: year
    }).sort({ documentType: 1, uploadDate: -1 });
    
    // Check document completion
    const documentTypes = ['FORM16', 'FORM26AS', 'INVESTMENT_PROOF', 'IDENTITY_PROOF', 'PAN_CARD'];
    const missingDocuments = [];
    
    for (const type of documentTypes) {
      if (!documents.some(doc => doc.documentType === type)) {
        missingDocuments.push(type);
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        documents,
        missingDocuments,
        completionPercentage: Math.round(((documentTypes.length - missingDocuments.length) / documentTypes.length) * 100),
        financialYear: year
      }
    });
  } catch (error) {
    console.error(`Error fetching documents for year ${req.params.year} and member ${req.params.memberId}:`, error);
    next(error);
  }
};

module.exports = exports;