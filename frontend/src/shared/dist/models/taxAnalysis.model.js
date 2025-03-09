"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const taxAnalysisSchema = new mongoose_1.default.Schema({
    memberId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "Member",
    },
    financialYear: {
        type: String,
        required: true,
    },
    incomeDetails: {
        salary: { type: Number, default: 0 },
        interestIncome: { type: Number, default: 0 },
        rentalIncome: { type: Number, default: 0 },
        businessIncome: { type: Number, default: 0 },
        capitalGains: { type: Number, default: 0 },
        otherIncome: { type: Number, default: 0 },
        totalIncome: { type: Number, default: 0 },
    },
    deductions: {
        section80C: { type: Number, default: 0 },
        section80D: { type: Number, default: 0 },
        housingLoan: { type: Number, default: 0 },
        educationLoan: { type: Number, default: 0 },
        nps: { type: Number, default: 0 },
        donations: { type: Number, default: 0 },
        otherDeductions: { type: Number, default: 0 },
        totalDeductions: { type: Number, default: 0 },
    },
    taxLiability: {
        taxableIncome: { type: Number, default: 0 },
        calculatedTax: { type: Number, default: 0 },
        surcharge: { type: Number, default: 0 },
        healthAndEducationCess: { type: Number, default: 0 },
        totalTaxLiability: { type: Number, default: 0 },
        tdsDeducted: { type: Number, default: 0 },
        advanceTaxPaid: { type: Number, default: 0 },
        selfAssessmentTaxPaid: { type: Number, default: 0 },
        totalTaxPaid: { type: Number, default: 0 },
        taxRefund: { type: Number, default: 0 },
        taxDue: { type: Number, default: 0 },
        oldRegime: { type: Number, default: 0 },
        newRegime: { type: Number, default: 0 },
        recommended: { type: String, enum: ["OLD", "NEW"], default: "OLD" },
    },
    regimeUsed: {
        type: String,
        enum: ["OLD", "NEW"],
        default: "OLD",
    },
    recommendations: [
        {
            category: String,
            title: String,
            description: String,
            potentialSavings: Number,
            priority: {
                type: String,
                enum: ["LOW", "MEDIUM", "HIGH"],
            },
        },
    ],
}, { timestamps: true });
const TaxAnalysis = mongoose_1.default.model("TaxAnalysis", taxAnalysisSchema);
exports.default = TaxAnalysis;
//# sourceMappingURL=taxAnalysis.model.js.map