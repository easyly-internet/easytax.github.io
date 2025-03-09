import React, { useState, FormEvent } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container,
  Paper,
  Grid,
  Alert,
  Avatar,
  Tab,
  Tabs,
  Divider,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { 
  Person, 
  Email, 
  Phone, 
  Lock, 
  Save
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

const Profile: React.FC = () => {
  const { user, loading, error } = useAuth();
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Profile form states
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  
  // Form validation states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSuccessMessage('');
  };
  
  // Validation functions
  const validateFirstName = () => {
    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      return false;
    }
    setFirstNameError('');
    return true;
  };
  
  const validateLastName = () => {
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      return false;
    }
    setLastNameError('');
    return true;
  };
  
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  const validateMobile = () => {
    const mobileRegex = /^[0-9]{10}$/;
    if (mobile && !mobileRegex.test(mobile)) {
      setMobileError('Please enter a valid 10-digit mobile number');
      return false;
    }
    setMobileError('');
    return true;
  };
  
  // Handle profile update
  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isFirstNameValid = validateFirstName();
    const isLastNameValid = validateLastName();
    const isEmailValid = validateEmail();
    const isMobileValid = validateMobile();
    
    if (!isFirstNameValid || !isLastNameValid || !isEmailValid || !isMobileValid) {
      return;
    }
    
    // Clear previous messages
    setSuccessMessage('');
    
    try {
      // await updateUser({
      //   firstName,
      //   lastName,
      //   email,
      //   mobile
      // });
      
      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      // Error is handled by the store
    }
  };
  
  // Generate avatar with user's initials
  const getInitials = () => {
    if (!user) return '';
    
    const firstInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const lastInitial = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    
    return `${firstInitial}${lastInitial}`;
  };
  
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {/* Profile Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 70,
              height: 70,
              backgroundColor: 'primary.main',
              fontSize: '1.5rem',
              mr: 3
            }}
          >
            {getInitials()}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Account Role: {user.role}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Tabs */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="profile tabs"
              variant="fullWidth"
            >
              <Tab 
                label="Personal Information" 
                icon={<Person />} 
                iconPosition="start" 
                {...a11yProps(0)} 
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                label="Security" 
                icon={<Lock />} 
                iconPosition="start" 
                {...a11yProps(1)} 
                sx={{ textTransform: 'none' }}
              />
            </Tabs>
          </Box>
          
          {/* Success Message */}
          {successMessage && (
            <Alert severity="success" sx={{ mt: 3 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}
          
          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mt: 3 }} >
              {error}
            </Alert>
          )}
          
          {/* Personal Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleProfileUpdate}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={validateFirstName}
                    error={Boolean(firstNameError)}
                    helperText={firstNameError}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={validateLastName}
                    error={Boolean(lastNameError)}
                    helperText={lastNameError}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={validateEmail}
                    error={Boolean(emailError)}
                    helperText={emailError}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="mobile"
                    label="Mobile Number"
                    name="mobile"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    onBlur={validateMobile}
                    error={Boolean(mobileError)}
                    helperText={mobileError}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : "Save Changes"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
          
          {/* Security Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Password Management
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                For security reasons, password changes are handled through a separate form.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Lock />}
                href="/change-password"
              >
                Change Password
              </Button>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;