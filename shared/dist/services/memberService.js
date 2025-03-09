"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMember = exports.createMember = exports.getMemberById = void 0;
const getMemberById = async (id) => {
    const response = await fetch(`/api/members/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch member');
    }
    return await response.json();
};
exports.getMemberById = getMemberById;
const createMember = async (memberData) => {
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
exports.createMember = createMember;
const updateMember = async (id, memberData) => {
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
exports.updateMember = updateMember;
//# sourceMappingURL=memberService.js.map