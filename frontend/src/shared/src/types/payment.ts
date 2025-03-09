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