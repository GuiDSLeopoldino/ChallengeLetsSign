import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma.service';
import { Role, DocumentStatus, SignerStatus, RoleLabel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('DocumentsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let signerToken: string;
  let adminId: string;
  let signerId: string;
  let documentId: string;

  const pdfBase64 = 'JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE0OSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE5NQolJUVPRgo=';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Limpar banco de teste
    await prisma.auditevent.deleteMany();
    await prisma.signaturefield.deleteMany();
    await prisma.documentsigner.deleteMany();
    await prisma.documentversion.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();

    // Criar admin de teste
    const admin = await prisma.user.create({
      data: {
        nome: 'Admin Docs',
        email: 'admin-docs@test.com',
        telefone: '+5511999990000',
        senhaHash: await bcrypt.hash('Admin@123', 10),
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    // Criar signatário de teste
    const signer = await prisma.user.create({
      data: {
        nome: 'Signer Docs',
        email: 'signer-docs@test.com',
        telefone: '+5511988880000',
        senhaHash: await bcrypt.hash('Signer@123', 10),
        role: Role.SIGNER,
        adminId: admin.id,
      },
    });
    signerId = signer.id;

    // Login admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin-docs@test.com', senha: 'Admin@123' });
    adminToken = adminLogin.body.accessToken;

    // Login signer
    const signerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'signer-docs@test.com', senha: 'Signer@123' });
    signerToken = signerLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/documents (POST)', () => {
    it('deve criar documento rascunho com PDF', () => {
      return request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('pdf', Buffer.from(pdfBase64, 'base64'), 'test.pdf')
        .field('titulo', 'Contrato de Teste')
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.titulo).toBe('Contrato de Teste');
          expect(res.body.status).toBe(DocumentStatus.DRAFT);
          expect(res.body.totalPaginas).toBe(1);
          documentId = res.body.id;
        });
    });

    it('deve falhar sem título', () => {
      return request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('pdf', Buffer.from(pdfBase64, 'base64'), 'test.pdf')
        .expect(400);
    });

    it('deve falhar sem PDF', () => {
      return request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Sem PDF')
        .expect(400);
    });

    it('deve falhar se signatário tentar criar', () => {
      return request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${signerToken}`)
        .attach('pdf', Buffer.from(pdfBase64, 'base64'), 'test.pdf')
        .field('titulo', 'Signer tentando')
        .expect(403);
    });
  });

  describe('/documents (GET)', () => {
    it('deve listar documentos do admin', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].papel).toBe('OWNER');
        });
    });

    it('deve listar documentos do signatário', () => {
      return request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${signerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/documents/:id (GET)', () => {
    it('deve retornar detalhes do documento para admin', () => {
      return request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(documentId);
          expect(res.body.papel).toBe('OWNER');
          expect(res.body.signers).toBeDefined();
          expect(res.body.fields).toBeDefined();
        });
    });

    it('deve retornar detalhes para signatário (sem acesso em rascunho)', () => {
      return request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${signerToken}`)
        .expect(403);
    });
  });

  describe('/documents/:id/participants (PUT)', () => {
    it('deve definir participantes no rascunho', () => {
      return request(app.getHttpServer())
        .put(`/documents/${documentId}/participants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          participantes: [
            { signerId: signerId, roleLabel: RoleLabel.CONTRATADO, required: true },
          ],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.signers).toHaveLength(1);
          expect(res.body.signers[0].signerId).toBe(signerId);
        });
    });

    it('deve falhar se signatário não pertence ao admin', () => {
      return request(app.getHttpServer())
        .put(`/documents/${documentId}/participants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          participantes: [
            { signerId: '00000000-0000-0000-0000-000000000000', roleLabel: RoleLabel.CONTRATADO, required: true },
          ],
        })
        .expect(400);
    });
  });

  describe('/documents/:id/fields (POST)', () => {
    it('deve definir campos de assinatura', () => {
      return request(app.getHttpServer())
        .post(`/documents/${documentId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fields: [
            { signerId: signerId, page: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.1, required: true },
          ],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.fields).toHaveLength(1);
          expect(res.body.fields[0].signerId).toBe(signerId);
        });
    });

    it('deve validar coordenadas normalizadas', () => {
      return request(app.getHttpServer())
        .post(`/documents/${documentId}/fields`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fields: [
            { signerId: signerId, page: 1, x: 1.5, y: 0.1, width: 0.3, height: 0.1 },
          ],
        })
        .expect(400);
    });
  });

  describe('/documents/:id/send (POST)', () => {
    it('deve enviar documento com participantes e campos', () => {
      return request(app.getHttpServer())
        .post(`/documents/${documentId}/send`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mensagem: 'Por favor assine' })
        .expect(200)
        .expect((res) => {
          expect(res.body.jaEnviado).toBe(false);
          expect(res.body.documento.status).toBe(DocumentStatus.PENDING);
        });
    });

    it('deve ser idempotente (reenvio não duplica)', () => {
      return request(app.getHttpServer())
        .post(`/documents/${documentId}/send`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mensagem: 'Reenviando' })
        .expect(200)
        .expect((res) => {
          expect(res.body.jaEnviado).toBe(true);
        });
    });
  });

  describe('/documents/:id/sign (POST) - signatário', () => {
    let pendingDocId: string;

    beforeAll(async () => {
      // Criar novo documento em PENDING para testar assinatura
      const doc = await prisma.document.create({
        data: {
          ownerId: adminId,
          titulo: 'Para Assinar',
          status: DocumentStatus.PENDING,
          versao: 1,
          hashSha256: 'hash1',
          tamanhoBytes: 100,
          nomeArquivo: 'test.pdf',
          totalPaginas: 1,
          pdf: Buffer.from(pdfBase64, 'base64'),
          enviadoEm: new Date(),
        },
      });
      pendingDocId = doc.id;

      await prisma.documentsigner.create({
        data: {
          documentId: doc.id,
          signerId: signerId,
          roleLabel: RoleLabel.CONTRATADO,
          required: true,
          ordem: 0,
          invitedAt: new Date(),
        },
      });

      await prisma.signaturefield.create({
        data: {
          documentId: doc.id,
          signerId: signerId,
          page: 1,
          x: 0.1,
          y: 0.1,
          width: 0.3,
          height: 0.1,
          required: true,
          roleLabel: RoleLabel.CONTRATADO,
        },
      });
    });

    it('deve assinar documento com PNG base64 válido', () => {
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      return request(app.getHttpServer())
        .post(`/documents/${pendingDocId}/sign`)
        .set('Authorization', `Bearer ${signerToken}`)
        .send({
          assinaturaImagemBase64: pngBase64,
          gestureMetadata: { pressaoMedia: 0.5, duracaoMs: 1000 },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.mensagem).toContain('Assinatura registrada');
        });
    });

    it('deve falhar com PNG inválido', async () => {
      // Criar novo documento para este teste
      const doc = await prisma.document.create({
        data: {
          ownerId: adminId,
          titulo: 'PNG Invalido',
          status: DocumentStatus.PENDING,
          versao: 1,
          hashSha256: 'hash-png-invalid',
          tamanhoBytes: 100,
          nomeArquivo: 'test.pdf',
          totalPaginas: 1,
          pdf: Buffer.from(pdfBase64, 'base64'),
        },
      });
      await prisma.documentsigner.create({
        data: { documentId: doc.id, signerId: signerId, roleLabel: RoleLabel.CONTRATADO, required: true, ordem: 0, invitedAt: new Date() },
      });
      await prisma.signaturefield.create({
        data: { documentId: doc.id, signerId: signerId, page: 1, x: 0.1, y: 0.1, width: 0.3, height: 0.1, required: true, roleLabel: RoleLabel.CONTRATADO },
      });

      return request(app.getHttpServer())
        .post(`/documents/${doc.id}/sign`)
        .set('Authorization', `Bearer ${signerToken}`)
        .send({ assinaturaImagemBase64: 'invalid-base64' })
        .expect(400);
    });

    it('deve falhar se admin tentar assinar', () => {
      return request(app.getHttpServer())
        .post(`/documents/${pendingDocId}/sign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assinaturaImagemBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' })
        .expect(403);
    });
  });

  describe('/documents/:id/reject (POST)', () => {
    let rejectDocId: string;

    beforeAll(async () => {
      const doc = await prisma.document.create({
        data: {
          ownerId: adminId,
          titulo: 'Para Recusar',
          status: DocumentStatus.PENDING,
          versao: 1,
          hashSha256: 'hash2',
          tamanhoBytes: 100,
          nomeArquivo: 'test.pdf',
          totalPaginas: 1,
          pdf: Buffer.from(pdfBase64, 'base64'),
          enviadoEm: new Date(),
        },
      });
      rejectDocId = doc.id;

      await prisma.documentsigner.create({
        data: {
          documentId: doc.id,
          signerId: signerId,
          roleLabel: RoleLabel.TESTEMUNHA,
          required: true,
          ordem: 0,
          invitedAt: new Date(),
        },
      });

      await prisma.signaturefield.create({
        data: {
          documentId: doc.id,
          signerId: signerId,
          page: 1,
          x: 0.1,
          y: 0.1,
          width: 0.3,
          height: 0.1,
          required: true,
          roleLabel: RoleLabel.TESTEMUNHA,
        },
      });
    });

    it('deve recusar documento e cancelar se obrigatório', () => {
      return request(app.getHttpServer())
        .post(`/documents/${rejectDocId}/reject`)
        .set('Authorization', `Bearer ${signerToken}`)
        .send({ motivo: 'Cláusula incorreta' })
        .expect(200)
        .expect((res) => {
          expect(res.body.mensagem).toBe('Recusa registrada.');
          expect(res.body.documento.status).toBe(DocumentStatus.CANCELLED);
        });
    });
  });

  describe('/documents/:id/audit (GET)', () => {
    it('deve retornar trilha de auditoria', () => {
      return request(app.getHttpServer())
        .get(`/documents/${documentId}/audit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.documentId).toBe(documentId);
          expect(res.body.eventos).toBeDefined();
          expect(Array.isArray(res.body.eventos)).toBe(true);
        });
    });
  });

  describe('/documents/:id/verify (GET)', () => {
    it('deve verificar hash do documento', () => {
      return request(app.getHttpServer())
        .get(`/documents/${documentId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ hash: 'hash1' })
        .expect(200)
        .expect((res) => {
          expect(res.body.valido).toBeDefined();
        });
    });
  });

  describe('/documents/:id/file (GET)', () => {
    it('deve baixar PDF original', () => {
      return request(app.getHttpServer())
        .get(`/documents/${documentId}/file`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect('Content-Type', 'application/pdf');
    });
  });
});