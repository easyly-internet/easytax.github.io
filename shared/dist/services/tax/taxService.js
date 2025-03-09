"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaxFilingStatus = exports.getTaxFilingStatus = exports.calculateTax = exports.TaxFilingStatus = void 0;
exports.calculateTaxLiability = calculateTaxLiability;
async function calculateTaxLiability(income, deductions) {
    return {
        oldRegime: income * 0.1 - deductions.reduce((sum, d) => sum + d.amount, 0),
        newRegime: income * 0.08 - deductions.reduce((sum, d) => sum + d.amount, 0),
        recommended: 'oldRegime',
    };
}
var TaxFilingStatus;
(function (TaxFilingStatus) {
    TaxFilingStatus["NOT_STARTED"] = "NOT_STARTED";
    TaxFilingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaxFilingStatus["DOCUMENTS_REQUIRED"] = "DOCUMENTS_REQUIRED";
    TaxFilingStatus["READY_FOR_FILING"] = "READY_FOR_FILING";
    TaxFilingStatus["FILED"] = "FILED";
    TaxFilingStatus["VERIFICATION_PENDING"] = "VERIFICATION_PENDING";
    TaxFilingStatus["REFUND_INITIATED"] = "REFUND_INITIATED";
    TaxFilingStatus["COMPLETED"] = "COMPLETED";
    TaxFilingStatus["ERROR"] = "ERROR";
})(TaxFilingStatus || (exports.TaxFilingStatus = TaxFilingStatus = {}));
const calculateTax = async (memberId, financialYear, incomeDetails) => {
    const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            member_id: memberId,
            financial_year: financialYear,
            ...incomeDetails,
        }),
    });
    if (!response.ok) {
        throw new Error('Failed to calculate tax');
    }
    return await response.json();
};
exports.calculateTax = calculateTax;
const getTaxFilingStatus = async (memberId, financialYear) => {
    const response = await fetch(`/api/tax/status?member_id=${memberId}&financial_year=${financialYear}`);
    if (!response.ok) {
        throw new Error('Failed to get tax filing status');
    }
    const data = await response.json();
    return data.status;
};
exports.getTaxFilingStatus = getTaxFilingStatus;
const updateTaxFilingStatus = async (memberId, financialYear, status) => {
    const response = await fetch('/api/tax/status', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            member_id: memberId,
            financial_year: financialYear,
            status,
        }),
    });
    if (!response.ok) {
        throw new Error('Failed to update tax filing status');
    }
};
exports.updateTaxFilingStatus = updateTaxFilingStatus;
//# sourceMappingURL=taxService.js.map