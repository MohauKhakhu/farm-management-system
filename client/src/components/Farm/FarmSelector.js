import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as FarmIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useFarm } from '../../contexts/FarmContext';
import { useAuth } from '../../contexts/AuthContext';

const FarmSelector = () => {
  const { farms, selectedFarm, selectFarm, createFarm, isLoading } = useFarm();
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFarmData, setNewFarmData] = useState({
    name: '',
    location: '',
    type: 'mixed',
    size: '',
  });

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFarmSelect = (farm) => {
    selectFarm(farm);
    handleMenuClose();
  };

  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
    handleMenuClose();
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setNewFarmData({
      name: '',
      location: '',
      type: 'mixed',
      size: '',
    });
  };

  const handleCreateFarm = async () => {
    const result = await createFarm(newFarmData);
    if (result.success) {
      handleCreateDialogClose();
    }
  };

  const handleInputChange = (field) => (event) => {
    setNewFarmData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  if (!user) return null;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          onClick={handleMenuOpen}
          startIcon={<FarmIcon />}
          endIcon={<ExpandMoreIcon />}
          sx={{
            color: 'text.primary',
            textTransform: 'none',
            minWidth: 'auto',
          }}
        >
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="subtitle1" noWrap>
              {selectedFarm ? selectedFarm.name : 'Select Farm'}
            </Typography>
            {selectedFarm && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {selectedFarm.location}
              </Typography>
            )}
          </Box>
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { width: 320, maxWidth: '100%' },
          }}
        >
          <MenuItem disabled>
            <Typography variant="subtitle2" color="text.secondary">
              YOUR FARMS
            </Typography>
          </MenuItem>
          
          {farms.map((farm) => (
            <MenuItem
              key={farm.id}
              onClick={() => handleFarmSelect(farm)}
              selected={selectedFarm?.id === farm.id}
            >
              <ListItemIcon>
                <FarmIcon color={selectedFarm?.id === farm.id ? 'primary' : 'action'} />
              </ListItemIcon>
              <ListItemText
                primary={farm.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <LocationIcon fontSize="small" />
                    <Typography variant="body2">{farm.location}</Typography>
                    <Chip
                      label={farm.type}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                }
              />
            </MenuItem>
          ))}

          {farms.length === 0 && (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No farms available
              </Typography>
            </MenuItem>
          )}

          <Divider />

          <MenuItem onClick={handleCreateDialogOpen}>
            <ListItemIcon>
              <AddIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Create New Farm" />
          </MenuItem>
        </Menu>
      </Box>

      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Farm</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Farm Name"
              value={newFarmData.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
            />
            <TextField
              label="Location"
              value={newFarmData.location}
              onChange={handleInputChange('location')}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Farm Type</InputLabel>
              <Select
                value={newFarmData.type}
                label="Farm Type"
                onChange={handleInputChange('type')}
              >
                <MenuItem value="dairy">Dairy</MenuItem>
                <MenuItem value="beef">Beef</MenuItem>
                <MenuItem value="poultry">Poultry</MenuItem>
                <MenuItem value="mixed">Mixed</MenuItem>
                <MenuItem value="crop">Crop</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Size (acres)"
              type="number"
              value={newFarmData.size}
              onChange={handleInputChange('size')}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button
            onClick={handleCreateFarm}
            variant="contained"
            disabled={!newFarmData.name || !newFarmData.location || isLoading}
          >
            Create Farm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FarmSelector;