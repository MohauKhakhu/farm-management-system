import React from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Avatar, Chip } from '@mui/material';
import { Pets, Female, Male } from '@mui/icons-material';

const RecentBirths = ({ births }) => {
  if (!births || births.length === 0) {
    return (
      <Typography color="text.secondary">
        No recent births
      </Typography>
    );
  }

  return (
    <List dense>
      {births.map((birth, index) => (
        <ListItem key={index} divider={index < births.length - 1}>
          <ListItemIcon>
            <Avatar sx={{ bgcolor: birth.gender === 'male' ? 'primary.main' : 'secondary.main' }}>
              {birth.gender === 'male' ? <Male /> : <Female />}
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={birth.animalName || `New ${birth.animalType}`}
            secondary={
              <>
                <div>Type: {birth.animalType}</div>
                <div>Born: {new Date(birth.birthDate).toLocaleDateString()}</div>
              </>
            }
          />
          <Chip 
            icon={<Pets />}
            label={birth.animalType} 
            size="small" 
            variant="outlined"
          />
        </ListItem>
      ))}
    </List>
  );
};

export default RecentBirths;