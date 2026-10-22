import { Body, Controller, Get, HttpCode, Module, Param, ParseUUIDPipe, Post, Put, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DocumentStatus, Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { AuthUser, clientIp, CurrentUser, Roles } from '../common/auth';
import { DocumentsService } from './documents.service';
import { RejectDto, SendDto, SetFieldsDto, SetParticipantsDto, SignDto } from './dto';

const ctxOf = (req: Request) => ({ ip: clientIp(req), userAgent: (req.headers['user-agent'] as string) ?? null });
const uuid = new ParseUUIDPipe({ exceptionFactory: () => new (require('@nestjs/common').BadRequestException)('ID de documento inválido.') });
const pdfUpload = FileInterceptor('pdf', { limits: { fileSize: 15 * 1024 * 1024 } });
const uploadBody = {
  schema: { type: 'object', required: ['pdf'], properties: { pdf: { type: 'string', format: 'binary' }, titulo: { type: 'string' } } },
};

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseInterceptors(pdfUpload)
  @ApiConsumes('multipart/form-data')
  @ApiBody(uploadBody)
  @ApiOperation({ summary: 'Cria documento (rascunho) a partir de upload de PDF (campo "pdf") + titulo' })
  create(@CurrentUser() u: AuthUser, @UploadedFile() file: Express.Multer.File, @Body('titulo') titulo: string, @Req() req: Request) {
    return this.svc.create(u, titulo, file, ctxOf(req));
  }

  @Get()
  @ApiOperation({ summary: 'Lista documentos. Admin: os que criou. Signatário: os recebidos.' })
  @ApiQuery({ name: 'status', enum: DocumentStatus, required: false })
  @ApiQuery({ name: 'situacao', enum: ['pendentes', 'assinados', 'recusados'], required: false, description: 'Somente para signatário' })
  list(@CurrentUser() u: AuthUser, @Query('status') status?: DocumentStatus, @Query('situacao') situacao?: string) {
    if (status && !Object.values(DocumentStatus).includes(status)) status = undefined;
    return this.svc.list(u, status, situacao);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe com participantes, campos, eventos e versões (signatário: marca como visualizado)' })
  detail(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @Req() req: Request) {
    return this.svc.detail(u, id, ctxOf(req));
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Baixa o PDF (tipo=original padrão, ou tipo=final para o assinado)' })
  @ApiQuery({ name: 'tipo', enum: ['original', 'final'], required: false })
  async file(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @Query('tipo') tipo: string, @Res() res: Response) {
    const { buf, nome } = await this.svc.file(u, id, tipo);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(nome)}"`);
    res.end(buf);
  }

  @Put(':id/participants')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Define/substitui os participantes (somente rascunho)' })
  participants(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @Body() dto: SetParticipantsDto, @Req() req: Request) {
    return this.svc.setParticipants(u, id, dto.participantes, ctxOf(req));
  }

  @Post(':id/fields')
  @Roles(Role.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Define/substitui em lote os campos de assinatura (coordenadas normalizadas 0..1, origem no topo-esquerdo)' })
  fields(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @Body() dto: SetFieldsDto, @Req() req: Request) {
    return this.svc.setFields(u, id, dto.fields, ctxOf(req));
  }

  @Post(':id/send')
  @Roles(Role.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: 'Valida e envia o documento (idempotente: reenvio não duplica solicitações)' })
  send(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @Body() dto: SendDto, @Req() req: Request) {
    return this.svc.send(u, id, dto, ctxOf(req));
  }

  @Post(':id/version')
  @Roles(Role.ADMIN)
  @UseInterceptors(pdfUpload)
  @ApiConsumes('multipart/form-data')
  @ApiBody(uploadBody)
  @ApiOperation({ summary: 'Envia novo PDF: cria nova versão, preserva a anterior e reinicia o fluxo (volta a rascunho)' })
  version(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @UploadedFile() file: Express.Multer.File, @Body('titulo') titulo: string, @Req() req: Request) {
    return this.svc.newVersion(u, id, file, titulo, ctxOf(req));
  }

  @Post(':id/sign')
  @Roles(Role.SIGNER)
  @HttpCode(200)
  @ApiOperation({ summary: 'Signatário assina (PNG base64 + metadados do gesto). Conclui e gera PDF final quando todos assinarem.' })
  sign(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @Body() dto: SignDto, @Req() req: Request) {
    return this.svc.sign(u, id, dto, ctxOf(req));
  }

  @Post(':id/reject')
  @Roles(Role.SIGNER)
  @HttpCode(200)
  @ApiOperation({ summary: 'Signatário recusa o documento (cancela se for obrigatório)' })
  reject(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @Body() dto: RejectDto, @Req() req: Request) {
    return this.svc.reject(u, id, dto.motivo, ctxOf(req));
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Trilha de auditoria completa (eventos com hash SHA-256 e carimbo de tempo)' })
  audit(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string) {
    return this.svc.audit(u, id);
  }

  @Get(':id/verify')
  @ApiOperation({ summary: 'Verifica se um hash SHA-256 corresponde a alguma versão ou ao documento final' })
  @ApiQuery({ name: 'hash', required: true })
  verify(@CurrentUser() u: AuthUser, @Param('id', uuid) id: string, @Query('hash') hash: string) {
    return this.svc.verify(u, id, hash ?? '');
  }
}

@Module({ controllers: [DocumentsController], providers: [DocumentsService] })
export class DocumentsModule {}
