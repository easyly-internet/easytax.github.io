export interface Member {
    id: string;
    user_id?: string;
    pan_number: string;
    full_name: string;
    email: string;
    documents?: any[];
    remark?: string;
    pan_card?: string;
    aadhar_card?: string;
    other_document?: string;
    created_at?: string;
    updated_at?: string;
}
export interface MemberYear {
    id: string;
    member_id: string;
    financial_year: string;
    documents?: any[];
    protected_documents?: any[];
    receipts?: any[];
    remark?: any;
    admin_remark?: any;
    status?: string;
    amounts?: Array<{
        refund_amount: number;
        fee_amount: number;
    }>;
    created_at?: string;
    updated_at?: string;
}
export declare const getMemberById: (id: string) => Promise<Member>;
export declare const createMember: (memberData: Omit<Member, "id">) => Promise<Member>;
export declare const updateMember: (id: string, memberData: Partial<Member>) => Promise<Member>;
