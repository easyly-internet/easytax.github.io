export interface IncomeSource {
    id: string;
    type: string;
    amount: number;
    description?: string;
}
export declare const processIncomeSources: (documentTexts: {
    name: string;
    text: string;
}[]) => Promise<IncomeSource[]>;
