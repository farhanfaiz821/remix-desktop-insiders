import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
export const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || 'pk_test_1234567890';

export const API_ENDPOINTS = {
  // Auth
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  
  // Chat
  CHAT: '/chat',
  CHAT_HISTORY: '/chat/history',
  CHAT_EXPORT: '/chat/export',
  CHAT_DELETE: (id: string) => `/chat/${id}`,
  
  // Stripe
  CHECKOUT: '/stripe/checkout-session',
  SUBSCRIPTION: '/stripe/subscription',
  CANCEL_SUBSCRIPTION: '/stripe/cancel',
  PLANS: '/stripe/plans',
};
