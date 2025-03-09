"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processIncomeSources = void 0;
const axios_1 = __importDefault(require("axios"));
const processIncomeSources = async (documentTexts) => {
    try {
        const response = await axios_1.default.post(`${process.env.ANALYSIS_SERVICE_URL}/api/income/process`, { documents: documentTexts });
        if (!response.data.success) {
            throw new Error('Failed to process income sources');
        }
        return response.data.income;
    }
    catch (error) {
        console.error('Error processing income sources:', error);
        throw error;
    }
};
exports.processIncomeSources = processIncomeSources;
//# sourceMappingURL=incomeProcessor.js.map