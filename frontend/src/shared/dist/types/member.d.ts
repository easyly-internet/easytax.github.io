import { ProtectedDocument, Receipt } from "./document";
export interface Member {
    id: string;
    userId: string;
    panNumber: string;
    fullName: string;
    email: string;
    status: MemberStatus;
    documents?: Document[];
    financialYears?: MemberYear[];
    createdAt: string;
    updatedAt: string;
}
export interface MemberYear {
    id: string;
    memberId: string;
    financialYear: string;
    documents?: Document[];
    protectedDocuments?: ProtectedDocument[];
    receipts?: Receipt[];
    remark?: string[];
    adminRemark?: string[];
    status: MemberYearStatus;
    createdAt: string;
    updatedAt: string;
}
export declare enum MemberYearStatus {
    TO_BE_STARTED = "TobeStarted",
    IN_PROGRESS = "InProgress",
    COMPLETED = "Completed",
    PENDING = "Pending",
    REJECTED = "Rejected"
}
export declare enum MemberStatus {
    ACTIVE = "Active",
    PENDING = "Pending",
    INACTIVE = "Inactive"
}
