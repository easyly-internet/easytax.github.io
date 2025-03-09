"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.getDocumentsByMemberId = exports.uploadDocument = exports.fetchDocuments = void 0;
const fetchDocuments = async () => {
    const response = await fetch(`/api/documents`);
    if (!response.ok) {
        throw new Error('Failed to fetch documents');
    }
    return await response.json();
};
exports.fetchDocuments = fetchDocuments;
const uploadDocument = async (memberId, file, financialYear, isProtected = false, password) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('member_id', memberId);
    formData.append('financial_year', financialYear);
    formData.append('is_protected', String(isProtected));
    if (password) {
        formData.append('password', password);
    }
    const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error('Failed to upload document');
    }
    return await response.json();
};
exports.uploadDocument = uploadDocument;
const getDocumentsByMemberId = async (memberId, financialYear) => {
    let url = `/api/documents?member_id=${memberId}`;
    if (financialYear) {
        url += `&financial_year=${financialYear}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch documents');
    }
    return await response.json();
};
exports.getDocumentsByMemberId = getDocumentsByMemberId;
const deleteDocument = async (documentId) => {
    const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete document');
    }
};
exports.deleteDocument = deleteDocument;
//# sourceMappingURL=documentService.js.map