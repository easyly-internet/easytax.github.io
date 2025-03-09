import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import AuthProvider
import { AuthProvider } from './context/AuthProvider';

// Auth components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Profile from './components/user/Profile';

// Placeholder components
import DashboardWithProvider from './components/Dashboard/Dashboard'
// const Dashboard = () => <div>Dashboard (To be implemented)</div>;
const MemberList = () => <div>Member List (To be implemented)</div>;
const Documents = () => <div>Documents (To be implemented)</div>;
const FileTax = () => <div>File Tax (To be implemented)</div>;
const Unauthorized = () => <div>Unauthorized - You don't have permission to access this page</div>;
const NotFound = () => <div>404 - Page Not Found</div>;

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
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
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
      <Router>
      <AuthProvider> {/* ✅ Wrap App with AuthProvider */}
        <ThemeProvider theme={theme}>
          <CssBaseline />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                // <ProtectedRoute>
                  <DashboardWithProvider />
                // </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              <Route path="/members" element={
                <ProtectedRoute requiredRole={['Admin', 'CA']}>
                  <MemberList />
                </ProtectedRoute>
              } />

              <Route path="/documents" element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              } />

              <Route path="/file-tax" element={
                <ProtectedRoute>
                  <FileTax />
                </ProtectedRoute>
              } />

              {/* Redirect root to dashboard if logged in, otherwise to login */}
              <Route path="/" element={<Navigate replace to="/dashboard" />} />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
        </ThemeProvider>
      </AuthProvider>
      </Router>
  );
}

export default App;
