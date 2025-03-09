// src/routes/insights.routes.js
const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insights.controller');
const authenticate = require('../middleware/auth.middleware');

/**
 * @route GET /api/insights/tax-trends/:memberId
 * @desc Get tax payment trends for a member
 * @access Private
 */
router.get('/tax-trends/:memberId', authenticate, insightsController.getTaxTrends);

/**
 * @route GET /api/insights/income-analysis/:memberId
 * @desc Get income analysis for a member
 * @access Private
 */
router.get('/income-analysis/:memberId', authenticate, insightsController.getIncomeAnalysis);

/**
 * @route GET /api/insights/deduction-opportunities/:memberId
 * @desc Get potential deduction opportunities
 * @access Private
 */
router.get('/deduction-opportunities/:memberId', authenticate, insightsController.getDeductionOpportunities);

/**
 * @route GET /api/insights/compare-regimes/:memberId
 * @desc Compare old and new tax regimes
 * @access Private
 */
router.get('/compare-regimes/:memberId', authenticate, insightsController.compareTaxRegimes);

module.exports = router;