import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: false,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = this.refreshToken();
            }
            const newToken = await this.refreshTokenPromise;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.refreshTokenPromise = null;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    });
    const { accessToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  }

  private logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  // Auth
  async register(data: { nome: string; email: string; telefone?: string; senha: string }) {
    const response = await this.client.post('/auth/register', data);
    this.setAuth(response.data);
    return response.data;
  }

  async login(email: string, senha: string) {
    const response = await this.client.post('/auth/login', { email, senha });
    this.setAuth(response.data);
    return response.data;
  }

  async me() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  private setAuth(data: { accessToken: string; usuario: any }) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.usuario));
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  getUser(): any {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  clearAuth() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }

  // Documents
  async createDocument(file: File, titulo: string) {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('titulo', titulo);
    const response = await this.client.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async listDocuments(params?: { status?: string; situacao?: string }) {
    const response = await this.client.get('/documents', { params });
    return response.data;
  }

  async getDocument(id: string) {
    const response = await this.client.get(`/documents/${id}`);
    return response.data;
  }

  async downloadDocument(id: string, tipo: 'original' | 'final' = 'original') {
    const response = await this.client.get(`/documents/${id}/file`, {
      params: { tipo },
      responseType: 'blob',
    });
    return response.data;
  }

  async setParticipants(id: string, participantes: Array<{ signerId: string; roleLabel: string; required?: boolean }>) {
    const response = await this.client.put(`/documents/${id}/participants`, { participantes });
    return response.data;
  }

  async setFields(id: string, fields: Array<{
    signerId: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required?: boolean;
    roleLabel?: string;
  }>) {
    const response = await this.client.post(`/documents/${id}/fields`, { fields });
    return response.data;
  }

  async sendDocument(id: string, data?: { mensagem?: string; participantes?: any[]; fields?: any[] }) {
    const response = await this.client.post(`/documents/${id}/send`, data || {});
    return response.data;
  }

  async newVersion(id: string, file: File, titulo?: string) {
    const formData = new FormData();
    formData.append('pdf', file);
    if (titulo) formData.append('titulo', titulo);
    const response = await this.client.post(`/documents/${id}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async signDocument(id: string, assinaturaImagemBase64: string, gestureMetadata?: any) {
    const response = await this.client.post(`/documents/${id}/sign`, {
      assinaturaImagemBase64,
      gestureMetadata,
    });
    return response.data;
  }

  async rejectDocument(id: string, motivo: string) {
    const response = await this.client.post(`/documents/${id}/reject`, { motivo });
    return response.data;
  }

  async getAudit(id: string) {
    const response = await this.client.get(`/documents/${id}/audit`);
    return response.data;
  }

  async verifyHash(id: string, hash: string) {
    const response = await this.client.get(`/documents/${id}/verify`, { params: { hash } });
    return response.data;
  }

  // Signers
  async listSigners(busca?: string) {
    const response = await this.client.get('/signers', { params: { busca } });
    return response.data;
  }

  async getSigner(id: string) {
    const response = await this.client.get(`/signers/${id}`);
    return response.data;
  }

  async createSigner(data: { nome: string; email: string; telefone?: string; senha: string }) {
    const response = await this.client.post('/signers', data);
    return response.data;
  }

  async updateSigner(id: string, data: { nome?: string; email?: string; telefone?: string; senha?: string }) {
    const response = await this.client.patch(`/signers/${id}`, data);
    return response.data;
  }

  async deleteSigner(id: string) {
    const response = await this.client.delete(`/signers/${id}`);
    return response.data;
  }
}

export const api = new ApiClient();

// Tipos
export type DocumentStatus = 'DRAFT' | 'PENDING' | 'PARTIALLY_SIGNED' | 'COMPLETED' | 'CANCELLED';
export type SignerStatus = 'PENDING' | 'VIEWED' | 'SIGNED' | 'REJECTED';
export type RoleLabel = 'CONTRATANTE' | 'CONTRATADO' | 'TESTEMUNHA';

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: 'ADMIN' | 'SIGNER';
  criadoEm: string;
}

export interface Document {
  id: string;
  ownerId: string;
  titulo: string;
  status: DocumentStatus;
  versao: number;
  hashSha256: string;
  tamanhoBytes: number;
  nomeArquivo: string;
  totalPaginas: number;
  mensagem?: string;
  criadoEm: string;
  enviadoEm?: string;
  concluidoEm?: string;
  papel?: 'OWNER' | 'SIGNER';
  minhaSituacao?: string;
  meuPapel?: string;
  assinadoEm?: string;
  totalSignatarios?: number;
  assinados?: number;
  hashFinal?: string;
  signers?: Participant[];
  fields?: SignatureField[];
}

export interface Participant {
  id: string;
  documentId: string;
  signerId: string;
  status: 'PENDING' | 'VIEWED' | 'SIGNED' | 'REJECTED';
  roleLabel: 'CONTRATANTE' | 'CONTRATADO' | 'TESTEMUNHA';
  required: boolean;
  ordem: number;
  invitedAt?: string;
  viewedAt?: string;
  signedAt?: string;
  rejectedAt?: string;
  motivoRecusa?: string;
  signer: User;
  gestureMetadata?: any;
}

export interface SignatureField {
  id: string;
  documentId: string;
  signerId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  roleLabel: string;
}

export interface AuditEvent {
  id: string;
  documentId: string;
  tipo: string;
  actorId?: string;
  actorRole?: string;
  descricao: string;
  versao: number;
  timestamp: string;
  ip?: string;
  hashDocumentoNoMomento?: string;
  metadados?: any;
}