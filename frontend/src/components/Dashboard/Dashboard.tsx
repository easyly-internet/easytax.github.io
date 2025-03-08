// src/components/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Grid, Typography, Box, CircularProgress, Paper, Divider } from '@mui/material';
import {
  DescriptionOutlined as DocumentIcon,
  AccountCircleOutlined as MemberIcon,
  PaymentOutlined as PaymentIcon,
  CalendarTodayOutlined as CalendarIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../../services/dashboardService';
import StatusCard from '../common/StatusCard';
import DashboardChart from './DashboardChart';
import RecentActivityList from './RecentActivityList';

interface DashboardProps {
  userId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  const { data: stats, isLoading, error } = useQuery(
    ['dashboardStats', userId, timeframe],
    () => fetchDashboardStats(userId, timeframe),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      staleTime: 240000 // Consider data stale after 4 minutes
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={4} p={2} component={Paper}>
        <Typography variant="h6" color="error">
          Error loading dashboard data. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Overview of your tax filing status and activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Total Members"
            value={stats?.memberCount || 0}
            icon={<MemberIcon />}
            color="#1a56db"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Documents"
            value={stats?.documentCount || 0}
            icon={<DocumentIcon />}
            color="#2dce89"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Pending Files"
            value={stats?.pendingCount || 0}
            icon={<CalendarIcon />}
            color="#fb6340"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Revenue"
            value={`₹${stats?.revenue.toLocaleString() || 0}`}
            icon={<PaymentIcon />}
            color="#5e72e4"
          />
        </Grid>
      </Grid>

      {/* Charts and Activity */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filing Activity
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Tax filing activity over time
              </Typography>
              <DashboardChart
                data={stats?.activityData || []}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <RecentActivityList activities={stats?.recentActivities || []} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;