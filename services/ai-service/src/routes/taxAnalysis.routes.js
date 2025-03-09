// src/routes/taxAnalysis.routes.js
import express from 'express';
const router = express.Router();
import * as taxAnalysisController from '../controllers/taxAnalysis.controller';
import { authenticate } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';

/**
 * @route POST /api/tax-analysis/upload
 * @desc Upload tax documents for analysis
 * @access Private
 */
router.post('/upload', authenticate, upload.fields([{ name: 'documents', maxCount: 10 }]), taxAnalysisController.uploadDocuments);

/**
 * @route POST /api/tax-analysis/analyze
 * @desc Analyze uploaded tax documents
 * @access Private
 */
router.post('/analyze', authenticate, taxAnalysisController.analyzeDocuments);

/**
 * @route GET /api/tax-analysis/summary/:memberId
 * @desc Get tax analysis summary for a member
 * @access Private
 */
router.get('/summary/:memberId', authenticate, taxAnalysisController.getTaxSummary);

/**
 * @route GET /api/tax-analysis/deductions/:memberId
 * @desc Get potential deductions for a member
 * @access Private
 */
router.get('/deductions/:memberId', authenticate, taxAnalysisController.getPotentialDeductions);

/**
 * @route GET /api/tax-analysis/recommendations/:memberId
 * @desc Get tax saving recommendations
 * @access Private
 */
router.get('/recommendations/:memberId', authenticate, taxAnalysisController.getTaxRecommendations);

/**
 * @route POST /api/tax-analysis/simulate
 * @desc Simulate tax calculations with what-if scenarios
 * @access Private
 */
router.post('/simulate', authenticate, taxAnalysisController.simulateTaxScenarios);

export default router;