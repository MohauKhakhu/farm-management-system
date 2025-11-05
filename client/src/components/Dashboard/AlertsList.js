import React from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Chip } from '@mui/material';
import { Warning, Error, Info } from '@mui/icons-material';

const AlertsList = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <Typography color="text.secondary">
        No recent alerts
      </Typography>
    );
  }

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <Error color="error" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info color="info" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <List dense>
      {alerts.map((alert, index) => (
        <ListItem key={index} divider={index < alerts.length - 1}>
          <ListItemIcon>
            {getAlertIcon(alert.severity)}
          </ListItemIcon>
          <ListItemText
            primary={alert.message}
            secondary={new Date(alert.timestamp).toLocaleDateString()}
          />
          <Chip 
            label={alert.severity} 
            size="small" 
            color={getSeverityColor(alert.severity)}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default AlertsList;