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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const config_1 = require("@nestjs/config");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    mailer;
    config;
    logger = new common_1.Logger(NotificationsService_1.name);
    frontendUrl;
    constructor(mailer, config) {
        this.mailer = mailer;
        this.config = config;
        this.frontendUrl = config.get('FRONTEND_URL') || 'http://localhost:3000';
    }
    getDocumentLink(documentId) {
        return `${this.frontendUrl}/document/${documentId}`;
    }
    async sendDocumentInvite(to, context) {
        try {
            await this.mailer.sendMail({
                to,
                subject: `📄 ${context.nomeRemetente || 'Alguém'} convidou você para assinar: ${context.tituloDocumento}`,
                template: 'document-invite',
                context: {
                    ...context,
                    linkDocumento: this.getDocumentLink(context.linkDocumento),
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`Convite enviado para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar convite para ${to}`, error.stack);
            throw error;
        }
    }
    async sendDocumentSigned(to, context) {
        try {
            await this.mailer.sendMail({
                to,
                subject: `✅ Documento assinado: ${context.tituloDocumento}`,
                template: 'document-signed',
                context: {
                    ...context,
                    linkDocumento: this.getDocumentLink(context.linkDocumento),
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`Notificação de assinatura enviada para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar notificação de assinatura para ${to}`, error.stack);
            throw error;
        }
    }
    async sendDocumentCompleted(to, context) {
        try {
            await this.mailer.sendMail({
                to,
                subject: `🎉 Documento concluído: ${context.tituloDocumento}`,
                template: 'document-completed',
                context: {
                    ...context,
                    linkDocumento: this.getDocumentLink(context.linkDocumento),
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`Notificação de conclusão enviada para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar notificação de conclusão para ${to}`, error.stack);
            throw error;
        }
    }
    async sendDocumentRejected(to, context) {
        try {
            await this.mailer.sendMail({
                to,
                subject: `❌ Documento recusado: ${context.tituloDocumento}`,
                template: 'document-rejected',
                context: {
                    ...context,
                    linkDocumento: this.getDocumentLink(context.linkDocumento),
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`Notificação de recusa enviada para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar notificação de recusa para ${to}`, error.stack);
            throw error;
        }
    }
    async sendDocumentCancelled(to, context) {
        try {
            await this.mailer.sendMail({
                to,
                subject: `⚠️ Documento cancelado: ${context.tituloDocumento}`,
                template: 'document-cancelled',
                context: {
                    ...context,
                    linkDocumento: this.getDocumentLink(context.linkDocumento),
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`Notificação de cancelamento enviada para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar notificação de cancelamento para ${to}`, error.stack);
            throw error;
        }
    }
    async sendNewVersion(to, context) {
        try {
            await this.mailer.sendMail({
                to,
                subject: `🔄 Nova versão do documento: ${context.tituloDocumento}`,
                template: 'document-new-version',
                context: {
                    ...context,
                    linkDocumento: this.getDocumentLink(context.linkDocumento),
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`Notificação de nova versão enviada para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar notificação de nova versão para ${to}`, error.stack);
            throw error;
        }
    }
    async sendReminder(to, context) {
        try {
            await this.mailer.sendMail({
                to,
                subject: `⏰ Lembrete: Assinatura pendente - ${context.tituloDocumento}`,
                template: 'document-reminder',
                context: {
                    ...context,
                    linkDocumento: this.getDocumentLink(context.linkDocumento),
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`Lembrete enviado para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar lembrete para ${to}`, error.stack);
            throw error;
        }
    }
    async sendWelcome(to, nome, senhaTemporaria) {
        try {
            await this.mailer.sendMail({
                to,
                subject: '👋 Bem-vindo ao LetsSign',
                template: 'welcome',
                context: {
                    nome,
                    senhaTemporaria,
                    linkLogin: `${this.frontendUrl}/login`,
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`E-mail de boas-vindas enviado para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar e-mail de boas-vindas para ${to}`, error.stack);
            throw error;
        }
    }
    async sendPasswordReset(to, nome, resetToken) {
        try {
            const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;
            await this.mailer.sendMail({
                to,
                subject: '🔐 Redefinição de senha - LetsSign',
                template: 'password-reset',
                context: {
                    nome,
                    resetLink,
                    expiraEm: '1 hora',
                    anoAtual: new Date().getFullYear(),
                },
            });
            this.logger.log(`E-mail de redefinição de senha enviado para ${to}`);
        }
        catch (error) {
            this.logger.error(`Falha ao enviar e-mail de redefinição de senha para ${to}`, error.stack);
            throw error;
        }
    }
    async notifyDocumentSent(signers, documentId, titulo, remetenteNome, mensagem) {
        await Promise.all(signers.map((s) => this.sendDocumentInvite(s.email, {
            nomeDestinatario: s.nome,
            tituloDocumento: titulo,
            linkDocumento: documentId,
            nomeRemetente: remetenteNome,
            mensagem,
            papel: s.papel,
        })));
    }
    async notifySignerSigned(to, nome, documentId, titulo, signatarioNome) {
        await this.sendDocumentSigned(to, {
            nomeDestinatario: nome,
            tituloDocumento: titulo,
            linkDocumento: documentId,
            nomeRemetente: signatarioNome,
        });
    }
    async notifyDocumentCompleted(recipients, documentId, titulo) {
        await Promise.all(recipients.map((r) => this.sendDocumentCompleted(r.email, {
            nomeDestinatario: r.nome,
            tituloDocumento: titulo,
            linkDocumento: documentId,
            dataConclusao: new Date(),
        })));
    }
    async notifyDocumentRejected(to, nome, documentId, titulo, recusanteNome, motivo) {
        await this.sendDocumentRejected(to, {
            nomeDestinatario: nome,
            tituloDocumento: titulo,
            linkDocumento: documentId,
            nomeRemetente: recusanteNome,
            motivoRecusa: motivo,
        });
    }
    async notifyDocumentCancelled(recipients, documentId, titulo, motivo) {
        await Promise.all(recipients.map((r) => this.sendDocumentCancelled(r.email, {
            nomeDestinatario: r.nome,
            tituloDocumento: titulo,
            linkDocumento: documentId,
            motivoRecusa: motivo,
        })));
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map