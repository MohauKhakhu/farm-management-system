import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { FarmProvider } from './contexts/FarmContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Animals from './../../server/routes/animals';
import Health from './../../server/routes/health';
import Breeding from './../../server/routes/breeding';
import Fields from './../../server/routes/fields';
import Feed from './../../server/routes/feed';
import Inventory from './../../server/routes/inventory';
import Iot from './../../server/routes/iot';
import Blockchain from './server/routes/blockchain';
import Financial from './../../server/routes/financial';
import Workforce from './../../server/routes/workforce';
import Sustainability from './../../server/routes/sustainability';
import Reports from './../../server/routes/reports';
import Settings from './../../server/routes/feed';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
        <AuthProvider>
          <FarmProvider>
            <Router>
              <Routes>
                {/* Layout wraps all routes that should have sidebar/header */}
                <Route path="/" element={<Layout />}>
                  {/* Default route - shows Dashboard when path is exactly "/" */}
                  <Route index element={<Dashboard />} />
                  
                  {/* All other routes */}
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="animals" element={<Animals />} />
                  <Route path="health" element={<Health />} />
                  <Route path="breeding" element={<Breeding />} />
                  <Route path="fields" element={<Fields />} />
                  <Route path="feed" element={<Feed />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="iot" element={<Iot />} />
                  <Route path="blockchain" element={<Blockchain />} />
                  <Route path="financial" element={<Financial />} />
                  <Route path="workforce" element={<Workforce />} />
                  <Route path="sustainability" element={<Sustainability />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                
                {/* Add routes without layout if needed (login, etc.) */}
                {/* <Route path="/login" element={<Login />} /> */}
              </Routes>
            </Router>
          </FarmProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;