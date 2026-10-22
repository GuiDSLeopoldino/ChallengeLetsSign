import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('SignersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminId: string;
  let signerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Limpar banco
    await prisma.auditevent.deleteMany();
    await prisma.signaturefield.deleteMany();
    await prisma.documentsigner.deleteMany();
    await prisma.documentversion.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();

    // Criar admin
    const admin = await prisma.user.create({
      data: {
        nome: 'Admin Signers',
        email: 'admin-signers@test.com',
        telefone: '+5511999990000',
        senhaHash: await bcrypt.hash('Admin@123', 10),
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    // Login
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin-signers@test.com', senha: 'Admin@123' });
    adminToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/signers (POST)', () => {
    it('deve criar signatário', () => {
      return request(app.getHttpServer())
        .post('/signers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Novo Signatário',
          email: 'novo-signer@test.com',
          telefone: '+5511977770000',
          senha: 'Signer@123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe('novo-signer@test.com');
          expect(res.body.role).toBe('SIGNER');
          signerId = res.body.id;
        });
    });

    it('deve falhar se e-mail já existe', () => {
      return request(app.getHttpServer())
        .post('/signers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Outro',
          email: 'novo-signer@test.com',
          senha: 'Signer@123',
        })
        .expect(409);
    });

    it('deve falhar com validação', () => {
      return request(app.getHttpServer())
        .post('/signers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: '',
          email: 'invalido',
          senha: '123',
        })
        .expect(400);
    });
  });

  describe('/signers (GET)', () => {
    it('deve listar signatários do admin', () => {
      return request(app.getHttpServer())
        .get('/signers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('deve filtrar por busca', () => {
      return request(app.getHttpServer())
        .get('/signers?busca=novo')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.some((s: any) => s.nome.includes('Novo'))).toBe(true);
        });
    });
  });

  describe('/signers/:id (GET)', () => {
    it('deve retornar detalhes do signatário', () => {
      return request(app.getHttpServer())
        .get(`/signers/${signerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(signerId);
          expect(res.body.email).toBe('novo-signer@test.com');
        });
    });

    it('deve falhar se signatário não pertence ao admin', () => {
      return request(app.getHttpServer())
        .get('/signers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/signers/:id (PATCH)', () => {
    it('deve atualizar signatário', () => {
      return request(app.getHttpServer())
        .patch(`/signers/${signerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Nome Atualizado', telefone: '+5511966660000' })
        .expect(200)
        .expect((res) => {
          expect(res.body.nome).toBe('Nome Atualizado');
          expect(res.body.telefone).toBe('+5511966660000');
        });
    });

    it('deve atualizar senha', () => {
      return request(app.getHttpServer())
        .patch(`/signers/${signerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ senha: 'NovaSenha@123' })
        .expect(200);
    });

    it('deve falhar se novo e-mail já existe', async () => {
      // Criar outro signatário
      await prisma.user.create({
        data: {
          nome: 'Outro Signer',
          email: 'outro@test.com',
          senhaHash: await bcrypt.hash('Signer@123', 10),
          role: Role.SIGNER,
          adminId: adminId,
        },
      });

      return request(app.getHttpServer())
        .patch(`/signers/${signerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'outro@test.com' })
        .expect(409);
    });
  });

  describe('/signers/:id (DELETE)', () => {
    let signerToDeleteId: string;

    beforeAll(async () => {
      const signer = await prisma.user.create({
        data: {
          nome: 'Para Deletar',
          email: 'deletar@test.com',
          senhaHash: await bcrypt.hash('Signer@123', 10),
          role: Role.SIGNER,
          adminId: adminId,
        },
      });
      signerToDeleteId = signer.id;
    });

    it('deve remover signatário sem vínculos', () => {
      return request(app.getHttpServer())
        .delete(`/signers/${signerToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.mensagem).toBe('Signatário removido com sucesso.');
        });
    });

    it('deve falhar se signatário tem vínculos', async () => {
      const signerComVinculo = await prisma.user.create({
        data: {
          nome: 'Com Vinculo',
          email: 'vinculo@test.com',
          senhaHash: await bcrypt.hash('Signer@123', 10),
          role: Role.SIGNER,
          adminId: adminId,
        },
      });

      const doc = await prisma.document.create({
        data: {
          ownerId: adminId,
          titulo: 'Doc Vinculo',
          status: 'DRAFT',
          versao: 1,
          hashSha256: 'hash',
          tamanhoBytes: 100,
          nomeArquivo: 'test.pdf',
          totalPaginas: 1,
          pdf: Buffer.from('test'),
        },
      });

      await prisma.documentsigner.create({
        data: {
          documentId: doc.id,
          signerId: signerComVinculo.id,
          roleLabel: 'CONTRATADO',
          required: true,
          ordem: 0,
        },
      });

      return request(app.getHttpServer())
        .delete(`/signers/${signerComVinculo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });
  });
});