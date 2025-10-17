import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Pets as AnimalsIcon,
  Grass as FieldsIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Task as TaskIcon,
  Baby as BirthIcon,
  WbSunny as WeatherIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useFarm } from '../../contexts/FarmContext';
import axios from 'axios';

// Components
import StatCard from '../../components/Dashboard/StatCard';
import WeatherWidget from '../../components/Dashboard/WeatherWidget';
import AlertsList from '../../components/Dashboard/AlertsList';
import TasksList from '../../components/Dashboard/TasksList';
import RecentBirths from '../../components/Dashboard/RecentBirths';
import PerformanceChart from '../../components/Dashboard/PerformanceChart';

const Dashboard = () => {
  const { selectedFarm } = useFarm();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    ['dashboard', selectedFarm?.id],
    async () => {
      if (!selectedFarm?.id) return null;
      const response = await axios.get(`/api/dashboard/farm/${selectedFarm.id}`);
      return response.data;
    },
    {
      enabled: !!selectedFarm?.id,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (!selectedFarm) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Farm Management System
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please select a farm to view the dashboard.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard - {selectedFarm.name}
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard - {selectedFarm.name}
        </Typography>
        <Typography color="error">
          Error loading dashboard data: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard - {selectedFarm.name}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Key Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Animals"
            value={dashboardData?.animals?.total || 0}
            icon={<AnimalsIcon />}
            color="primary"
            subtitle={`${dashboardData?.animals?.byStatus?.active || 0} active`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Fields"
            value={dashboardData?.fields?.active || 0}
            icon={<FieldsIcon />}
            color="success"
            subtitle={`${dashboardData?.fields?.total || 0} total fields`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={dashboardData?.inventory?.lowStockItems || 0}
            icon={<InventoryIcon />}
            color="warning"
            subtitle="Need reordering"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Profit"
            value={`$${((dashboardData?.financial?.monthlyIncome || 0) - (dashboardData?.financial?.monthlyExpenses || 0)).toLocaleString()}`}
            icon={<TrendingUpIcon />}
            color="info"
            subtitle="This month"
          />
        </Grid>

        {/* Weather Widget */}
        <Grid item xs={12} md={4}>
          <WeatherWidget weather={dashboardData?.weather} />
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>
              <AlertsList alerts={dashboardData?.alerts || []} />
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Tasks
              </Typography>
              <TasksList tasks={dashboardData?.upcomingTasks || []} />
            </CardContent>
          </Card>
        </Grid>

        {/* Animal Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Animal Status Overview
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(dashboardData?.animals?.byStatus || {}).map(([status, count]) => (
                  <Grid item xs={6} key={status}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {status}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Births */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Births (Last 30 Days)
              </Typography>
              <RecentBirths births={dashboardData?.recentBirths || []} />
            </CardContent>
          </Card>
        </Grid>

        {/* Health Records Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Health Records (Last 30 Days)
              </Typography>
              <List dense>
                {Object.entries(dashboardData?.health?.recentRecords || {}).map(([type, count]) => (
                  <ListItem key={type}>
                    <ListItemText
                      primary={type.replace('_', ' ').toUpperCase()}
                      secondary={`${count} records`}
                    />
                    <Chip label={count} size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Status Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Task Status Overview
              </Typography>
              <List dense>
                {Object.entries(dashboardData?.tasks?.byStatus || {}).map(([status, count]) => (
                  <ListItem key={status}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getStatusColor(status), width: 32, height: 32 }}>
                        <TaskIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={status.replace('_', ' ').toUpperCase()}
                      secondary={`${count} tasks`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Farm Performance Overview
              </Typography>
              <PerformanceChart farmId={selectedFarm.id} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success.main';
    case 'in_progress':
      return 'warning.main';
    case 'pending':
      return 'info.main';
    case 'cancelled':
      return 'error.main';
    default:
      return 'grey.500';
  }
};

export default Dashboard;