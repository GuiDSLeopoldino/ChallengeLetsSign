import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, Document, Signer, SignDto, RejectDto } from '../types';

const API_URL = __DEV__ 
  ? 'http://10.0.2.2:3000'  // Android emulator
  : 'https://api.letssign.com';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.multiRemove(['accessToken', 'user']);
        }
        return Promise.reject(error);
      }
    );
  }

  async setAuthToken(token: string, user?: any) {
    await AsyncStorage.setItem('accessToken', token);
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
  }

  async clearAuth() {
    await AsyncStorage.multiRemove(['accessToken', 'user']);
  }

  async getToken() {
    return AsyncStorage.getItem('accessToken');
  }

  async getUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Auth
  async register(data: { nome: string; email: string; telefone?: string; senha: string }): Promise<AuthResponse> {
    const { data: response } = await this.client.post<AuthResponse>('/auth/register', data);
    return response;
  }

  async login(email: string, senha: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', { email, senha });
    return data;
  }

  async me() {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  // Signers
  async listSigners(busca?: string): Promise<Signer[]> {
    const { data } = await this.client.get<Signer[]>('/signers', { params: { busca } });
    return data;
  }

  async createSigner(data: { nome: string; email: string; telefone?: string; senha: string }) {
    const { data: response } = await this.client.post('/signers', data);
    return response;
  }

  // Documents
  async listDocuments(status?: string, situacao?: string): Promise<Document[]> {
    const { data } = await this.client.get<Document[]>('/documents', { params: { status, situacao } });
    return data;
  }

  async createDocument(formData: FormData): Promise<Document> {
    const { data } = await this.client.post<Document>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async getDocument(id: string): Promise<Document> {
    const { data } = await this.client.get<Document>(`/documents/${id}`);
    return data;
  }

  async sendDocument(id: string, data?: any) {
    const { data: response } = await this.client.post(`/documents/${id}/send`, data);
    return response;
  }

  async signDocument(id: string, data: SignDto) {
    const { data: response } = await this.client.post(`/documents/${id}/sign`, data);
    return response;
  }

  async rejectDocument(id: string, data: RejectDto) {
    const { data: response } = await this.client.post(`/documents/${id}/reject`, data);
    return response;
  }

  async downloadDocument(id: string, tipo: 'original' | 'final' = 'original'): Promise<Blob> {
    const { data } = await this.client.get(`/documents/${id}/file`, {
      params: { tipo },
      responseType: 'blob',
    });
    return data;
  }

  async getAudit(id: string) {
    const { data } = await this.client.get(`/documents/${id}/audit`);
    return data;
  }
}

export const api = new ApiService();
export default api;