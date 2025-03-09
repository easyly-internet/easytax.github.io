// src/routes/documentProcessing.routes.js
const express = require('express');
const router = express.Router();
const documentProcessingController = require('../controllers/documentProcessing.controller');
const authenticate = require('../middleware/auth.middleware');

/**
 * @route POST /api/document-processing/extract-text
 * @desc Extract text from document
 * @access Private
 */
router.post('/extract-text', authenticate, documentProcessingController.extractText);

/**
 * @route POST /api/document-processing/classify
 * @desc Classify document type
 * @access Private
 */
router.post('/classify', authenticate, documentProcessingController.classifyDocument);

/**
 * @route POST /api/document-processing/extract-fields
 * @desc Extract specific fields from a document
 * @access Private
 */
router.post('/extract-fields', authenticate, documentProcessingController.extractFields);

/**
 * @route POST /api/document-processing/validate
 * @desc Validate document data
 * @access Private
 */
router.post('/validate', authenticate, documentProcessingController.validateDocument);

module.exports = router;