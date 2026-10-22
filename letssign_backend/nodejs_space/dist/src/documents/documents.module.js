"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsModule = exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const auth_1 = require("../common/auth");
const documents_service_1 = require("./documents.service");
const dto_1 = require("./dto");
const ctxOf = (req) => ({ ip: (0, auth_1.clientIp)(req), userAgent: req.headers['user-agent'] ?? null });
const uuid = new common_1.ParseUUIDPipe({ exceptionFactory: () => new (require('@nestjs/common').BadRequestException)('ID de documento inválido.') });
const pdfUpload = (0, platform_express_1.FileInterceptor)('pdf', { limits: { fileSize: 15 * 1024 * 1024 } });
const uploadBody = {
    schema: { type: 'object', required: ['pdf'], properties: { pdf: { type: 'string', format: 'binary' }, titulo: { type: 'string' } } },
};
let DocumentsController = class DocumentsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    create(u, file, titulo, req) {
        return this.svc.create(u, titulo, file, ctxOf(req));
    }
    list(u, status, situacao) {
        if (status && !Object.values(client_1.DocumentStatus).includes(status))
            status = undefined;
        return this.svc.list(u, status, situacao);
    }
    detail(u, id, req) {
        return this.svc.detail(u, id, ctxOf(req));
    }
    async file(u, id, tipo, res) {
        const { buf, nome } = await this.svc.file(u, id, tipo);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', buf.length);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(nome)}"`);
        res.end(buf);
    }
    participants(u, id, dto, req) {
        return this.svc.setParticipants(u, id, dto.participantes, ctxOf(req));
    }
    fields(u, id, dto, req) {
        return this.svc.setFields(u, id, dto.fields, ctxOf(req));
    }
    send(u, id, dto, req) {
        return this.svc.send(u, id, dto, ctxOf(req));
    }
    version(u, id, file, titulo, req) {
        return this.svc.newVersion(u, id, file, titulo, ctxOf(req));
    }
    sign(u, id, dto, req) {
        return this.svc.sign(u, id, dto, ctxOf(req));
    }
    reject(u, id, dto, req) {
        return this.svc.reject(u, id, dto.motivo, ctxOf(req));
    }
    audit(u, id) {
        return this.svc.audit(u, id);
    }
    verify(u, id, hash) {
        return this.svc.verify(u, id, hash ?? '');
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseInterceptors)(pdfUpload),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)(uploadBody),
    (0, swagger_1.ApiOperation)({ summary: 'Cria documento (rascunho) a partir de upload de PDF (campo "pdf") + titulo' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('titulo')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lista documentos. Admin: os que criou. Signatário: os recebidos.' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: client_1.DocumentStatus, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'situacao', enum: ['pendentes', 'assinados', 'recusados'], required: false, description: 'Somente para signatário' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('situacao')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalhe com participantes, campos, eventos e versões (signatário: marca como visualizado)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "detail", null);
__decorate([
    (0, common_1.Get)(':id/file'),
    (0, swagger_1.ApiOperation)({ summary: 'Baixa o PDF (tipo=original padrão, ou tipo=final para o assinado)' }),
    (0, swagger_1.ApiQuery)({ name: 'tipo', enum: ['original', 'final'], required: false }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.Query)('tipo')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "file", null);
__decorate([
    (0, common_1.Put)(':id/participants'),
    (0, auth_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Define/substitui os participantes (somente rascunho)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.SetParticipantsDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "participants", null);
__decorate([
    (0, common_1.Post)(':id/fields'),
    (0, auth_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Define/substitui em lote os campos de assinatura (coordenadas normalizadas 0..1, origem no topo-esquerdo)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.SetFieldsDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "fields", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, auth_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Valida e envia o documento (idempotente: reenvio não duplica solicitações)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.SendDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "send", null);
__decorate([
    (0, common_1.Post)(':id/version'),
    (0, auth_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.UseInterceptors)(pdfUpload),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)(uploadBody),
    (0, swagger_1.ApiOperation)({ summary: 'Envia novo PDF: cria nova versão, preserva a anterior e reinicia o fluxo (volta a rascunho)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)('titulo')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "version", null);
__decorate([
    (0, common_1.Post)(':id/sign'),
    (0, auth_1.Roles)(client_1.Role.SIGNER),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Signatário assina (PNG base64 + metadados do gesto). Conclui e gera PDF final quando todos assinarem.' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.SignDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "sign", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, auth_1.Roles)(client_1.Role.SIGNER),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Signatário recusa o documento (cancela se for obrigatório)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.RejectDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)(':id/audit'),
    (0, swagger_1.ApiOperation)({ summary: 'Trilha de auditoria completa (eventos com hash SHA-256 e carimbo de tempo)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "audit", null);
__decorate([
    (0, common_1.Get)(':id/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verifica se um hash SHA-256 corresponde a alguma versão ou ao documento final' }),
    (0, swagger_1.ApiQuery)({ name: 'hash', required: true }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid)),
    __param(2, (0, common_1.Query)('hash')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "verify", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)('Documentos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
let DocumentsModule = class DocumentsModule {
};
exports.DocumentsModule = DocumentsModule;
exports.DocumentsModule = DocumentsModule = __decorate([
    (0, common_1.Module)({ controllers: [DocumentsController], providers: [documents_service_1.DocumentsService] })
], DocumentsModule);
//# sourceMappingURL=documents.module.js.map