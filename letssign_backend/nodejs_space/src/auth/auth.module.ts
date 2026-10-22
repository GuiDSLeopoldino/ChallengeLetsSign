import { Body, Controller, Get, Injectable, Module, UnauthorizedException, ConflictException, Post, HttpCode } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { Role, user } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { AuthUser, CurrentUser, Public } from '../common/auth';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Admin' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome completo é obrigatório.' })
  @MaxLength(150, { message: 'O nome deve ter no máximo 150 caracteres.' })
  nome!: string;

  @ApiProperty({ example: 'maria@empresa.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @ApiPropertyOptional({ example: '+5511999990000' })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser um texto.' })
  telefone?: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  senha!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@letssign.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString({ message: 'A senha deve ser um texto.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  senha!: string;
}

export function publicUser(u: user) {
  return { id: u.id, nome: u.nome, email: u.email, telefone: u.telefone, role: u.role, criadoEm: u.criadoEm };
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private async token(u: user) {
    const accessToken = await this.jwt.signAsync({ sub: u.id, role: u.role });
    return { accessToken, tokenType: 'Bearer', expiresIn: 7 * 24 * 3600, usuario: publicUser(u) };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }
    const u = await this.prisma.user.create({
      data: { nome: dto.nome.trim(), email, telefone: dto.telefone, senhaHash: await bcrypt.hash(dto.senha, 10), role: Role.ADMIN },
    });
    return this.token(u);
  }

  async login(dto: LoginDto) {
    const u = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!u || !(await bcrypt.compare(dto.senha, u.senhaHash))) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }
    return this.token(u);
  }
}

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private prisma: PrismaService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastra um novo usuário ADMIN e retorna o token' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login por e-mail e senha (Admin ou Signatário)' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  async me(@CurrentUser() cu: AuthUser) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: cu.id } });
    return publicUser(u);
  }
}

@Module({ controllers: [AuthController], providers: [AuthService] })
export class AuthModule {}
