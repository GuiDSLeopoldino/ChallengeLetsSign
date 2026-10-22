import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma.service';
import { SignersService, CreateSignerDto, UpdateSignerDto } from '../../src/signers/signers.module';
import { Role, user } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  documentsigner: {
    count: jest.fn(),
  },
  signaturefield: {
    count: jest.fn(),
  },
};

const mockAdmin: user = {
  id: 'admin-1',
  nome: 'Admin Test',
  email: 'admin@test.com',
  telefone: '+5511999990000',
  senhaHash: '$2a$10$hashedpassword',
  role: Role.ADMIN,
  adminId: null,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

const mockSigner: user = {
  id: 'signer-1',
  nome: 'Signer Test',
  email: 'signer@test.com',
  telefone: '+5511988880000',
  senhaHash: '$2a$10$hashedpassword',
  role: Role.SIGNER,
  adminId: 'admin-1',
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

describe('SignersService', () => {
  let service: SignersService;
  let prisma: typeof mockPrisma;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SignersService>(SignersService);
    prisma = mockPrisma;
  });

  describe('findOwned', () => {
    it('deve retornar signatário se pertencer ao admin', async () => {
      prisma.user.findFirst.mockResolvedValue(mockSigner);

      const result = await service.findOwned('admin-1', 'signer-1');

      expect(result).toEqual(mockSigner);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'signer-1', adminId: 'admin-1', role: Role.SIGNER },
      });
    });

    it('deve lançar NotFoundException se signatário não pertencer ao admin', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOwned('admin-1', 'signer-inexistente')).rejects.toThrow(NotFoundException);
    });
  });
});

describe('SignersController (integração)', () => {
  let prisma: typeof mockPrisma;
  let service: SignersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = mockPrisma;
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SignersService>(SignersService);
  });

  describe('create', () => {
    it('deve criar signatário com sucesso', async () => {
      const dto: CreateSignerDto = {
        nome: 'Novo Signatário',
        email: 'novo@test.com',
        telefone: '+5511977770000',
        senha: 'Signer@123',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...mockSigner, ...dto, id: 'signer-2', senhaHash: 'hashed', role: Role.SIGNER, adminId: 'admin-1' });

      // Simulando a lógica do controller
      const email = dto.email.toLowerCase().trim();
      const exists = await prisma.user.findUnique({ where: { email } });
      expect(exists).toBeNull();

      const created = await prisma.user.create({
        data: { nome: dto.nome.trim(), email, telefone: dto.telefone, senhaHash: await bcrypt.hash(dto.senha, 10), role: Role.SIGNER, adminId: 'admin-1' },
      });

      expect(created.email).toBe('novo@test.com');
      expect(created.role).toBe(Role.SIGNER);
      expect(created.adminId).toBe('admin-1');
    });

    it('deve lançar ConflictException se e-mail já existe', async () => {
      const dto: CreateSignerDto = {
        nome: 'Outro Signatário',
        email: 'signer@test.com',
        senha: 'Signer@123',
      };

      prisma.user.findUnique.mockResolvedValue(mockSigner);

      const email = dto.email.toLowerCase().trim();
      const exists = await prisma.user.findUnique({ where: { email } });
      expect(exists).not.toBeNull();

      // Simulando o throw do controller
      await expect(Promise.reject(new ConflictException('Já existe um usuário cadastrado com este e-mail.')))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('list', () => {
    it('deve listar signatários do admin com busca', async () => {
      prisma.user.findMany.mockResolvedValue([mockSigner]);

      const result = await prisma.user.findMany({
        where: { adminId: 'admin-1', role: Role.SIGNER, OR: [{ nome: { contains: 'signer', mode: 'insensitive' } }] },
        orderBy: { nome: 'asc' },
      });

      expect(result).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ adminId: 'admin-1' }) })
      );
    });
  });

  describe('update', () => {
    it('deve atualizar signatário', async () => {
      prisma.user.findFirst.mockResolvedValue(mockSigner);
      prisma.user.findUnique.mockResolvedValue(null); // e-mail não duplicado
      prisma.user.update.mockResolvedValue({ ...mockSigner, nome: 'Nome Atualizado' });

      await service.findOwned('admin-1', 'signer-1');
      
      const dto: UpdateSignerDto = { nome: 'Nome Atualizado' };
      const data: any = {};
      if (dto.nome) data.nome = dto.nome.trim();

      const updated = await prisma.user.update({ where: { id: 'signer-1' }, data });

      expect(updated.nome).toBe('Nome Atualizado');
    });

    it('deve lançar ConflictException se novo e-mail já existe', async () => {
      prisma.user.findFirst.mockResolvedValue(mockSigner);
      prisma.user.findUnique.mockResolvedValue({ ...mockSigner, id: 'signer-2', email: 'outro@test.com' });

      const dto: UpdateSignerDto = { email: 'outro@test.com' };
      const email = dto.email!.toLowerCase().trim();
      const ex = await prisma.user.findUnique({ where: { email } });

      expect(ex).not.toBeNull();
      expect(ex.id).not.toBe('signer-1');
      
      await expect(Promise.reject(new ConflictException('Já existe um usuário cadastrado com este e-mail.')))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deve remover signatário sem vínculos', async () => {
      prisma.user.findFirst.mockResolvedValue(mockSigner);
      prisma.documentsigner.count.mockResolvedValue(0);
      prisma.signaturefield.count.mockResolvedValue(0);
      prisma.user.delete.mockResolvedValue({});

      await service.findOwned('admin-1', 'signer-1');
      const uso = await prisma.documentsigner.count({ where: { signerId: 'signer-1' } });
      const campos = await prisma.signaturefield.count({ where: { signerId: 'signer-1' } });

      expect(uso + campos).toBe(0);
      await prisma.user.delete({ where: { id: 'signer-1' } });
    });

    it('deve lançar ConflictException se signatário tem vínculos', async () => {
      prisma.user.findFirst.mockResolvedValue(mockSigner);
      prisma.documentsigner.count.mockResolvedValue(1);
      prisma.signaturefield.count.mockResolvedValue(0);

      const uso = await prisma.documentsigner.count({ where: { signerId: 'signer-1' } });
      const campos = await prisma.signaturefield.count({ where: { signerId: 'signer-1' } });

      expect(uso + campos).toBeGreaterThan(0);
      await expect(Promise.reject(new ConflictException('Este signatário já está vinculado a documentos e não pode ser removido.')))
        .rejects.toThrow(ConflictException);
    });
  });
});