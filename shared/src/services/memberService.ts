// Path: shared/src/services/memberService.ts

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
    remark?: any; // Can be string[] or string
    admin_remark?: any;
    status?: string;
    amounts?: Array<{refund_amount: number, fee_amount: number}>;
    created_at?: string;
    updated_at?: string;
}

export const getMemberById = async (id: string): Promise<Member> => {
    // Implementation would go here - replace with actual API call
    const response = await fetch(`/api/members/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch member');
    }
    return await response.json();
};

export const createMember = async (memberData: Omit<Member, 'id'>): Promise<Member> => {
    // Implementation would go here - replace with actual API call
    const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
    });

    if (!response.ok) {
        throw new Error('Failed to create member');
    }

    return await response.json();
};

export const updateMember = async (id: string, memberData: Partial<Member>): Promise<Member> => {
    // Implementation would go here - replace with actual API call
    const response = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
    });

    if (!response.ok) {
        throw new Error('Failed to update member');
    }

    return await response.json();
};