import React from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Chip, Box } from '@mui/material';
import { Task, Schedule, CheckCircle } from '@mui/icons-material';

const TasksList = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <Typography color="text.secondary">
        No upcoming tasks
      </Typography>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      default:
        return <Task color="action" />;
    }
  };

  return (
    <List dense>
      {tasks.map((task, index) => (
        <ListItem key={index} divider={index < tasks.length - 1}>
          <ListItemIcon>
            {getStatusIcon(task.status)}
          </ListItemIcon>
          <ListItemText
            primary={task.title}
            secondary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Schedule fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {new Date(task.dueDate).toLocaleDateString()}
                </Typography>
              </Box>
            }
          />
          <Chip 
            label={task.priority} 
            size="small" 
            color={getPriorityColor(task.priority)}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default TasksList;