// User and Authentication Types
import {createContext} from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  error: string | null;
}

// ✅ Use `undefined` to enforce provider usage:
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export enum UserRole {
  ADMIN = 'ADMIN',
  CA = 'CA',
  MEMBER = 'MEMBER',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
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


