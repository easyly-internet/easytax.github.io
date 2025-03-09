"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRecommendations = void 0;
const axios_1 = __importDefault(require("axios"));
const generateRecommendations = async (income, deductions, taxLiability) => {
    try {
        const response = await axios_1.default.post(`${process.env.ANALYSIS_SERVICE_URL}/api/recommendations/generate`, { income, deductions, taxLiability });
        if (!response.data.success) {
            throw new Error('Failed to generate recommendations');
        }
        return response.data.recommendations;
    }
    catch (error) {
        console.error('Error generating recommendations:', error);
        throw error;
    }
};
exports.generateRecommendations = generateRecommendations;
//# sourceMappingURL=recommendationGenerator.js.map