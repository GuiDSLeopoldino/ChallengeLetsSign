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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_1 = require("./common/auth");
const prisma_service_1 = require("./prisma.service");
let AppController = class AppController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async health() {
        let banco = 'ok';
        try {
            await this.prisma.$queryRaw `SELECT 1`;
        }
        catch {
            banco = 'indisponível';
        }
        return { status: banco === 'ok' ? 'ok' : 'degradado', banco, servico: 'LetsSign Mobile API', timestamp: new Date().toISOString() };
    }
};
exports.AppController = AppController;
__decorate([
    (0, auth_1.Public)(),
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Verifica se a API e o banco estão no ar' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "health", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('Saúde'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map