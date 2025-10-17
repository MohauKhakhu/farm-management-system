import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { FarmProvider } from './contexts/FarmContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Animals from './pages/Animals/Animals';
import AnimalDetail from './pages/Animals/AnimalDetail';
import Breeding from './pages/Breeding/Breeding';
import Inventory from './pages/Inventory/Inventory';
import Feed from './pages/Feed/Feed';
import Health from './pages/Health/Health';
import Fields from './pages/Fields/Fields';
import IoT from './pages/IoT/IoT';
import Financial from './pages/Financial/Financial';
import Workforce from './pages/Workforce/Workforce';
import Sustainability from './pages/Sustainability/Sustainability';
import Blockchain from './pages/Blockchain/Blockchain';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32', // Green for agriculture
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#FF6F00', // Orange accent
      light: '#FF8F00',
      dark: '#E65100',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider 
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <AuthProvider>
            <FarmProvider>
              <Router>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    
                    {/* Animal Management */}
                    <Route path="animals" element={<Animals />} />
                    <Route path="animals/:id" element={<AnimalDetail />} />
                    
                    {/* Breeding Management */}
                    <Route path="breeding" element={<Breeding />} />
                    
                    {/* Inventory Management */}
                    <Route path="inventory" element={<Inventory />} />
                    
                    {/* Feed Management */}
                    <Route path="feed" element={<Feed />} />
                    
                    {/* Health Management */}
                    <Route path="health" element={<Health />} />
                    
                    {/* Field Management */}
                    <Route path="fields" element={<Fields />} />
                    
                    {/* IoT & Sensors */}
                    <Route path="iot" element={<IoT />} />
                    
                    {/* Financial Management */}
                    <Route path="financial" element={<Financial />} />
                    
                    {/* Workforce Management */}
                    <Route path="workforce" element={<Workforce />} />
                    
                    {/* Sustainability */}
                    <Route path="sustainability" element={<Sustainability />} />
                    
                    {/* Blockchain */}
                    <Route path="blockchain" element={<Blockchain />} />
                    
                    {/* Reports */}
                    <Route path="reports" element={<Reports />} />
                    
                    {/* Settings */}
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  
                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Router>
            </FarmProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;