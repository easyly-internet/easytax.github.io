"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DashboardService {
    constructor() {
        this.apiUrl = '/api/dashboard';
    }
    async fetchDashboardStats() {
        const response = await fetch(`${this.apiUrl}/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`,
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch dashboard stats');
        }
        const data = await response.json();
        return data;
    }
    getToken() {
        return localStorage.getItem('auth_token');
    }
}
const dashboardService = new DashboardService();
exports.default = dashboardService;
//# sourceMappingURL=dashboardService.js.map