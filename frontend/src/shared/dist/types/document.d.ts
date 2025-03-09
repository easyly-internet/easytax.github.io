export interface Document {
    id: string;
    member_id: string;
    financial_year?: string;
    name: string;
    path: string;
    type: string;
    size: number;
    password?: string;
    is_protected?: boolean;
    upload_date: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    metadata?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}
export interface ProtectedDocument extends Document {
    password: string;
}
export interface Receipt extends Document {
    amount?: number;
    date?: string;
}
