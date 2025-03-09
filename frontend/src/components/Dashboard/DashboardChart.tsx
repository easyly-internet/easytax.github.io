// src/components/Dashboard/DashboardChart.tsx
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Box, ToggleButtonGroup, ToggleButton, useTheme, useMediaQuery } from '@mui/material';
import { ActivityData } from '../../../../shared/src/types/dashboard';

interface DashboardChartProps {
  data: ActivityData[];
  timeframe: 'week' | 'month' | 'year';
  onTimeframeChange: (timeframe: 'week' | 'month' | 'year') => void;
}

const DashboardChart: React.FC<DashboardChartProps> = ({
  data,
  timeframe,
  onTimeframeChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTimeframeChange = (
    _: React.MouseEvent<HTMLElement>,
    newTimeframe: 'week' | 'month' | 'year' | null
  ) => {
    if (newTimeframe !== null) {
      onTimeframeChange(newTimeframe);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="flex-end"
        mb={2}
      >
        <ToggleButtonGroup
          value={timeframe}
          exclusive
          onChange={handleTimeframeChange}
          size="small"
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stackId="1"
            stroke="#2dce89"
            fill="#2dce89"
          />
          <Area
            type="monotone"
            dataKey="inProgress"
            name="In Progress"
            stackId="1"
            stroke="#5e72e4"
            fill="#5e72e4"
          />
          <Area
            type="monotone"
            dataKey="pending"
            name="Pending"
            stackId="1"
            stroke="#fb6340"
            fill="#fb6340"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default DashboardChart;