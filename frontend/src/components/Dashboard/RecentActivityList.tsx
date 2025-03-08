// src/components/Dashboard/RecentActivityList.tsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box
} from '@mui/material';
import {
  DescriptionOutlined as DocumentIcon,
  CloudUploadOutlined as UploadIcon,
  PersonAddOutlined as NewUserIcon,
  PaymentOutlined as PaymentIcon,
  CheckCircleOutlineOutlined as CompletedIcon
} from '@mui/icons-material';
import { RecentActivity } from '../../types/dashboard';

interface RecentActivityListProps {
  activities: RecentActivity[];
}

const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_upload':
        return <UploadIcon />;
      case 'new_member':
        return <NewUserIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'filing_completed':
        return <CompletedIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'document_upload':
        return '#5e72e4'; // Blue
      case 'new_member':
        return '#2dce89'; // Green
      case 'payment':
        return '#11cdef'; // Cyan
      case 'filing_completed':
        return '#2dce89'; // Green
      default:
        return '#6c757d'; // Gray
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  return (
    <List sx={{ p: 0 }}>
      {activities.length > 0 ? (
        activities.map((activity, index) => (
          <ListItem
            key={activity.id}
            alignItems="flex-start"
            sx={{
              px: 0,
              py: 1.5,
              borderBottom: index < activities.length - 1 ? '1px solid #eee' : 'none'
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                {getActivityIcon(activity.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="subtitle2">
                  {activity.title}
                </Typography>
              }
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="textSecondary"
                  >
                    {activity.description}
                  </Typography>
                  <Box mt={0.5}>
                    <Typography
                      component="span"
                      variant="caption"
                      color="textSecondary"
                    >
                      {formatTimestamp(activity.timestamp)}
                    </Typography>
                  </Box>
                </React.Fragment>
              }
            />
          </ListItem>
        ))
      ) : (
        <Box py={2} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            No recent activity
          </Typography>
        </Box>
      )}
    </List>
  );
};

export default RecentActivityList;