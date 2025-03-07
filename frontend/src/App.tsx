import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Profile from './components/user/Profile';

// Placeholder components (to be implemented later)
const Dashboard = () => <div>Dashboard (To be implemented)</div>;
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
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
      </Router>
    </ThemeProvider>
  );
}

export default App;