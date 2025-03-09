// Document Types
export interface Document {
  id: string;
  path: string;
  name: string;
  originalName?: string;
  type?: string;
  isProtected?: boolean;
  size?: number;
  downloadUrl?: string;
  uploadedAt?: string;
}

export interface ProtectedDocument extends Document {
  password: string;
}

export interface Receipt extends Document {
  amount?: number;
  date?: string;
}