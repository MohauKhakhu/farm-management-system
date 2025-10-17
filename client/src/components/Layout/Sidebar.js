import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Favorite as BreedingIcon,
  Inventory as InventoryIcon,
  Restaurant as FeedIcon,
  LocalHospital as HealthIcon,
  Grass as FieldIcon,
  Sensors as IoTIcon,
  AccountBalance as FinancialIcon,
  People as WorkforceIcon,
  Eco as SustainabilityIcon,
  Security as BlockchainIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

const menuItems = [
  {
    title: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    title: 'Animal Management',
    icon: <PetsIcon />,
    children: [
      { title: 'Animal Register', path: '/animals' },
      { title: 'Health Records', path: '/health' },
      { title: 'Breeding', path: '/breeding' },
    ],
  },
  {
    title: 'Farm Operations',
    icon: <FieldIcon />,
    children: [
      { title: 'Fields & Crops', path: '/fields' },
      { title: 'Feed Management', path: '/feed' },
      { title: 'Inventory', path: '/inventory' },
    ],
  },
  {
    title: 'Technology',
    icon: <IoTIcon />,
    children: [
      { title: 'IoT & Sensors', path: '/iot' },
      { title: 'Blockchain', path: '/blockchain' },
    ],
  },
  {
    title: 'Business',
    icon: <FinancialIcon />,
    children: [
      { title: 'Financial', path: '/financial' },
      { title: 'Workforce', path: '/workforce' },
      { title: 'Sustainability', path: '/sustainability' },
    ],
  },
  {
    title: 'Reports',
    icon: <ReportsIcon />,
    path: '/reports',
  },
  {
    title: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
];

const Sidebar = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = React.useState({});

  const handleClick = (item) => {
    if (item.children) {
      setOpenSections(prev => ({
        ...prev,
        [item.title]: !prev[item.title]
      }));
    } else {
      navigate(item.path);
      if (onItemClick) onItemClick();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isParentActive = (children) => {
    return children?.some(child => isActive(child.path));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          🚜 Farm Manager
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Comprehensive Farm Management
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.title}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleClick(item)}
                  selected={item.path ? isActive(item.path) : isParentActive(item.children)}
                  sx={{
                    minHeight: 48,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: 2,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: item.path && isActive(item.path) ? 600 : 400,
                    }}
                  />
                  {item.children && (
                    openSections[item.title] ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>
              
              {item.children && (
                <Collapse in={openSections[item.title]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItem key={child.title} disablePadding>
                        <ListItemButton
                          sx={{ 
                            pl: 4,
                            minHeight: 40,
                            '&.Mui-selected': {
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText',
                              '&:hover': {
                                backgroundColor: 'primary.main',
                              },
                            },
                          }}
                          selected={isActive(child.path)}
                          onClick={() => {
                            navigate(child.path);
                            if (onItemClick) onItemClick();
                          }}
                        >
                          <ListItemText 
                            primary={child.title}
                            primaryTypographyProps={{
                              fontSize: '0.8rem',
                              fontWeight: isActive(child.path) ? 600 : 400,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
      
      <Divider />
      
      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;