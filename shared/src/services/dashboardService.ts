// Path: shared/src/services/dashboardService.ts

// Dashboard statistics interface
export interface DashboardStats {
    memberCount: number;
    documentCount: number;
    pendingCount: number;
    revenue: number;  // Revenue should be a number, formatted later in the component
    activityData: any[];  // You can define a more specific type for activity data if needed
    recentActivities: any[];  // You can also define a more specific type for recent activities
}

// Dashboard service class
class DashboardService {
    private apiUrl = '/api/dashboard';  // Replace with your actual API URL

    // Fetch dashboard stats
    async fetchDashboardStats(): Promise<DashboardStats> {
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

        const data: DashboardStats = await response.json();
        return data;
    }

    private getToken(): string | null {
        return localStorage.getItem('auth_token');
    }
}

const dashboardService = new DashboardService();
export default dashboardService;
