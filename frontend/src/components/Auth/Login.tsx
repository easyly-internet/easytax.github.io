import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    TextField,
    Button,
    Typography,
    Container,
    Paper,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Phone,
    Email,
    Lock
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, error, loading } = useAuth();

    // Form states
    const [identifier, setIdentifier] = useState(''); // Email or mobile
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [identifierType, setIdentifierType] = useState<'email' | 'mobile'>('email');

    // Form validation states
    const [identifierError, setIdentifierError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Validation functions
    const validateIdentifier = () => {
        if (!identifier) {
            setIdentifierError('Email or Mobile number is required');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileRegex = /^[0-9]{10}$/;

        if (emailRegex.test(identifier)) {
            setIdentifierType('email');
            setIdentifierError('');
            return true;
        } else if (mobileRegex.test(identifier)) {
            setIdentifierType('mobile');
            setIdentifierError('');
            return true;
        } else {
            setIdentifierError('Please enter a valid email or 10-digit mobile number');
            return false;
        }
    };

    const validatePassword = () => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validate form
        const isIdentifierValid = validateIdentifier();
        const isPasswordValid = validatePassword();

        if (!isIdentifierValid || !isPasswordValid) {
            return;
        }

        // Clear any previous errors
        // clearError();

        try {
            // Determine if identifier is email or mobile and call login
            const loginData = {
                [identifierType]: identifier,
                password
            };

            await login(loginData);

            // Navigate to dashboard on successful login
            navigate('/dashboard');
        } catch (err) {
            // Error handling is managed by useAuthStore
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                        Sign In
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="identifier"
                            label="Email or Mobile Number"
                            name="identifier"
                            autoComplete="email"
                            autoFocus
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            onBlur={validateIdentifier}
                            error={!!identifierError}
                            helperText={identifierError}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        {identifierType === 'email' ? <Email /> : <Phone />}
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={validatePassword}
                            error={!!passwordError}
                            helperText={passwordError}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={toggleShowPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Sign In'
                            )}
                        </Button>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                                <Typography variant="body2" color="primary">
                                    Forgot password?
                                </Typography>
                            </Link>
                        </Box>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2">
                                Don't have an account?{' '}
                                <Link to="/register" style={{ textDecoration: 'none', color: 'primary.main' }}>
                                    Sign Up
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Login;