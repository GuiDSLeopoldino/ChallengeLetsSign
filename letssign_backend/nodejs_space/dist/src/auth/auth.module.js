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
exports.AuthModule = exports.AuthController = exports.AuthService = exports.LoginDto = exports.RegisterDto = void 0;
exports.publicUser = publicUser;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma.service");
const auth_1 = require("../common/auth");
class RegisterDto {
    nome;
    email;
    telefone;
    senha;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Maria Admin' }),
    (0, class_validator_1.IsString)({ message: 'O nome deve ser um texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'O nome completo é obrigatório.' }),
    (0, class_validator_1.MaxLength)(150, { message: 'O nome deve ter no máximo 150 caracteres.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'maria@empresa.com' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Informe um e-mail válido.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+5511999990000' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'O telefone deve ser um texto.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Senha@123' }),
    (0, class_validator_1.IsString)({ message: 'A senha deve ser um texto.' }),
    (0, class_validator_1.MinLength)(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "senha", void 0);
class LoginDto {
    email;
    senha;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin@letssign.com' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Informe um e-mail válido.' }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Admin@123' }),
    (0, class_validator_1.IsString)({ message: 'A senha deve ser um texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'A senha é obrigatória.' }),
    __metadata("design:type", String)
], LoginDto.prototype, "senha", void 0);
function publicUser(u) {
    return { id: u.id, nome: u.nome, email: u.email, telefone: u.telefone, role: u.role, criadoEm: u.criadoEm };
}
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async token(u) {
        const accessToken = await this.jwt.signAsync({ sub: u.id, role: u.role });
        return { accessToken, tokenType: 'Bearer', expiresIn: 7 * 24 * 3600, usuario: publicUser(u) };
    }
    async register(dto) {
        const email = dto.email.toLowerCase().trim();
        if (await this.prisma.user.findUnique({ where: { email } })) {
            throw new common_1.ConflictException('Já existe um usuário cadastrado com este e-mail.');
        }
        const u = await this.prisma.user.create({
            data: { nome: dto.nome.trim(), email, telefone: dto.telefone, senhaHash: await bcrypt.hash(dto.senha, 10), role: client_1.Role.ADMIN },
        });
        return this.token(u);
    }
    async login(dto) {
        const u = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
        if (!u || !(await bcrypt.compare(dto.senha, u.senhaHash))) {
            throw new common_1.UnauthorizedException('E-mail ou senha incorretos.');
        }
        return this.token(u);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
let AuthController = class AuthController {
    auth;
    prisma;
    constructor(auth, prisma) {
        this.auth = auth;
        this.prisma = prisma;
    }
    register(dto) {
        return this.auth.register(dto);
    }
    login(dto) {
        return this.auth.login(dto);
    }
    async me(cu) {
        const u = await this.prisma.user.findUniqueOrThrow({ where: { id: cu.id } });
        return publicUser(u);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, auth_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Cadastra um novo usuário ADMIN e retorna o token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, auth_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Login por e-mail e senha (Admin ou Signatário)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Dados do usuário autenticado' }),
    __param(0, (0, auth_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Autenticação'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [AuthService, prisma_service_1.PrismaService])
], AuthController);
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({ controllers: [AuthController], providers: [AuthService] })
], AuthModule);
//# sourceMappingURL=auth.module.js.map