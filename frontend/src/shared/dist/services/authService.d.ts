import { AuthResponse, LoginCredentials, OtpVerificationData, PasswordResetRequest, RegisterData, User } from "../types/auth";
declare class AuthService {
    private apiUrl;
    register(data: RegisterData): Promise<void>;
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    verifyOTP(verificationData: OtpVerificationData): Promise<AuthResponse>;
    sendOtp(mobile: string): Promise<void>;
    resetPassword(data: PasswordResetRequest): Promise<void>;
    getCurrentUser(): Promise<User | null>;
    logout(): void;
    getToken(): string | null;
    private setToken;
    isAuthenticated(): boolean;
}
declare const authService: AuthService;
export default authService;
