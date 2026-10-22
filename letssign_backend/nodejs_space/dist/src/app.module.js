"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const app_controller_1 = require("./app.controller");
const prisma_service_1 = require("./prisma.service");
const auth_1 = require("./common/auth");
const auth_module_1 = require("./auth/auth.module");
const signers_module_1 = require("./signers/signers.module");
const documents_module_1 = require("./documents/documents.module");
const notifications_module_1 = require("./notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            jwt_1.JwtModule.registerAsync({
                global: true,
                inject: [config_1.ConfigService],
                useFactory: (c) => ({ secret: c.get('JWT_SECRET'), signOptions: { expiresIn: '7d' } }),
            }),
            prisma_service_1.PrismaModule,
            auth_module_1.AuthModule,
            signers_module_1.SignersModule,
            documents_module_1.DocumentsModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [{ provide: core_1.APP_GUARD, useClass: auth_1.AuthGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map