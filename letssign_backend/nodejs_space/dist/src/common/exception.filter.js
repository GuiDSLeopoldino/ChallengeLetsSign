"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    logger = new common_1.Logger('Exceptions');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let mensagem = 'Erro interno do servidor. Tente novamente mais tarde.';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            mensagem = typeof body === 'string' ? body : body.message ?? exception.message;
            if (status === 404 && typeof mensagem === 'string' && mensagem.startsWith('Cannot '))
                mensagem = 'Rota não encontrada.';
            if (status === 413)
                mensagem = 'Arquivo ou requisição muito grande.';
            if (status === 400 && mensagem === 'Bad Request')
                mensagem = 'Requisição inválida.';
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                status = 409;
                mensagem = 'Registro já existente (valor duplicado).';
            }
            else if (exception.code === 'P2025') {
                status = 404;
                mensagem = 'Registro não encontrado.';
            }
        }
        else if (exception?.type === 'entity.too.large') {
            status = 413;
            mensagem = 'Requisição muito grande.';
        }
        else if (exception?.type === 'entity.parse.failed') {
            status = 400;
            mensagem = 'JSON inválido no corpo da requisição.';
        }
        if (status >= 500)
            this.logger.error(`${req.method} ${req.url}`, exception?.stack);
        else
            this.logger.warn(`${req.method} ${req.url} -> ${status} ${JSON.stringify(mensagem)}`);
        const lista = Array.isArray(mensagem) ? mensagem : [mensagem];
        res.status(status).json({
            statusCode: status,
            mensagem: lista[0],
            erros: lista,
            caminho: req.url,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=exception.filter.js.map