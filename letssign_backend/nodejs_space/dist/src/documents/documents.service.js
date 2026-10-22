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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma.service");
const pdf_util_1 = require("./pdf.util");
const notifications_service_1 = require("../notifications/notifications.service");
const META = {
    id: true, ownerId: true, titulo: true, status: true, versao: true, hashSha256: true, tamanhoBytes: true, nomeArquivo: true,
    totalPaginas: true, hashFinal: true, mensagem: true, criadoEm: true, enviadoEm: true, concluidoEm: true, atualizadoEm: true,
};
const USER_PUB = { select: { id: true, nome: true, email: true, telefone: true } };
let DocumentsService = class DocumentsService {
    prisma;
    notifications;
    logger = new common_1.Logger('Documents');
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async event(tx, doc, tipo, user, descricao, ctx, metadados, hash) {
        await tx.auditevent.create({
            data: {
                documentId: doc.id, tipo, actorId: user?.id, actorRole: user?.role, descricao, versao: doc.versao, ip: ctx?.ip ?? null,
                hashDocumentoNoMomento: hash ?? doc.hashSha256,
                metadados: metadados ? metadados : client_1.Prisma.JsonNull,
            },
        });
    }
    async access(user, id) {
        const doc = await this.prisma.document.findUnique({ where: { id }, select: META });
        if (!doc)
            throw new common_1.NotFoundException('Documento não encontrado.');
        if (doc.ownerId === user.id)
            return { doc, isOwner: true, participant: null };
        const participant = await this.prisma.documentsigner.findUnique({ where: { documentId_signerId: { documentId: id, signerId: user.id } } });
        if (!participant || doc.status === client_1.DocumentStatus.DRAFT) {
            throw new common_1.ForbiddenException('Você não tem permissão para acessar este documento.');
        }
        return { doc, isOwner: false, participant };
    }
    async owned(user, id) {
        const a = await this.access(user, id);
        if (!a.isOwner)
            throw new common_1.ForbiddenException('Apenas o criador do documento pode realizar esta ação.');
        return a.doc;
    }
    assertDraft(doc) {
        if (doc.status !== client_1.DocumentStatus.DRAFT) {
            throw new common_1.ConflictException('Documento já enviado: alterações exigem uma nova versão (POST /documents/:id/version).');
        }
    }
    async create(user, titulo, file, ctx) {
        if (!titulo || !titulo.trim())
            throw new common_1.BadRequestException('O título do documento é obrigatório.');
        if (titulo.length > 200)
            throw new common_1.BadRequestException('O título deve ter no máximo 200 caracteres.');
        const info = await (0, pdf_util_1.validatePdf)(file);
        const buf = file.buffer;
        const hash = (0, pdf_util_1.sha256)(buf);
        const doc = await this.prisma.$transaction(async (tx) => {
            const d = await tx.document.create({
                data: {
                    ownerId: user.id, titulo: titulo.trim(), hashSha256: hash, tamanhoBytes: buf.length, nomeArquivo: file.originalname || 'documento.pdf',
                    totalPaginas: info.pages, pdf: buf,
                },
                select: META,
            });
            await tx.documentversion.create({ data: { documentId: d.id, versao: 1, hashSha256: hash, nomeArquivo: d.nomeArquivo, tamanhoBytes: buf.length, pdf: buf } });
            await this.event(tx, d, client_1.AuditType.CREATED, user, `Documento "${d.titulo}" criado por ${user.nome}.`, ctx, { paginas: info.pages, tamanhosPaginas: info.sizes });
            return d;
        });
        this.logger.log(`Documento ${doc.id} criado por ${user.email}`);
        return { ...doc, paginas: info.sizes };
    }
    async list(user, status, situacao) {
        if (user.role === client_1.Role.ADMIN) {
            const docs = await this.prisma.document.findMany({
                where: { ownerId: user.id, ...(status ? { status } : {}) },
                select: { ...META, signers: { select: { status: true, required: true } } },
                orderBy: { atualizadoEm: 'desc' },
            });
            return docs.map(({ signers, ...d }) => ({
                ...d, papel: 'OWNER',
                totalSignatarios: signers.length, assinados: signers.filter((s) => s.status === client_1.SignerStatus.SIGNED).length,
            }));
        }
        const sStatus = situacao === 'pendentes' ? { status: { in: [client_1.SignerStatus.PENDING, client_1.SignerStatus.VIEWED] } }
            : situacao === 'assinados' ? { status: client_1.SignerStatus.SIGNED }
                : situacao === 'recusados' ? { status: client_1.SignerStatus.REJECTED } : {};
        const parts = await this.prisma.documentsigner.findMany({
            where: { signerId: user.id, ...sStatus, document: { status: status ? status : { not: client_1.DocumentStatus.DRAFT } } },
            include: { document: { select: { ...META, owner: USER_PUB } } },
            orderBy: { invitedAt: 'desc' },
        });
        return parts.map((p) => ({ ...p.document, papel: 'SIGNER', minhaSituacao: p.status, meuPapel: p.roleLabel, assinadoEm: p.signedAt }));
    }
    async detail(user, id, ctx) {
        const { doc, isOwner, participant } = await this.access(user, id);
        if (participant && participant.status === client_1.SignerStatus.PENDING && doc.status !== client_1.DocumentStatus.CANCELLED) {
            await this.prisma.$transaction(async (tx) => {
                await tx.documentsigner.update({ where: { id: participant.id }, data: { status: client_1.SignerStatus.VIEWED, viewedAt: new Date() } });
                await this.event(tx, doc, client_1.AuditType.VIEWED, user, `${user.nome} visualizou o documento.`, ctx);
            });
        }
        const full = await this.prisma.document.findUniqueOrThrow({
            where: { id },
            select: {
                ...META,
                owner: USER_PUB,
                signers: {
                    orderBy: { ordem: 'asc' },
                    select: {
                        id: true, signerId: true, status: true, roleLabel: true, required: true, invitedAt: true, viewedAt: true, signedAt: true,
                        rejectedAt: true, motivoRecusa: true, signer: USER_PUB, gestureMetadata: true,
                    },
                },
                fields: { orderBy: [{ page: 'asc' }, { y: 'asc' }] },
                events: { orderBy: { timestamp: 'asc' } },
                versions: { select: { versao: true, hashSha256: true, nomeArquivo: true, tamanhoBytes: true, criadoEm: true }, orderBy: { versao: 'asc' } },
            },
        });
        const fields = isOwner ? full.fields : full.fields.filter((f) => f.signerId === user.id);
        return { ...full, fields, todosCampos: isOwner ? undefined : full.fields.length, papel: isOwner ? 'OWNER' : 'SIGNER', possuiDocumentoFinal: !!full.hashFinal };
    }
    async file(user, id, tipo) {
        await this.access(user, id);
        const d = await this.prisma.document.findUniqueOrThrow({ where: { id }, select: { pdf: true, pdfFinal: true, nomeArquivo: true, status: true } });
        if (tipo === 'final') {
            if (!d.pdfFinal)
                throw new common_1.NotFoundException('O documento final só fica disponível após a conclusão de todas as assinaturas.');
            return { buf: Buffer.from(d.pdfFinal), nome: d.nomeArquivo.replace(/\.pdf$/i, '') + '-assinado.pdf' };
        }
        return { buf: Buffer.from(d.pdf), nome: d.nomeArquivo };
    }
    async validateSigners(user, ids) {
        const uniq = [...new Set(ids)];
        if (!uniq.length)
            return;
        const found = await this.prisma.user.findMany({ where: { id: { in: uniq }, adminId: user.id, role: client_1.Role.SIGNER }, select: { id: true, nome: true, email: true } });
        if (found.length !== uniq.length)
            throw new common_1.BadRequestException('Um ou mais signatários informados não existem ou não pertencem a você.');
        for (const s of found)
            if (!s.nome?.trim() || !s.email?.trim())
                throw new common_1.BadRequestException(`O signatário ${s.id} está sem nome ou e-mail.`);
    }
    validateFields(fields, totalPaginas) {
        fields.forEach((f, i) => {
            const n = i + 1;
            if (f.page > totalPaginas)
                throw new common_1.BadRequestException(`Campo ${n}: a página ${f.page} não existe (o PDF tem ${totalPaginas} página(s)).`);
            const eps = 1e-6;
            if (f.x < 0 || f.y < 0 || f.x + f.width > 1 + eps || f.y + f.height > 1 + eps) {
                throw new common_1.BadRequestException(`Campo ${n}: o campo de assinatura deve permanecer dentro dos limites da página.`);
            }
        });
    }
    async writeParticipants(tx, docId, parts) {
        const ids = parts.map((p) => p.signerId);
        if (new Set(ids).size !== ids.length)
            throw new common_1.BadRequestException('O mesmo signatário foi informado mais de uma vez.');
        await tx.documentsigner.deleteMany({ where: { documentId: docId } });
        if (parts.length) {
            await tx.documentsigner.createMany({
                data: parts.map((p, i) => ({ documentId: docId, signerId: p.signerId, roleLabel: p.roleLabel, required: p.required ?? true, ordem: i })),
            });
        }
    }
    async writeFields(tx, docId, fields) {
        const parts = await tx.documentsigner.findMany({ where: { documentId: docId } });
        const roleOf = new Map(parts.map((p) => [p.signerId, p.roleLabel]));
        await tx.signaturefield.deleteMany({ where: { documentId: docId } });
        if (fields.length) {
            await tx.signaturefield.createMany({
                data: fields.map((f) => ({
                    documentId: docId, signerId: f.signerId, page: f.page, x: f.x, y: f.y, width: f.width, height: f.height,
                    required: f.required ?? true, roleLabel: f.roleLabel ?? roleOf.get(f.signerId) ?? 'CONTRATADO',
                })),
            });
        }
    }
    async setParticipants(user, id, parts, ctx) {
        const doc = await this.owned(user, id);
        this.assertDraft(doc);
        await this.validateSigners(user, parts.map((p) => p.signerId));
        await this.prisma.$transaction(async (tx) => {
            await this.writeParticipants(tx, id, parts);
            await tx.signaturefield.deleteMany({ where: { documentId: id, signerId: { notIn: parts.map((p) => p.signerId) } } });
        });
        return this.detail(user, id, ctx);
    }
    async setFields(user, id, fields, ctx) {
        const doc = await this.owned(user, id);
        this.assertDraft(doc);
        this.validateFields(fields, doc.totalPaginas);
        await this.validateSigners(user, fields.map((f) => f.signerId));
        await this.prisma.$transaction(async (tx) => {
            await this.writeFields(tx, id, fields);
            await this.event(tx, doc, client_1.AuditType.FIELDS_UPDATED, user, `${fields.length} campo(s) de assinatura posicionado(s).`, ctx);
        });
        return this.detail(user, id, ctx);
    }
    async send(user, id, dto, ctx) {
        const doc = await this.owned(user, id);
        if (doc.status !== client_1.DocumentStatus.DRAFT) {
            if (doc.status === client_1.DocumentStatus.CANCELLED)
                throw new common_1.ConflictException('Documento cancelado não pode ser enviado. Crie uma nova versão.');
            return { jaEnviado: true, mensagem: 'Este documento já havia sido enviado; nenhuma solicitação foi duplicada.', documento: await this.detail(user, id, ctx) };
        }
        if (dto.participantes)
            await this.validateSigners(user, dto.participantes.map((p) => p.signerId));
        if (dto.fields) {
            this.validateFields(dto.fields, doc.totalPaginas);
            await this.validateSigners(user, dto.fields.map((f) => f.signerId));
        }
        await this.prisma.$transaction(async (tx) => {
            if (dto.participantes)
                await this.writeParticipants(tx, id, dto.participantes);
            if (dto.fields)
                await this.writeFields(tx, id, dto.fields);
            const parts = await tx.documentsigner.findMany({ where: { documentId: id }, include: { signer: USER_PUB } });
            const fields = await tx.signaturefield.findMany({ where: { documentId: id } });
            if (!doc.titulo?.trim())
                throw new common_1.BadRequestException('O título do documento é obrigatório.');
            if (parts.length < 1)
                throw new common_1.BadRequestException('O documento precisa ter pelo menos um signatário para ser enviado.');
            if (!parts.some((p) => p.required))
                throw new common_1.BadRequestException('O documento precisa ter pelo menos um signatário obrigatório.');
            const partIds = new Set(parts.map((p) => p.signerId));
            const orfao = fields.find((f) => !partIds.has(f.signerId));
            if (orfao)
                throw new common_1.BadRequestException('Todo campo de assinatura deve estar associado a um participante do documento.');
            const semCampo = parts.find((p) => !fields.some((f) => f.signerId === p.signerId));
            if (semCampo)
                throw new common_1.BadRequestException(`O signatário ${semCampo.signer.nome} não possui nenhum campo de assinatura posicionado.`);
            for (const f of fields) {
                if (f.page > doc.totalPaginas || f.x < 0 || f.y < 0 || f.x + f.width > 1 + 1e-6 || f.y + f.height > 1 + 1e-6) {
                    throw new common_1.BadRequestException('Existe campo de assinatura fora dos limites da página.');
                }
            }
            const now = new Date();
            const upd = await tx.document.updateMany({ where: { id, status: client_1.DocumentStatus.DRAFT }, data: { status: client_1.DocumentStatus.PENDING, enviadoEm: now, mensagem: dto.mensagem ?? null } });
            if (upd.count === 0)
                throw new common_1.ConflictException('O documento já foi enviado.');
            await tx.documentsigner.updateMany({ where: { documentId: id }, data: { invitedAt: now } });
            await tx.documentversion.update({
                where: { documentId_versao: { documentId: id, versao: doc.versao } },
                data: { configuracao: { participantes: parts.map((p) => ({ signerId: p.signerId, roleLabel: p.roleLabel, required: p.required })), campos: fields, mensagem: dto.mensagem ?? null, enviadoEm: now.toISOString() } },
            });
            await this.event(tx, doc, client_1.AuditType.SENT, user, `Documento enviado para ${parts.length} signatário(s): ${parts.map((p) => p.signer.nome).join(', ')}.`, ctx, {
                participantes: parts.map((p) => ({ id: p.signerId, nome: p.signer.nome, email: p.signer.email, papel: p.roleLabel })), totalCampos: fields.length,
            });
        });
        this.logger.log(`Documento ${id} enviado`);
        const partsForNotification = await this.prisma.documentsigner.findMany({
            where: { documentId: id },
            include: { signer: USER_PUB },
        });
        const signersForNotification = partsForNotification.map((p) => ({
            email: p.signer.email,
            nome: p.signer.nome,
            papel: p.roleLabel,
        }));
        this.notifications.notifyDocumentSent(signersForNotification, id, doc.titulo, user.nome, dto.mensagem).catch((err) => {
            this.logger.error(`Falha ao enviar notificações de envio para ${id}`, err.stack);
        });
        return { jaEnviado: false, mensagem: 'Documento enviado com sucesso.', documento: await this.detail(user, id, ctx) };
    }
    async newVersion(user, id, file, titulo, ctx) {
        const doc = await this.owned(user, id);
        if (doc.status === client_1.DocumentStatus.COMPLETED)
            throw new common_1.ConflictException('Documento concluído não pode receber nova versão. Crie um novo documento.');
        const info = await (0, pdf_util_1.validatePdf)(file);
        const buf = file.buffer;
        const hash = (0, pdf_util_1.sha256)(buf);
        const versao = doc.versao + 1;
        await this.prisma.$transaction(async (tx) => {
            await tx.document.update({
                where: { id },
                data: {
                    versao, hashSha256: hash, pdf: buf, tamanhoBytes: buf.length, nomeArquivo: file.originalname || doc.nomeArquivo, totalPaginas: info.pages,
                    status: client_1.DocumentStatus.DRAFT, enviadoEm: null, concluidoEm: null, pdfFinal: null, hashFinal: null, ...(titulo?.trim() ? { titulo: titulo.trim() } : {}),
                },
            });
            await tx.documentversion.create({ data: { documentId: id, versao, hashSha256: hash, nomeArquivo: file.originalname || doc.nomeArquivo, tamanhoBytes: buf.length, pdf: buf } });
            await tx.documentsigner.updateMany({
                where: { documentId: id },
                data: { status: client_1.SignerStatus.PENDING, invitedAt: null, viewedAt: null, signedAt: null, rejectedAt: null, motivoRecusa: null, assinaturaImagemBase64: null, gestureMetadata: client_1.Prisma.JsonNull, ip: null, userAgent: null },
            });
            await tx.signaturefield.deleteMany({ where: { documentId: id, page: { gt: info.pages } } });
            await this.event(tx, { id, versao, hashSha256: hash }, client_1.AuditType.VERSION_CREATED, user, `Versão ${versao} criada (versão anterior ${doc.versao} preservada). Novo fluxo iniciado.`, ctx, { versaoAnterior: doc.versao, hashAnterior: doc.hashSha256 });
        });
        const participants = await this.prisma.documentsigner.findMany({
            where: { documentId: id },
            include: { signer: USER_PUB },
        });
        for (const p of participants) {
            this.notifications.sendNewVersion(p.signer.email, {
                nomeDestinatario: p.signer.nome,
                tituloDocumento: doc.titulo,
                linkDocumento: id,
                nomeRemetente: user.nome,
            }).catch((err) => this.logger.error(`Falha ao notificar nova versão para ${p.signer.email}`, err.stack));
        }
        return this.detail(user, id, ctx);
    }
    async sign(user, id, dto, ctx) {
        const { doc, participant } = await this.access(user, id);
        if (!participant)
            throw new common_1.ForbiddenException('Apenas signatários convidados podem assinar este documento.');
        if (doc.status !== client_1.DocumentStatus.PENDING && doc.status !== client_1.DocumentStatus.PARTIALLY_SIGNED) {
            throw new common_1.ConflictException('Este documento não está disponível para assinatura.');
        }
        if (participant.status === client_1.SignerStatus.SIGNED)
            throw new common_1.ConflictException('Você já assinou este documento.');
        if (participant.status === client_1.SignerStatus.REJECTED)
            throw new common_1.ConflictException('Você recusou este documento e não pode mais assiná-lo.');
        const png = (0, pdf_util_1.cleanBase64)(dto.assinaturaImagemBase64);
        const bytes = Buffer.from(png, 'base64');
        if (bytes.length < 8 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
            throw new common_1.BadRequestException('A imagem da assinatura deve ser um PNG válido em base64.');
        }
        if (bytes.length > 2 * 1024 * 1024)
            throw new common_1.BadRequestException('A imagem da assinatura deve ter no máximo 2 MB.');
        const now = new Date();
        const meta = { ...(dto.gestureMetadata ?? {}), hashImagemAssinatura: (0, pdf_util_1.sha256)(bytes) };
        await this.prisma.$transaction(async (tx) => {
            const upd = await tx.documentsigner.updateMany({
                where: { id: participant.id, status: { in: [client_1.SignerStatus.PENDING, client_1.SignerStatus.VIEWED] } },
                data: { status: client_1.SignerStatus.SIGNED, signedAt: now, viewedAt: participant.viewedAt ?? now, assinaturaImagemBase64: png, gestureMetadata: meta, ip: ctx.ip, userAgent: ctx.userAgent },
            });
            if (upd.count === 0)
                throw new common_1.ConflictException('Você já assinou este documento.');
            await this.event(tx, doc, client_1.AuditType.SIGNED, user, `${user.nome} assinou o documento.`, ctx, { gesto: meta, userAgent: ctx.userAgent });
            const parts = await tx.documentsigner.findMany({ where: { documentId: id } });
            const pendentesObrig = parts.filter((p) => p.required && p.status !== client_1.SignerStatus.SIGNED);
            if (pendentesObrig.length === 0) {
                await tx.document.update({ where: { id }, data: { status: client_1.DocumentStatus.COMPLETED, concluidoEm: now } });
            }
            else {
                await tx.document.update({ where: { id }, data: { status: client_1.DocumentStatus.PARTIALLY_SIGNED } });
            }
        }, { timeout: 15000 });
        const after = await this.prisma.document.findUniqueOrThrow({ where: { id }, select: { status: true } });
        const otherParticipants = await this.prisma.documentsigner.findMany({
            where: { documentId: id, signerId: { not: user.id } },
            include: { signer: USER_PUB },
        });
        this.notifications.notifySignerSigned(otherParticipants.map((p) => p.signer.email).join(','), '', id, doc.titulo, user.nome).catch((err) => {
            this.logger.error(`Falha ao notificar assinatura para ${id}`, err.stack);
        });
        for (const p of otherParticipants) {
            this.notifications.notifySignerSigned(p.signer.email, p.signer.nome, id, doc.titulo, user.nome).catch((err) => {
                this.logger.error(`Falha ao notificar ${p.signer.email} sobre assinatura`, err.stack);
            });
        }
        if (after.status === client_1.DocumentStatus.COMPLETED)
            await this.finalize(id, user, ctx);
        return { mensagem: after.status === client_1.DocumentStatus.COMPLETED ? 'Assinatura registrada. Documento concluído!' : 'Assinatura registrada com sucesso.', documento: await this.detail(user, id, ctx) };
    }
    async finalize(id, user, ctx) {
        const d = await this.prisma.document.findUniqueOrThrow({
            where: { id },
            include: { fields: true, signers: { include: { signer: { select: { nome: true, email: true } } } } },
        });
        const bySigner = new Map(d.signers.map((s) => [s.signerId, s]));
        const stamps = d.fields
            .map((f) => {
            const s = bySigner.get(f.signerId);
            if (!s?.assinaturaImagemBase64 || s.status !== client_1.SignerStatus.SIGNED)
                return null;
            return { page: f.page, x: f.x, y: f.y, width: f.width, height: f.height, png: s.assinaturaImagemBase64, label: `${s.signer.nome} - ${s.roleLabel} - ${s.signedAt?.toISOString()}` };
        })
            .filter((x) => !!x);
        let finalBuf;
        try {
            finalBuf = await (0, pdf_util_1.stampPdf)(Buffer.from(d.pdf), stamps, `LetsSign - documento ${d.id} v${d.versao} - hash original SHA-256 ${d.hashSha256}`);
        }
        catch (e) {
            this.logger.error(`Falha ao gerar PDF final de ${id}`, e.stack);
            finalBuf = Buffer.from(d.pdf);
        }
        const hashFinal = (0, pdf_util_1.sha256)(finalBuf);
        await this.prisma.$transaction(async (tx) => {
            await tx.document.update({ where: { id }, data: { pdfFinal: finalBuf, hashFinal } });
            await this.event(tx, d, client_1.AuditType.COMPLETED, null, 'Todos os signatários obrigatórios assinaram. Documento concluído.', ctx, { hashOriginal: d.hashSha256, hashFinal, ultimoSignatario: user.nome }, hashFinal);
        });
        const recipients = d.signers.map((s) => ({ email: s.signer.email, nome: s.signer.nome }));
        this.notifications.notifyDocumentCompleted(recipients, id, d.titulo).catch((err) => {
            this.logger.error(`Falha ao notificar conclusão para ${id}`, err.stack);
        });
    }
    async reject(user, id, motivo, ctx) {
        const { doc, participant } = await this.access(user, id);
        if (!participant)
            throw new common_1.ForbiddenException('Apenas signatários convidados podem recusar este documento.');
        if (doc.status !== client_1.DocumentStatus.PENDING && doc.status !== client_1.DocumentStatus.PARTIALLY_SIGNED)
            throw new common_1.ConflictException('Este documento não está disponível para recusa.');
        if (participant.status === client_1.SignerStatus.SIGNED || participant.status === client_1.SignerStatus.REJECTED)
            throw new common_1.ConflictException('Você já respondeu a este documento.');
        await this.prisma.$transaction(async (tx) => {
            await tx.documentsigner.update({ where: { id: participant.id }, data: { status: client_1.SignerStatus.REJECTED, rejectedAt: new Date(), motivoRecusa: motivo, ip: ctx.ip, userAgent: ctx.userAgent } });
            if (participant.required)
                await tx.document.update({ where: { id }, data: { status: client_1.DocumentStatus.CANCELLED } });
            await this.event(tx, doc, client_1.AuditType.REJECTED, user, `${user.nome} recusou o documento. Motivo: ${motivo}`, ctx, { motivo, documentoCancelado: participant.required });
        });
        if (participant.required) {
            const allParticipants = await this.prisma.documentsigner.findMany({
                where: { documentId: id },
                include: { signer: USER_PUB },
            });
            for (const p of allParticipants) {
                if (p.signerId !== user.id) {
                    this.notifications.notifyDocumentCancelled([{ email: p.signer.email, nome: p.signer.nome }], id, doc.titulo, motivo).catch((err) => this.logger.error(`Falha ao notificar cancelamento para ${p.signer.email}`, err.stack));
                }
            }
            const owner = await this.prisma.user.findUnique({ where: { id: doc.ownerId }, select: USER_PUB.select });
            if (owner) {
                this.notifications.notifyDocumentCancelled([{ email: owner.email, nome: owner.nome }], id, doc.titulo, motivo).catch((err) => this.logger.error(`Falha ao notificar admin sobre cancelamento`, err.stack));
            }
        }
        else {
            const owner = await this.prisma.user.findUnique({ where: { id: doc.ownerId }, select: USER_PUB.select });
            if (owner) {
                this.notifications.notifyDocumentRejected(owner.email, owner.nome, id, doc.titulo, user.nome, motivo).catch((err) => this.logger.error(`Falha ao notificar admin sobre recusa`, err.stack));
            }
        }
        return { mensagem: 'Recusa registrada.', documento: await this.detail(user, id, ctx) };
    }
    async audit(user, id) {
        const { doc } = await this.access(user, id);
        const events = await this.prisma.auditevent.findMany({ where: { documentId: id }, orderBy: { timestamp: 'asc' } });
        return { documentId: id, titulo: doc.titulo, versaoAtual: doc.versao, hashAtual: doc.hashSha256, hashFinal: doc.hashFinal, status: doc.status, eventos: events };
    }
    async verify(user, id, hash) {
        const { doc } = await this.access(user, id);
        const versions = await this.prisma.documentversion.findMany({ where: { documentId: id }, select: { versao: true, hashSha256: true } });
        const h = hash.toLowerCase().trim();
        const v = versions.find((x) => x.hashSha256 === h);
        if (doc.hashFinal === h)
            return { valido: true, tipo: 'DOCUMENTO_FINAL_ASSINADO', versao: doc.versao };
        if (v)
            return { valido: true, tipo: 'ORIGINAL', versao: v.versao };
        return { valido: false, mensagem: 'O hash informado não corresponde a nenhuma versão deste documento.' };
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map