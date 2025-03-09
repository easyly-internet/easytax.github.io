export interface DashboardStats {
    memberCount: number;
    documentCount: number;
    pendingCount: number;
    revenue: number;
    activityData: any[];
    recentActivities: any[];
}
declare class DashboardService {
    private apiUrl;
    fetchDashboardStats(): Promise<DashboardStats>;
    private getToken;
}
declare const dashboardService: DashboardService;
export default dashboardService;
