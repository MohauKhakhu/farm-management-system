import React from 'react';
import { Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ farmId }) => {
  // Mock data - replace with actual API call
  const data = [
    { month: 'Jan', animals: 100, production: 85, health: 92 },
    { month: 'Feb', animals: 120, production: 78, health: 88 },
    { month: 'Mar', animals: 150, production: 92, health: 95 },
    { month: 'Apr', animals: 180, production: 88, health: 90 },
    { month: 'May', animals: 200, production: 95, health: 93 },
    { month: 'Jun', animals: 220, production: 90, health: 91 },
  ];

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="animals" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="production" stroke="#82ca9d" />
          <Line type="monotone" dataKey="health" stroke="#ffc658" />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PerformanceChart;