import { Body, ConflictException, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiQuery, ApiTags, PartialType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { RegisterDto, publicUser } from '../auth/auth.module';

export class CreateSignerDto extends RegisterDto {}

export class UpdateSignerDto extends PartialType(CreateSignerDto) {
  @ApiPropertyOptional() @IsOptional() @IsString({ message: 'O nome deve ser um texto.' }) nome?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail({}, { message: 'Informe um e-mail válido.' }) email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString({ message: 'A senha deve ser um texto.' }) @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }) senha?: string;
}

@Injectable()
export class SignersService {
  constructor(private prisma: PrismaService) {}

  async findOwned(adminId: string, id: string) {
    const s = await this.prisma.user.findFirst({ where: { id, adminId, role: Role.SIGNER } });
    if (!s) throw new NotFoundException('Signatário não encontrado.');
    return s;
  }
}

@ApiTags('Signatários')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('signers')
export class SignersController {
  constructor(private prisma: PrismaService, private svc: SignersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os signatários cadastrados pelo Admin' })
  @ApiQuery({ name: 'busca', required: false })
  async list(@CurrentUser() u: AuthUser, @Query('busca') busca?: string) {
    const list = await this.prisma.user.findMany({
      where: { adminId: u.id, role: Role.SIGNER },
      orderBy: { nome: 'asc' },
    });
    
    if (busca) {
      const lower = busca.toLowerCase();
      return list
        .filter((s) => s.nome.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower))
        .map(publicUser);
    }
    
    return list.map(publicUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um signatário' })
  async get(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return publicUser(await this.svc.findOwned(u.id, id));
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um signatário (nome, e-mail, telefone, senha)' })
  async create(@CurrentUser() u: AuthUser, @Body() dto: CreateSignerDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    const s = await this.prisma.user.create({
      data: { nome: dto.nome.trim(), email, telefone: dto.telefone, senhaHash: await bcrypt.hash(dto.senha, 10), role: Role.SIGNER, adminId: u.id },
    });
    return publicUser(s);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita um signatário' })
  async update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateSignerDto) {
    await this.svc.findOwned(u.id, id);
    const data: any = {};
    if (dto.nome) data.nome = dto.nome.trim();
    if (dto.telefone !== undefined) data.telefone = dto.telefone;
    if (dto.email) {
      data.email = dto.email.toLowerCase().trim();
      const ex = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (ex && ex.id !== id) throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }
    if (dto.senha) data.senhaHash = await bcrypt.hash(dto.senha, 10);
    return publicUser(await this.prisma.user.update({ where: { id }, data }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um signatário (somente se não participa de documentos)' })
  async remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.svc.findOwned(u.id, id);
    const uso = await this.prisma.documentsigner.count({ where: { signerId: id } });
    const campos = await this.prisma.signaturefield.count({ where: { signerId: id } });
    if (uso + campos > 0) throw new ConflictException('Este signatário já está vinculado a documentos e não pode ser removido.');
    await this.prisma.user.delete({ where: { id } });
    return { mensagem: 'Signatário removido com sucesso.' };
  }
}

@Module({ controllers: [SignersController], providers: [SignersService], exports: [SignersService] })
export class SignersModule {}
