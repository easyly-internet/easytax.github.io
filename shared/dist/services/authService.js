"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthService {
    constructor() {
        this.apiUrl = '/api/auth';
    }
    async register(data) {
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
    async login(credentials) {
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
                ...data.user,
            }
        };
    }
    async verifyOTP(verificationData) {
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
    async sendOtp(mobile) {
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
    async resetPassword(data) {
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
    async getCurrentUser() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const token = this.getToken();
        if (!token)
            return null;
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
            const user = await response.json();
            return {
                id: (_a = user.id) !== null && _a !== void 0 ? _a : "",
                firstName: (_b = user.firstName) !== null && _b !== void 0 ? _b : "",
                lastName: (_c = user.lastName) !== null && _c !== void 0 ? _c : "",
                email: (_d = user.email) !== null && _d !== void 0 ? _d : "",
                mobile: (_e = user.mobile) !== null && _e !== void 0 ? _e : "",
                role: (_f = user.role) !== null && _f !== void 0 ? _f : "user",
                status: (_g = user.status) !== null && _g !== void 0 ? _g : "active",
                createdAt: (_h = user.createdAt) !== null && _h !== void 0 ? _h : new Date().toISOString(),
                updatedAt: (_j = user.updatedAt) !== null && _j !== void 0 ? _j : new Date().toISOString(),
            };
        }
        catch (error) {
            this.logout();
            return null;
        }
    }
    logout() {
        localStorage.removeItem('auth_token');
    }
    getToken() {
        return localStorage.getItem('auth_token');
    }
    setToken(token) {
        localStorage.setItem('auth_token', token);
    }
    isAuthenticated() {
        return !!this.getToken();
    }
}
const authService = new AuthService();
exports.default = authService;
//# sourceMappingURL=authService.js.map