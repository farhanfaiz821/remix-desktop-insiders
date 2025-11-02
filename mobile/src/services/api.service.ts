import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL, API_ENDPOINTS } from '../config/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_URL}${API_ENDPOINTS.REFRESH}`, {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data.data;

              await SecureStore.setItemAsync('accessToken', accessToken);
              await SecureStore.setItemAsync('refreshToken', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async signup(email: string, password: string, phone?: string) {
    const response = await this.api.post(API_ENDPOINTS.SIGNUP, {
      email,
      password,
      phone,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post(API_ENDPOINTS.LOGIN, {
      email,
      password,
    });
    return response.data;
  }

  async logout() {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      await this.api.post(API_ENDPOINTS.LOGOUT, { refreshToken });
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
  }

  async getProfile() {
    const response = await this.api.get(API_ENDPOINTS.PROFILE);
    return response.data;
  }

  async sendOtp(phone: string) {
    const response = await this.api.post(API_ENDPOINTS.SEND_OTP, { phone });
    return response.data;
  }

  async verifyOtp(phone: string, code: string) {
    const response = await this.api.post(API_ENDPOINTS.VERIFY_OTP, { phone, code });
    return response.data;
  }

  // Chat methods
  async sendMessage(message: string) {
    const response = await this.api.post(API_ENDPOINTS.CHAT, { message });
    return response.data;
  }

  async getChatHistory(limit = 50, offset = 0) {
    const response = await this.api.get(API_ENDPOINTS.CHAT_HISTORY, {
      params: { limit, offset },
    });
    return response.data;
  }

  async deleteMessage(id: string) {
    const response = await this.api.delete(API_ENDPOINTS.CHAT_DELETE(id));
    return response.data;
  }

  async exportChat(format: 'json' | 'csv' | 'txt' = 'json') {
    const response = await this.api.get(API_ENDPOINTS.CHAT_EXPORT, {
      params: { format },
    });
    return response.data;
  }

  // Subscription methods
  async createCheckoutSession(plan: string) {
    const response = await this.api.post(API_ENDPOINTS.CHECKOUT, { plan });
    return response.data;
  }

  async getSubscription() {
    const response = await this.api.get(API_ENDPOINTS.SUBSCRIPTION);
    return response.data;
  }

  async cancelSubscription() {
    const response = await this.api.post(API_ENDPOINTS.CANCEL_SUBSCRIPTION);
    return response.data;
  }

  async getPlans() {
    const response = await this.api.get(API_ENDPOINTS.PLANS);
    return response.data;
  }
}

export default new ApiService();
