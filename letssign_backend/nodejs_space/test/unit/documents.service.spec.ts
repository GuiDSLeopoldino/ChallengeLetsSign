import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma.service';
import { DocumentsService } from '../../src/documents/documents.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { Role, DocumentStatus, SignerStatus, AuditType, RoleLabel } from '@prisma/client';
import * as crypto from 'crypto';

// Mock do PrismaService
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  document: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  },
  documentsigner: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  signaturefield: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  documentversion: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditevent: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

// Mock do NotificationsService
const mockNotifications = {
  notifyDocumentSent: jest.fn().mockResolvedValue({}),
  notifySignerSigned: jest.fn().mockResolvedValue({}),
  notifyDocumentCompleted: jest.fn().mockResolvedValue({}),
  notifyDocumentRejected: jest.fn().mockResolvedValue({}),
  notifyDocumentCancelled: jest.fn().mockResolvedValue({}),
  sendNewVersion: jest.fn().mockResolvedValue({}),
};

const mockUser = {
  id: 'user-1',
  email: 'admin@test.com',
  nome: 'Admin Test',
  role: Role.ADMIN,
};

const mockSigner = {
  id: 'signer-1',
  email: 'signer@test.com',
  nome: 'Signer Test',
  role: Role.SIGNER,
  adminId: 'user-1',
};

const mockDocument = {
  id: 'doc-1',
  ownerId: 'user-1',
  titulo: 'Test Document',
  status: DocumentStatus.DRAFT,
  versao: 1,
  hashSha256: 'hash123',
  tamanhoBytes: 1000,
  nomeArquivo: 'test.pdf',
  totalPaginas: 2,
  pdf: Buffer.from('pdf-content'),
  pdfFinal: null,
  hashFinal: null,
  mensagem: null,
  criadoEm: new Date(),
  enviadoEm: null,
  concluidoEm: null,
  atualizadoEm: new Date(),
  owner: mockUser,
};

