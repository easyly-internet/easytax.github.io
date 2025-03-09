// src/types/dashboard.ts

export interface ActivityData {
    id: string;
    title: string; // Add this
    description: string; // Add this
    timestamp: string;
    user: string;
    action: string;
}

export interface RecentActivity {
    id: string;
    title: string; // Add this
    description: string; // Add this
    timestamp: string;
    user: string;
    type: string;
}
