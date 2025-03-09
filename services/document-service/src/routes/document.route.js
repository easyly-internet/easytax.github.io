// src/routes/document.routes.js
import express from 'express';
const router = express.Router();
// Import correctly - should match how the controller is exported
import * as documentController from '../controllers/document.controller';
// Import auth middleware from your local project path, not from another service
import { authenticate } from '../middleware/auth.middleware';
// If you're using multer for file uploads, import it
import { upload } from '../middleware/upload.middleware';

/**
 * @route GET /api/documents/types
 * @desc Get list of document types
 * @access Private
 */
router.get('/types', authenticate, documentController.getDocumentTypes);

/**
 * @route GET /api/documents/member/:memberId
 * @desc Get all documents for a specific member
 * @access Private
 */
router.get('/member/:memberId', authenticate, documentController.getMemberDocuments);

/**
 * @route GET /api/documents/financial-year/:year/member/:memberId
 * @desc Get documents for a specific financial year and member
 * @access Private
 */
router.get('/financial-year/:year/member/:memberId', authenticate, documentController.getDocumentsByFinancialYear);

/**
 * @route POST /api/documents/batch-upload
 * @desc Upload multiple documents at once
 * @access Private
 */
router.post('/batch-upload', authenticate, upload.array('documents', 10), documentController.batchUploadDocuments);

/**
 * @route POST /api/documents/upload
 * @desc Upload a new document
 * @access Private
 */
router.post('/upload', authenticate, upload.single('document'), documentController.uploadDocument);

/**
 * @route POST /api/documents/analyze/:id
 * @desc Analyze a document using AI to extract data
 * @access Private
 */
router.post('/analyze/:id', authenticate, documentController.analyzeDocument);

/**
 * @route GET /api/documents/download/:id
 * @desc Download a document
 * @access Private
 */
router.get('/download/:id', authenticate, documentController.downloadDocument);

/**
 * @route GET /api/documents/:id
 * @desc Get a specific document by ID
 * @access Private
 */
router.get('/:id', authenticate, documentController.getDocumentById);

/**
 * @route PUT /api/documents/:id
 * @desc Update document metadata
 * @access Private
 */
router.put('/:id', authenticate, documentController.updateDocument);

/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document
 * @access Private
 */
router.delete('/:id', authenticate, documentController.deleteDocument);

/**
 * @route GET /api/documents
 * @desc Get all documents for the authenticated user or specific member
 * @access Private
 */
router.get('/', authenticate, documentController.getAllDocuments);

export default router;