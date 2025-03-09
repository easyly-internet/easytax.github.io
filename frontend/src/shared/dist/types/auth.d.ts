export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}
export declare enum UserRole {
    ADMIN = "ADMIN",
    CA = "CA",
    MEMBER = "MEMBER",
    USER = "USER"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING",
    BLOCKED = "BLOCKED"
}
export interface AuthResponse {
    user: User;
    token: string;
    refreshToken: string;
}
export interface LoginCredentials {
    email?: string;
    mobile?: string;
    password: string;
}
export interface OtpVerificationData {
    mobile: string;
    otp: string;
}
export interface PasswordResetRequest {
    email?: string;
    mobile?: string;
}
export interface RegisterData {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    password: string;
    device_id?: string;
}
