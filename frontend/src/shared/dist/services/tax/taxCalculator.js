"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTaxLiability = void 0;
const axios_1 = __importDefault(require("axios"));
const calculateTaxLiability = async (income, deductions) => {
    try {
        const response = await axios_1.default.post(`${process.env.ANALYSIS_SERVICE_URL}/api/tax/calculate`, { income, deductions });
        if (!response.data.success) {
            throw new Error('Failed to calculate tax liability');
        }
        return response.data.taxLiability;
    }
    catch (error) {
        console.error('Error calculating tax liability:', error);
        throw error;
    }
};
exports.calculateTaxLiability = calculateTaxLiability;
//# sourceMappingURL=taxCalculator.js.map