// Path: shared/src/services/authService.ts
// Auth service class
import {
    AuthResponse,
    LoginCredentials,
    OtpVerificationData,
    PasswordResetRequest,
    RegisterData,
    User, UserRole, UserStatus
} from "../types/auth";

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

        return {
            ...data,
            user: {
                firstName: data.user.firstName || "",
                lastName: data.user.lastName || "",
                role: data.user.role || "user",
                createdAt: data.user.createdAt || new Date().toISOString(),
                updatedAt: data.user.updatedAt || new Date().toISOString(),
                ...data.user, // Merge existing user properties
            }
        };
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
    async getCurrentUser(): Promise< User | null > {
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
            const user: Partial<User> = await response.json();
            return {
                id: user.id ?? "",  // Ensure id is always a string
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
                email: user.email ?? "",
                mobile: user.mobile ?? "",
                role: user.role ?? "user" as UserRole,  // Explicitly cast default
                status: user.status ?? "active" as UserStatus,  // Explicitly cast default
                createdAt: user.createdAt ?? new Date().toISOString(),
                updatedAt: user.updatedAt ?? new Date().toISOString(),
            };
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