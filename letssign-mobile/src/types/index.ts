export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: 'ADMIN' | 'SIGNER';
  criadoEm: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: User;
}

export interface Document {
  id: string;
  ownerId: string;
  titulo: string;
  status: 'DRAFT' | 'PENDING' | 'PARTIALLY_SIGNED' | 'COMPLETED' | 'CANCELLED';
  versao: number;
  hashSha256: string;
  tamanhoBytes: number;
  nomeArquivo: string;
  totalPaginas: number;
  hashFinal?: string;
  mensagem?: string;
  criadoEm: string;
  enviadoEm?: string;
  concluidoEm?: string;
  atualizadoEm: string;
  owner?: User;
  signers?: DocumentSigner[];
  fields?: SignatureField[];
  events?: AuditEvent[];
  versions?: DocumentVersion[];
  papel?: 'OWNER' | 'SIGNER';
  minhaSituacao?: string;
  meuPapel?: string;
  assinadoEm?: string;
  totalSignatarios?: number;
  assinados?: number;
  possuiDocumentoFinal?: boolean;
  todosCampos?: number;
}

export interface DocumentSigner {
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
  assinaturaImagemBase64?: string;
  gestureMetadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  signer: User;
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
  roleLabel: 'CONTRATANTE' | 'CONTRATADO' | 'TESTEMUNHA';
  criadoEm: string;
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
  metadados?: Record<string, unknown>;
}

export interface DocumentVersion {
  versao: number;
  hashSha256: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  criadoEm: string;
}

export interface Signer {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: 'SIGNER';
  criadoEm: string;
}

export interface SignDto {
  assinaturaImagemBase64: string;
  gestureMetadata?: Record<string, unknown>;
}

export interface RejectDto {
  motivo: string;
}