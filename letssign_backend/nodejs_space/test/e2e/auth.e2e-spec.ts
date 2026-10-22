import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let signerToken: string;
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
        nome: 'Admin E2E',
        email: 'admin-e2e@test.com',
        telefone: '+5511999990000',
        senhaHash: await bcrypt.hash('Admin@123', 10),
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    // Criar signatário de teste
    const signer = await prisma.user.create({
      data: {
        nome: 'Signer E2E',
        email: 'signer-e2e@test.com',
        telefone: '+5511988880000',
        senhaHash: await bcrypt.hash('Signer@123', 10),
        role: Role.SIGNER,
        adminId: admin.id,
      },
    });
    signerId = signer.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('deve registrar novo admin', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nome: 'Novo Admin',
          email: 'novo-admin@test.com',
          senha: 'Senha@123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.usuario.email).toBe('novo-admin@test.com');
          expect(res.body.usuario.role).toBe('ADMIN');
        });
    });

    it('deve falhar se e-mail já existe', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nome: 'Admin Duplicado',
          email: 'admin-e2e@test.com',
          senha: 'Senha@123',
        })
        .expect(409);
    });

    it('deve falhar com validação de e-mail inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nome: 'Admin',
          email: 'email-invalido',
          senha: 'Senha@123',
        })
        .expect(400);
    });

    it('deve falhar com senha muito curta', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nome: 'Admin',
          email: 'admin2@test.com',
          senha: '123',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('deve fazer login do admin e retornar token', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin-e2e@test.com',
          senha: 'Admin@123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.usuario.role).toBe('ADMIN');
          adminToken = res.body.accessToken;
        });
    });

    it('deve fazer login do signatário e retornar token', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'signer-e2e@test.com',
          senha: 'Signer@123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.usuario.role).toBe('SIGNER');
          signerToken = res.body.accessToken;
        });
    });

    it('deve falhar com credenciais inválidas', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin-e2e@test.com',
          senha: 'SenhaErrada',
        })
        .expect(401);
    });

    it('deve falhar sem token (rotas protegidas)', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    it('deve retornar dados do admin autenticado', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('admin-e2e@test.com');
          expect(res.body.role).toBe('ADMIN');
        });
    });

    it('deve retornar dados do signatário autenticado', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${signerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('signer-e2e@test.com');
          expect(res.body.role).toBe('SIGNER');
        });
    });
  });
});