"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignersModule = exports.SignersController = exports.SignersService = exports.UpdateSignerDto = exports.CreateSignerDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma.service");
const auth_1 = require("../common/auth");
const auth_module_1 = require("../auth/auth.module");
class CreateSignerDto extends auth_module_1.RegisterDto {
}
exports.CreateSignerDto = CreateSignerDto;
class UpdateSignerDto extends (0, swagger_1.PartialType)(CreateSignerDto) {
    nome;
    email;
    senha;
}
exports.UpdateSignerDto = UpdateSignerDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'O nome deve ser um texto.' }),
    __metadata("design:type", String)
], UpdateSignerDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Informe um e-mail válido.' }),
    __metadata("design:type", String)
], UpdateSignerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'A senha deve ser um texto.' }),
    (0, class_validator_1.MinLength)(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
    __metadata("design:type", String)
], UpdateSignerDto.prototype, "senha", void 0);
let SignersService = class SignersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOwned(adminId, id) {
        const s = await this.prisma.user.findFirst({ where: { id, adminId, role: client_1.Role.SIGNER } });
        if (!s)
            throw new common_1.NotFoundException('Signatário não encontrado.');
        return s;
    }
};
exports.SignersService = SignersService;
exports.SignersService = SignersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SignersService);
let SignersController = class SignersController {
    prisma;
    svc;
    constructor(prisma, svc) {
        this.prisma = prisma;
        this.svc = svc;
    }
    async list(u, busca) {
        const list = await this.prisma.user.findMany({
            where: { adminId: u.id, role: client_1.Role.SIGNER },
            orderBy: { nome: 'asc' },
        });
        if (busca) {
            const lower = busca.toLowerCase();
            return list
                .filter((s) => s.nome.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower))
                .map(auth_module_1.publicUser);
        }
        return list.map(auth_module_1.publicUser);
    }
    async get(u, id) {
        return (0, auth_module_1.publicUser)(await this.svc.findOwned(u.id, id));
    }
    async create(u, dto) {
        const email = dto.email.toLowerCase().trim();
        if (await this.prisma.user.findUnique({ where: { email } }))
            throw new common_1.ConflictException('Já existe um usuário cadastrado com este e-mail.');
        const s = await this.prisma.user.create({
            data: { nome: dto.nome.trim(), email, telefone: dto.telefone, senhaHash: await bcrypt.hash(dto.senha, 10), role: client_1.Role.SIGNER, adminId: u.id },
        });
        return (0, auth_module_1.publicUser)(s);
    }
    async update(u, id, dto) {
        await this.svc.findOwned(u.id, id);
        const data = {};
        if (dto.nome)
            data.nome = dto.nome.trim();
        if (dto.telefone !== undefined)
            data.telefone = dto.telefone;
        if (dto.email) {
            data.email = dto.email.toLowerCase().trim();
            const ex = await this.prisma.user.findUnique({ where: { email: data.email } });
            if (ex && ex.id !== id)
                throw new common_1.ConflictException('Já existe um usuário cadastrado com este e-mail.');
        }
        if (dto.senha)
            data.senhaHash = await bcrypt.hash(dto.senha, 10);
        return (0, auth_module_1.publicUser)(await this.prisma.user.update({ where: { id }, data }));
    }
    async remove(u, id) {
        await this.svc.findOwned(u.id, id);
        const uso = await this.prisma.documentsigner.count({ where: { signerId: id } });
        const campos = await this.prisma.signaturefield.count({ where: { signerId: id } });
        if (uso + campos > 0)
            throw new common_1.ConflictException('Este signatário já está vinculado a documentos e não pode ser removido.');
        await this.prisma.user.delete({ where: { id } });
        return { mensagem: 'Signatário removido com sucesso.' };
    }
};
exports.SignersController = SignersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lista os signatários cadastrados pelo Admin' }),
    (0, swagger_1.ApiQuery)({ name: 'busca', required: false }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('busca')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SignersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalha um signatário' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SignersController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastra um signatário (nome, e-mail, telefone, senha)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateSignerDto]),
    __metadata("design:returntype", Promise)
], SignersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Edita um signatário' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateSignerDto]),
    __metadata("design:returntype", Promise)
], SignersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove um signatário (somente se não participa de documentos)' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SignersController.prototype, "remove", null);
exports.SignersController = SignersController = __decorate([
    (0, swagger_1.ApiTags)('Signatários'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, auth_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Controller)('signers'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, SignersService])
], SignersController);
let SignersModule = class SignersModule {
};
exports.SignersModule = SignersModule;
exports.SignersModule = SignersModule = __decorate([
    (0, common_1.Module)({ controllers: [SignersController], providers: [SignersService], exports: [SignersService] })
], SignersModule);
//# sourceMappingURL=signers.module.js.map