import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface DeviceFingerprint {
  userAgent: string;
  ip: string;
  platform?: string;
  language?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  stripePriceId: string;
  features: string[];
  messageLimit?: number;
}

export interface TrialStatus {
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  hoursRemaining: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
