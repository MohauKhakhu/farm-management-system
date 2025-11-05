import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { WbSunny, Cloud, WaterDrop, Air } from '@mui/icons-material';

const WeatherWidget = ({ weather }) => {
  if (!weather) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Weather
          </Typography>
          <Typography color="text.secondary">
            Weather data not available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'sunny': return <WbSunny />;
      case 'cloudy': return <Cloud />;
      case 'rainy': return <WaterDrop />;
      default: return <WbSunny />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Current Weather
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2, fontSize: '3rem' }}>
            {getWeatherIcon(weather.condition)}
          </Box>
          <Box>
            <Typography variant="h4">{weather.temperature}°C</Typography>
            <Typography color="text.secondary">{weather.condition}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip icon={<WaterDrop />} label={`${weather.humidity}% Humidity`} size="small" />
          <Chip icon={<Air />} label={`${weather.windSpeed} km/h Wind`} size="small" />
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;