const mockParticipant = {
  id: 'part-1',
  documentId: 'doc-1',
  signerId: 'signer-1',
  status: SignerStatus.PENDING,
  roleLabel: RoleLabel.CONTRATADO,
  required: true,
  ordem: 0,
  invitedAt: null,
  viewedAt: null,
  signedAt: null,
  rejectedAt: null,
  motivoRecusa: null,
  assinaturaImagemBase64: null,
  gestureMetadata: null,
  ip: null,
  userAgent: null,
  signer: mockSigner,
};

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prisma = mockPrisma;
  });

  describe('create', () => {
    it('deve criar um documento rascunho com sucesso', async () => {
      const mockFile = {
        buffer: Buffer.from('%PDF-1.4 test content'),
        originalname: 'test.pdf',
      };
      
      const mockValidatePdf = jest.spyOn(await import('../../src/documents/pdf.util'), 'validatePdf');
      mockValidatePdf.mockResolvedValue({ pages: 2, sizes: [{ w: 595, h: 842 }, { w: 595, h: 842 }] });
      
      const mockSha256 = jest.spyOn(await import('../../src/documents/pdf.util'), 'sha256');
      mockSha256.mockReturnValue('sha256-hash');

      const createdDoc = { ...mockDocument, id: 'doc-new', hashSha256: 'sha256-hash' };
      prisma.document.create.mockResolvedValue(createdDoc);
      prisma.documentversion.create.mockResolvedValue({});
      prisma.auditevent.create.mockResolvedValue({});

      const result = await service.create(mockUser, 'Test Document', mockFile as any, { ip: '127.0.0.1', userAgent: 'test' });

      expect(result.titulo).toBe('Test Document');
      expect(result.status).toBe(DocumentStatus.DRAFT);
      expect(result.id).toBe('doc-new');
      expect(prisma.document.create).toHaveBeenCalled();
      expect(prisma.documentversion.create).toHaveBeenCalled();
      expect(prisma.auditevent.create).toHaveBeenCalled();
    });

    it('deve lançar erro se título não for informado', async () => {
      const mockFile = { buffer: Buffer.from('%PDF-1.4'), originalname: 'test.pdf' };
      
      await expect(service.create(mockUser, '', mockFile as any, { ip: '127.0.0.1', userAgent: 'test' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('list', () => {
    it('deve listar documentos do admin', async () => {
      const docWithSigners = { ...mockDocument, signers: [] };
      prisma.document.findMany.mockResolvedValue([docWithSigners]);

      const result = await service.list(mockUser);

      expect(result).toHaveLength(1);
      expect(result[0].papel).toBe('OWNER');
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: 'user-1' } })
      );
    });
  });

  describe('detail', () => {
    it('deve retornar detalhes do documento para o dono', async () => {
      const fullDoc = {
        ...mockDocument,
        owner: mockUser,
        signers: [mockParticipant],
        fields: [],
        events: [],
        versions: [],
      };
      prisma.document.findUniqueOrThrow.mockResolvedValue(fullDoc);
      prisma.document.findUnique.mockResolvedValue(mockDocument);
      prisma.documentsigner.findUnique.mockResolvedValue(null);

      const result = await service.detail(mockUser, 'doc-1', { ip: '127.0.0.1', userAgent: 'test' });

      expect(result.id).toBe('doc-1');
      expect(result.papel).toBe('OWNER');
    });

    it('deve lançar NotFoundException se documento não existir', async () => {
      prisma.document.findUnique.mockResolvedValue(null);
      prisma.document.findUniqueOrThrow.mockRejectedValue(new NotFoundException('Documento não encontrado.'));

      await expect(service.detail(mockUser, 'doc-inexistente', { ip: '127.0.0.1', userAgent: 'test' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('setParticipants', () => {
    it('deve definir participantes no rascunho', async () => {
      prisma.document.findUnique.mockResolvedValue({ ...mockDocument, status: DocumentStatus.DRAFT });
      prisma.user.findMany.mockResolvedValue([mockSigner]);
      prisma.documentsigner.deleteMany.mockResolvedValue({ count: 0 });
      prisma.documentsigner.createMany.mockResolvedValue({ count: 1 });
      prisma.signaturefield.deleteMany.mockResolvedValue({ count: 0 });
      
      // Mock detail call
      const fullDoc = {
        ...mockDocument,
        status: DocumentStatus.DRAFT,
        owner: mockUser,
        signers: [mockParticipant],
        fields: [],
        events: [],
        versions: [],
      };
      prisma.document.findUniqueOrThrow.mockResolvedValue(fullDoc);
      prisma.documentsigner.findMany.mockResolvedValue([mockParticipant]);
      prisma.signaturefield.findMany.mockResolvedValue([]);
      prisma.auditevent.findMany.mockResolvedValue([]);
      prisma.documentversion.findMany.mockResolvedValue([]);

      const participants = [{ signerId: 'signer-1', roleLabel: RoleLabel.CONTRATADO, required: true }];
      const result = await service.setParticipants(mockUser, 'doc-1', participants, { ip: '127.0.0.1', userAgent: 'test' });

      expect(prisma.documentsigner.deleteMany).toHaveBeenCalled();
      expect(prisma.documentsigner.createMany).toHaveBeenCalled();
    });

    it('deve lançar erro se documento não estiver em rascunho', async () => {
      prisma.document.findUnique.mockResolvedValue({ ...mockDocument, status: DocumentStatus.PENDING });

      await expect(service.setParticipants(mockUser, 'doc-1', [], { ip: '127.0.0.1', userAgent: 'test' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('send', () => {
    it('deve enviar documento com validações', async () => {
      const docWithParts = { ...mockDocument, status: DocumentStatus.DRAFT };
      prisma.document.findUnique.mockResolvedValue(docWithParts);
      prisma.user.findMany.mockResolvedValue([mockSigner]);
      
      // First call: inside transaction (documentsigner.findMany)
      prisma.documentsigner.findMany
        .mockResolvedValueOnce([mockParticipant])
        // Second call: detail at the end
        .mockResolvedValueOnce([mockParticipant]);
      
      // First call: inside transaction (signaturefield.findMany)
      prisma.signaturefield.findMany
        .mockResolvedValueOnce([
          { id: 'field-1', documentId: 'doc-1', signerId: 'signer-1', page: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.1, required: true, roleLabel: RoleLabel.CONTRATADO }
        ])
        // Second call: detail at the end
        .mockResolvedValueOnce([]);
      
      prisma.document.updateMany.mockResolvedValue({ count: 1 });
      prisma.documentsigner.updateMany.mockResolvedValue({ count: 1 });
      prisma.documentversion.update.mockResolvedValue({});
      prisma.auditevent.create.mockResolvedValue({});
      
      // Mock detail call
      const fullDoc = {
        ...docWithParts,
        status: DocumentStatus.PENDING,
        owner: mockUser,
        signers: [mockParticipant],
        fields: [{ id: 'field-1', documentId: 'doc-1', signerId: 'signer-1', page: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.1, required: true, roleLabel: RoleLabel.CONTRATADO }],
        events: [],
        versions: [],
      };
      prisma.document.findUniqueOrThrow.mockResolvedValue(fullDoc);
      prisma.auditevent.findMany.mockResolvedValue([]);
      prisma.documentversion.findMany.mockResolvedValue([]);

      const result = await service.send(mockUser, 'doc-1', { mensagem: 'Test' }, { ip: '127.0.0.1', userAgent: 'test' });

      expect(result.jaEnviado).toBe(false);
      expect(prisma.document.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'doc-1', status: DocumentStatus.DRAFT } })
      );
    });

    it('deve retornar jaEnviado=true se já enviado', async () => {
      const docSent = { ...mockDocument, status: DocumentStatus.PENDING };
      prisma.document.findUnique.mockResolvedValue(docSent);
      
      // Mock detail call
      const fullDoc = {
        ...docSent,
        owner: mockUser,
        signers: [mockParticipant],
        fields: [],
        events: [],
        versions: [],
      };
      prisma.document.findUniqueOrThrow.mockResolvedValue(fullDoc);
      prisma.documentsigner.findMany.mockResolvedValue([mockParticipant]);
      prisma.signaturefield.findMany.mockResolvedValue([]);
      prisma.auditevent.findMany.mockResolvedValue([]);
      prisma.documentversion.findMany.mockResolvedValue([]);

      const result = await service.send(mockUser, 'doc-1', {}, { ip: '127.0.0.1', userAgent: 'test' });

      expect(result.jaEnviado).toBe(true);
    });
  });

  describe('sign', () => {
    it('deve assinar documento com PNG válido', async () => {
      const participantPending = { ...mockParticipant, status: SignerStatus.PENDING };
      const docPending = { ...mockDocument, status: DocumentStatus.PENDING };
      
      prisma.document.findUnique.mockResolvedValue(docPending);
      prisma.documentsigner.findUnique.mockResolvedValue(participantPending);
      prisma.documentsigner.updateMany.mockResolvedValue({ count: 1 });
      prisma.auditevent.create.mockResolvedValue({});
      prisma.documentsigner.findMany.mockResolvedValue([
        { ...mockParticipant, status: SignerStatus.SIGNED, required: true }
      ]);
      prisma.document.update.mockResolvedValue({ ...docPending, status: DocumentStatus.COMPLETED });

      // Mock finalize
      const finalDoc = {
        ...docPending,
        fields: [{ signerId: 'signer-1', page: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.1 }],
        signers: [{ ...mockParticipant, status: SignerStatus.SIGNED, assinaturaImagemBase64: 'base64png', signedAt: new Date(), signer: mockSigner }],
      };
      prisma.document.findUniqueOrThrow.mockResolvedValue(finalDoc);
      prisma.document.update.mockResolvedValue({});

      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const result = await service.sign(
        { ...mockUser, id: 'signer-1', role: Role.SIGNER },
        'doc-1',
        { assinaturaImagemBase64: pngBase64 },
        { ip: '127.0.0.1', userAgent: 'test' }
      );

      expect(result.mensagem).toContain('Assinatura registrada');
    });

    it('deve lançar erro se PNG inválido', async () => {
      const participantPending = { ...mockParticipant, status: SignerStatus.PENDING };
      const docPending = { ...mockDocument, status: DocumentStatus.PENDING };
      
      prisma.document.findUnique.mockResolvedValue(docPending);
      prisma.documentsigner.findUnique.mockResolvedValue(participantPending);

      await expect(service.sign(
        { ...mockUser, id: 'signer-1', role: Role.SIGNER },
        'doc-1',
        { assinaturaImagemBase64: 'invalid-base64' },
        { ip: '127.0.0.1', userAgent: 'test' }
      )).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('deve recusar documento e cancelar se obrigatório', async () => {
      const participantPending = { ...mockParticipant, status: SignerStatus.PENDING, required: true };
      const docPending = { ...mockDocument, status: DocumentStatus.PENDING };
      
      prisma.document.findUnique.mockResolvedValue(docPending);
      prisma.documentsigner.findUnique.mockResolvedValue(participantPending);
      prisma.documentsigner.update.mockResolvedValue({});
      prisma.document.update.mockResolvedValue({ ...docPending, status: DocumentStatus.CANCELLED });
      prisma.auditevent.create.mockResolvedValue({});
      
      // Mock detail call
      const fullDoc = {
        ...docPending,
        status: DocumentStatus.CANCELLED,
        owner: mockUser,
        signers: [mockParticipant],
        fields: [],
        events: [],
        versions: [],
      };
      prisma.document.findUniqueOrThrow.mockResolvedValue(fullDoc);
      prisma.documentsigner.findMany.mockResolvedValue([mockParticipant]);
      prisma.signaturefield.findMany.mockResolvedValue([]);
      prisma.auditevent.findMany.mockResolvedValue([]);
      prisma.documentversion.findMany.mockResolvedValue([]);

      const result = await service.reject(
        { ...mockUser, id: 'signer-1', role: Role.SIGNER },
        'doc-1',
        'Motivo da recusa',
        { ip: '127.0.0.1', userAgent: 'test' }
      );

      expect(result.mensagem).toBe('Recusa registrada.');
      expect(prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: DocumentStatus.CANCELLED } })
      );
    });
  });

  describe('audit', () => {
    it('deve retornar trilha de auditoria', async () => {
      prisma.document.findUnique.mockResolvedValue(mockDocument);
      prisma.auditevent.findMany.mockResolvedValue([
        { id: 'evt-1', documentId: 'doc-1', tipo: AuditType.CREATED, actorId: 'user-1', actorRole: Role.ADMIN, descricao: 'Created', versao: 1, timestamp: new Date(), ip: '127.0.0.1', hashDocumentoNoMomento: 'hash123', metadados: {} }
      ]);

      const result = await service.audit(mockUser, 'doc-1');

      expect(result.eventos).toHaveLength(1);
      expect(result.hashAtual).toBe('hash123');
    });
  });

  describe('verify', () => {
    it('deve verificar hash do documento final', async () => {
      const docWithFinal = { ...mockDocument, hashFinal: 'final-hash' };
      prisma.document.findUnique.mockResolvedValue(docWithFinal);
      prisma.documentversion.findMany.mockResolvedValue([]);

      const result = await service.verify(mockUser, 'doc-1', 'final-hash');

      expect(result.valido).toBe(true);
      expect(result.tipo).toBe('DOCUMENTO_FINAL_ASSINADO');
    });

    it('deve verificar hash de versão original', async () => {
      prisma.document.findUnique.mockResolvedValue(mockDocument);
      prisma.documentversion.findMany.mockResolvedValue([
        { versao: 1, hashSha256: 'version-hash' }
      ]);

      const result = await service.verify(mockUser, 'doc-1', 'version-hash');

      expect(result.valido).toBe(true);
      expect(result.tipo).toBe('ORIGINAL');
      expect(result.versao).toBe(1);
    });
  });
});