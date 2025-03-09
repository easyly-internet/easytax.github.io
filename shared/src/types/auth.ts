// User and Authentication Types


// Define the authentication context
interface AuthContextType {
  user: any;
  login: (credentials: { email?: string; mobile?: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

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


// Registration data for new user signup
export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  password: string;
  device_id?: string;
}
