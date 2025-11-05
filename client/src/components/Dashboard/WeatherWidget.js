import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { WbSunny, Cloud, WaterDrop, Air } from '@mui/icons-material';

const WeatherWidget = ({ weather }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <WbSunny color="warning" sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h5" component="div">
              {weather?.temperature}°C
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {weather?.condition}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Chip icon={<WaterDrop />} label={weather?.humidity + '% humidity'} size="small" />
          <Chip icon={<Air />} label={weather?.windSpeed + ' km/h'} size="small" />
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
