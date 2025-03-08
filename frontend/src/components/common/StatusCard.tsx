// src/components/common/StatusCard.tsx
import React, { ReactNode } from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  subtitle?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle
}) => {
  return (
    <Card sx={{ height: '100%', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Avatar
            sx={{
              bgcolor: `${color}15`, // Using 15% opacity of the color
              color: color,
              width: 48,
              height: 48,
              mr: 2
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontWeight: 500 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              component="div"
              sx={{ fontWeight: 600, my: 0.5 }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="textSecondary"
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatusCard;