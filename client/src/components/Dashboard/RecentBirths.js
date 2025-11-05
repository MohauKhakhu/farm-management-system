import React from 'react';
import { Typography, List, ListItem, ListItemText, ListItemIcon, Avatar, Chip } from '@mui/material';
import { Pets, Female, Male } from '@mui/icons-material';

const RecentBirths = ({ births }) => {
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Recent Births
      </Typography>
      <List>
        {births && births.map((birth, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <Avatar>
                <Pets />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={birth.animalName + ' - ' + birth.type}
              secondary={'Born: ' + birth.date + ' | Weight: ' + birth.weight + 'kg'}
            />
            <Chip 
              label={birth.gender} 
              color={birth.gender === 'Male' ? 'primary' : 'secondary'} 
              size="small"
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default RecentBirths;
