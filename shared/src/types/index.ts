// User and Authentication Types
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

// Member Types
export interface Member {
  id: string;
  userId: string;
  panNumber: string;
  fullName: string;
  email: string;
  documents?: Document[];
  financialYears?: MemberYear[];
  createdAt: string;
  updatedAt: string;
}

export interface MemberYear {
  id: string;
  memberId: string;
  financialYear: string;
  documents?: Document[];
  protectedDocuments?: ProtectedDocument[];
  receipts?: Receipt[];
  remark?: string[];
  adminRemark?: string[];
  status: MemberYearStatus;
  createdAt: string;
  updatedAt: string;
}

export enum MemberYearStatus {
  TO_BE_STARTED = 'TobeStarted',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
}

// Document Types
export interface Document {
  path: string;
  name: string;
  originalName?: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
}

export interface ProtectedDocument extends Document {
  password: string;
}

export interface Receipt extends Document {
  amount?: number;
  date?: string;
}

// Payment and Subscription Types
export interface Subscription {
  id: string;
  memberId: string;
  plan: SubscriptionPlan;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amount: number;
  status: SubscriptionStatus;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export interface Payment {
  id: string;
  memberId: string;
  subscriptionId?: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  ONE_TIME = 'ONE_TIME',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  UPI = 'UPI',
  NETBANKING = 'NETBANKING',
  WALLET = 'WALLET',
}

// AI Service Types
export interface TaxAnalysisRequest {
  memberId: string;
  financialYear: string;
  documents: Document[];
}

export interface TaxAnalysisResponse {
  memberId: string;
  financialYear: string;
  income: TaxIncomeBreakdown;
  deductions: TaxDeductionBreakdown;
  taxLiability: TaxLiabilityBreakdown;
  recommendations: TaxRecommendation[];
  summary: string;
}

export interface TaxIncomeBreakdown {
  salary: number;
  business: number;
  capitalGains: number;
  otherSources: number;
  total: number;
}

export interface TaxDeductionBreakdown {
  section80C: number;
  section80D: number;
  homeInterest: number;
  others: number;
  total: number;
}

export interface TaxLiabilityBreakdown {
  oldRegime: number;
  newRegime: number;
  recommended: 'OLD' | 'NEW';
  savings: number;
}

export interface TaxRecommendation {
  id: string;
  type: 'DEDUCTION' | 'INVESTMENT' | 'FILING';
  description: string;
  potentialSavings?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}