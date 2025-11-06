import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { FarmProvider } from './contexts/FarmContext'; // Make sure this path is correct
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';

// Create a React Query client
const queryClient = new QueryClient();

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', // Green theme for farm management
    },
    secondary: {
      main: '#ff9800', // Orange accent
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FarmProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* Add more routes as needed */}
              </Routes>
            </Layout>
          </Router>
        </FarmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;