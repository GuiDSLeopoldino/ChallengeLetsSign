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
exports.AuthGuard = exports.CurrentUser = exports.Roles = exports.ROLES = exports.Public = exports.IS_PUBLIC = void 0;
exports.clientIp = clientIp;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
exports.IS_PUBLIC = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC, true);
exports.Public = Public;
exports.ROLES = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES, roles);
exports.Roles = Roles;
exports.CurrentUser = (0, common_1.createParamDecorator)((_, ctx) => {
    return ctx.switchToHttp().getRequest().user;
});
let AuthGuard = class AuthGuard {
    jwt;
    reflector;
    prisma;
    constructor(jwt, reflector, prisma) {
        this.jwt = jwt;
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const targets = [ctx.getHandler(), ctx.getClass()];
        if (this.reflector.getAllAndOverride(exports.IS_PUBLIC, targets))
            return true;
        const req = ctx.switchToHttp().getRequest();
        const header = req.headers['authorization'];
        if (!header || !header.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Token de acesso ausente. Faça login novamente.');
        }
        let payload;
        try {
            payload = await this.jwt.verifyAsync(header.slice(7));
        }
        catch {
            throw new common_1.UnauthorizedException('Token inválido ou expirado. Faça login novamente.');
        }
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            throw new common_1.UnauthorizedException('Usuário não encontrado.');
        req.user = { id: user.id, email: user.email, role: user.role, nome: user.nome };
        const roles = this.reflector.getAllAndOverride(exports.ROLES, targets);
        if (roles && !roles.includes(user.role)) {
            throw new common_1.ForbiddenException('Seu perfil não tem permissão para esta ação.');
        }
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector,
        prisma_service_1.PrismaService])
], AuthGuard);
function clientIp(req) {
    const fwd = req.headers?.['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length)
        return fwd.split(',')[0].trim();
    return req.ip ?? null;
}
//# sourceMappingURL=auth.js.map