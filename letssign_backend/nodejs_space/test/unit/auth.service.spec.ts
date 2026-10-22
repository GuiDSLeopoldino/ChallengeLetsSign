import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../src/prisma.service';
import { AuthService, RegisterDto, LoginDto } from '../../src/auth/auth.module';
import { Role, user } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

const mockUser: user = {
  id: 'user-1',
  nome: 'Admin Test',
  email: 'admin@test.com',
  telefone: '+5511999990000',
  senhaHash: '$2a$10$hashedpassword',
  role: Role.ADMIN,
  adminId: null,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof mockPrisma;
  let jwt: typeof mockJwtService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = mockPrisma;
    jwt = mockJwtService;
  });

  describe('register', () => {
    it('deve registrar novo usuário ADMIN com sucesso', async () => {
      const dto: RegisterDto = {
        nome: 'Maria Admin',
        email: 'maria@empresa.com',
        telefone: '+5511999990000',
        senha: 'Senha@123',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({ ...mockUser, email: 'maria@empresa.com' });
      jwt.signAsync.mockResolvedValue('jwt-token-123');

      const result = await service.register(dto);

      expect(result.accessToken).toBe('jwt-token-123');
      expect(result.usuario.email).toBe('maria@empresa.com');
      expect(result.usuario.role).toBe(Role.ADMIN);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'maria@empresa.com',
            role: Role.ADMIN,
          }),
        })
      );
      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1', role: Role.ADMIN })
      );
    });

    it('deve lançar ConflictException se e-mail já existe', async () => {
      const dto: RegisterDto = {
        nome: 'Maria Admin',
        email: 'admin@test.com',
        senha: 'Senha@123',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('deve normalizar e-mail para lowercase', async () => {
      const dto: RegisterDto = {
        nome: 'Maria Admin',
        email: 'MARIA@EMPRESA.COM',
        senha: 'Senha@123',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...mockUser, email: 'maria@empresa.com' });
      jwt.signAsync.mockResolvedValue('jwt-token-123');

      await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'maria@empresa.com' } });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ email: 'maria@empresa.com' }) })
      );
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const dto: LoginDto = {
        email: 'admin@test.com',
        senha: 'Admin@123',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('jwt-token-123');

      const result = await service.login(dto);

      expect(result.accessToken).toBe('jwt-token-123');
      expect(result.usuario.id).toBe('user-1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'admin@test.com' } });
    });

    it('deve lançar UnauthorizedException se usuário não existe', async () => {
      const dto: LoginDto = {
        email: 'inexistente@test.com',
        senha: 'Senha@123',
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se senha incorreta', async () => {
      const dto: LoginDto = {
        email: 'admin@test.com',
        senha: 'SenhaErrada',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('deve normalizar e-mail para lowercase no login', async () => {
      const dto: LoginDto = {
        email: 'ADMIN@TEST.COM',
        senha: 'Admin@123',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwt.signAsync.mockResolvedValue('jwt-token-123');

      await service.login(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'admin@test.com' } });
    });
  });
});