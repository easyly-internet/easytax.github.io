import { Document } from '../../types/document';
export declare const fetchDocuments: () => Promise<Document[]>;
export declare const uploadDocument: (memberId: string, file: File, financialYear: string, isProtected?: boolean, password?: string) => Promise<Document>;
export declare const getDocumentsByMemberId: (memberId: string, financialYear?: string) => Promise<Document[]>;
export declare const deleteDocument: (documentId: string) => Promise<void>;
