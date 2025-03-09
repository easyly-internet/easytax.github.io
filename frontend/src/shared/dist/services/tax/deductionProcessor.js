"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDeductions = processDeductions;
async function processDeductions(texts) {
    return texts.map(text => ({
        name: text,
        amount: Math.random() * 1000,
        section: 'Unknown'
    }));
}
//# sourceMappingURL=deductionProcessor.js.map