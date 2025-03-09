// Path: shared/src/services/authService.ts

// User interface representing a logged-in user
export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    device_id?: string;
    created_at?: string;
    updated_at?: string;
}

// Login credentials for authentication
export interface LoginCredentials {
    email?: string;
    mobile?: string;
    password: string;
}

// Registration data for new user signup
export interface RegisterData {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    password: string;
    device_id?: string;
}

// OTP verification data
export interface OtpVerificationData {
    mobile: string;
    otp: string;
}

// Password reset request
export interface PasswordResetRequest {
    email?: string;
    mobile?: string;
}

// Auth response with token
interface AuthResponse {
    user: User;
    token: string;
}

// Auth service class
class AuthService {
    // API base URL - replace with your actual API endpoint
    private apiUrl = '/api/auth';

    // Register a new user
    async register(data: RegisterData): Promise<void> {
        const response = await fetch(`${this.apiUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }
    }

    // Login user
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await fetch(`${this.apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        this.setToken(data.token);
        return data;
    }

    // Verify OTP
    async verifyOTP(verificationData: OtpVerificationData): Promise<AuthResponse> {
        const response = await fetch(`${this.apiUrl}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(verificationData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'OTP verification failed');
        }

        const data = await response.json();
        this.setToken(data.token);
        return data;
    }

    // Send OTP to mobile number
    async sendOtp(mobile: string): Promise<void> {
        const response = await fetch(`${this.apiUrl}/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mobile }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to send OTP');
        }
    }

    // Reset password request
    async resetPassword(data: PasswordResetRequest): Promise<void> {
        const response = await fetch(`${this.apiUrl}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Password reset failed');
        }
    }

    // Get current user
    async getCurrentUser(): Promise<User | null> {
        const token = this.getToken();
        if (!token) return null;

        try {
            const response = await fetch(`${this.apiUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                this.logout();
                return null;
            }

            return await response.json();
        } catch (error) {
            this.logout();
            return null;
        }
    }

    // Logout user
    logout(): void {
        localStorage.removeItem('auth_token');
    }

    // Get token from localStorage
    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    // Set token in localStorage
    private setToken(token: string): void {
        localStorage.setItem('auth_token', token);
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

// Export a single instance of the service
const authService = new AuthService();
export default authService;