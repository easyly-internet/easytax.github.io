import mongoose from "mongoose";
declare const TaxAnalysis: mongoose.Model<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    memberId: mongoose.Types.ObjectId;
    financialYear: string;
    regimeUsed: "OLD" | "NEW";
    recommendations: {
        title?: string | undefined;
        category?: string | undefined;
        description?: string | undefined;
        potentialSavings?: number | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | undefined;
    }[];
    incomeDetails?: {
        salary: number;
        interestIncome: number;
        rentalIncome: number;
        businessIncome: number;
        capitalGains: number;
        otherIncome: number;
        totalIncome: number;
    } | undefined;
    deductions?: {
        section80C: number;
        section80D: number;
        housingLoan: number;
        educationLoan: number;
        nps: number;
        donations: number;
        otherDeductions: number;
        totalDeductions: number;
    } | undefined;
    taxLiability?: {
        taxableIncome: number;
        calculatedTax: number;
        surcharge: number;
        healthAndEducationCess: number;
        totalTaxLiability: number;
        tdsDeducted: number;
        advanceTaxPaid: number;
        selfAssessmentTaxPaid: number;
        totalTaxPaid: number;
        taxRefund: number;
        taxDue: number;
        oldRegime: number;
        newRegime: number;
        recommended: "OLD" | "NEW";
    } | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    memberId: mongoose.Types.ObjectId;
    financialYear: string;
    regimeUsed: "OLD" | "NEW";
    recommendations: {
        title?: string | undefined;
        category?: string | undefined;
        description?: string | undefined;
        potentialSavings?: number | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | undefined;
    }[];
    incomeDetails?: {
        salary: number;
        interestIncome: number;
        rentalIncome: number;
        businessIncome: number;
        capitalGains: number;
        otherIncome: number;
        totalIncome: number;
    } | undefined;
    deductions?: {
        section80C: number;
        section80D: number;
        housingLoan: number;
        educationLoan: number;
        nps: number;
        donations: number;
        otherDeductions: number;
        totalDeductions: number;
    } | undefined;
    taxLiability?: {
        taxableIncome: number;
        calculatedTax: number;
        surcharge: number;
        healthAndEducationCess: number;
        totalTaxLiability: number;
        tdsDeducted: number;
        advanceTaxPaid: number;
        selfAssessmentTaxPaid: number;
        totalTaxPaid: number;
        taxRefund: number;
        taxDue: number;
        oldRegime: number;
        newRegime: number;
        recommended: "OLD" | "NEW";
    } | undefined;
}> & {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    memberId: mongoose.Types.ObjectId;
    financialYear: string;
    regimeUsed: "OLD" | "NEW";
    recommendations: {
        title?: string | undefined;
        category?: string | undefined;
        description?: string | undefined;
        potentialSavings?: number | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | undefined;
    }[];
    incomeDetails?: {
        salary: number;
        interestIncome: number;
        rentalIncome: number;
        businessIncome: number;
        capitalGains: number;
        otherIncome: number;
        totalIncome: number;
    } | undefined;
    deductions?: {
        section80C: number;
        section80D: number;
        housingLoan: number;
        educationLoan: number;
        nps: number;
        donations: number;
        otherDeductions: number;
        totalDeductions: number;
    } | undefined;
    taxLiability?: {
        taxableIncome: number;
        calculatedTax: number;
        surcharge: number;
        healthAndEducationCess: number;
        totalTaxLiability: number;
        tdsDeducted: number;
        advanceTaxPaid: number;
        selfAssessmentTaxPaid: number;
        totalTaxPaid: number;
        taxRefund: number;
        taxDue: number;
        oldRegime: number;
        newRegime: number;
        recommended: "OLD" | "NEW";
    } | undefined;
} & {
    _id: mongoose.Types.ObjectId;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    memberId: mongoose.Types.ObjectId;
    financialYear: string;
    regimeUsed: "OLD" | "NEW";
    recommendations: {
        title?: string | undefined;
        category?: string | undefined;
        description?: string | undefined;
        potentialSavings?: number | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | undefined;
    }[];
    incomeDetails?: {
        salary: number;
        interestIncome: number;
        rentalIncome: number;
        businessIncome: number;
        capitalGains: number;
        otherIncome: number;
        totalIncome: number;
    } | undefined;
    deductions?: {
        section80C: number;
        section80D: number;
        housingLoan: number;
        educationLoan: number;
        nps: number;
        donations: number;
        otherDeductions: number;
        totalDeductions: number;
    } | undefined;
    taxLiability?: {
        taxableIncome: number;
        calculatedTax: number;
        surcharge: number;
        healthAndEducationCess: number;
        totalTaxLiability: number;
        tdsDeducted: number;
        advanceTaxPaid: number;
        selfAssessmentTaxPaid: number;
        totalTaxPaid: number;
        taxRefund: number;
        taxDue: number;
        oldRegime: number;
        newRegime: number;
        recommended: "OLD" | "NEW";
    } | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    memberId: mongoose.Types.ObjectId;
    financialYear: string;
    regimeUsed: "OLD" | "NEW";
    recommendations: {
        title?: string | undefined;
        category?: string | undefined;
        description?: string | undefined;
        potentialSavings?: number | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | undefined;
    }[];
    incomeDetails?: {
        salary: number;
        interestIncome: number;
        rentalIncome: number;
        businessIncome: number;
        capitalGains: number;
        otherIncome: number;
        totalIncome: number;
    } | undefined;
    deductions?: {
        section80C: number;
        section80D: number;
        housingLoan: number;
        educationLoan: number;
        nps: number;
        donations: number;
        otherDeductions: number;
        totalDeductions: number;
    } | undefined;
    taxLiability?: {
        taxableIncome: number;
        calculatedTax: number;
        surcharge: number;
        healthAndEducationCess: number;
        totalTaxLiability: number;
        tdsDeducted: number;
        advanceTaxPaid: number;
        selfAssessmentTaxPaid: number;
        totalTaxPaid: number;
        taxRefund: number;
        taxDue: number;
        oldRegime: number;
        newRegime: number;
        recommended: "OLD" | "NEW";
    } | undefined;
}>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    updatedAt: NativeDate;
} & {
    memberId: mongoose.Types.ObjectId;
    financialYear: string;
    regimeUsed: "OLD" | "NEW";
    recommendations: {
        title?: string | undefined;
        category?: string | undefined;
        description?: string | undefined;
        potentialSavings?: number | undefined;
        priority?: "LOW" | "MEDIUM" | "HIGH" | undefined;
    }[];
    incomeDetails?: {
        salary: number;
        interestIncome: number;
        rentalIncome: number;
        businessIncome: number;
        capitalGains: number;
        otherIncome: number;
        totalIncome: number;
    } | undefined;
    deductions?: {
        section80C: number;
        section80D: number;
        housingLoan: number;
        educationLoan: number;
        nps: number;
        donations: number;
        otherDeductions: number;
        totalDeductions: number;
    } | undefined;
    taxLiability?: {
        taxableIncome: number;
        calculatedTax: number;
        surcharge: number;
        healthAndEducationCess: number;
        totalTaxLiability: number;
        tdsDeducted: number;
        advanceTaxPaid: number;
        selfAssessmentTaxPaid: number;
        totalTaxPaid: number;
        taxRefund: number;
        taxDue: number;
        oldRegime: number;
        newRegime: number;
        recommended: "OLD" | "NEW";
    } | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
}>>;
export default TaxAnalysis;
