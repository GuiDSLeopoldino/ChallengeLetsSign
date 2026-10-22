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
exports.ArrayMinSize = exports.TitleDto = exports.RejectDto = exports.SignDto = exports.SendDto = exports.SetParticipantsDto = exports.ParticipantDto = exports.SetFieldsDto = exports.FieldDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
Object.defineProperty(exports, "ArrayMinSize", { enumerable: true, get: function () { return class_validator_1.ArrayMinSize; } });
const client_1 = require("@prisma/client");
class FieldDto {
    signerId;
    page;
    x;
    y;
    width;
    height;
    required;
    roleLabel;
}
exports.FieldDto = FieldDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do signatário (participante) dono do campo' }),
    (0, class_validator_1.IsUUID)('all', { message: 'signerId deve ser um ID válido.' }),
    __metadata("design:type", String)
], FieldDto.prototype, "signerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Página (começa em 1)' }),
    (0, class_validator_1.IsInt)({ message: 'A página deve ser um número inteiro.' }),
    (0, class_validator_1.Min)(1, { message: 'A página deve ser maior ou igual a 1.' }),
    __metadata("design:type", Number)
], FieldDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.1, description: 'X normalizado (0..1) a partir da esquerda' }),
    (0, class_validator_1.IsNumber)({}, { message: 'x deve ser numérico.' }),
    (0, class_validator_1.Min)(0, { message: 'x deve estar entre 0 e 1.' }),
    (0, class_validator_1.Max)(1, { message: 'x deve estar entre 0 e 1.' }),
    __metadata("design:type", Number)
], FieldDto.prototype, "x", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.8, description: 'Y normalizado (0..1) a partir do topo' }),
    (0, class_validator_1.IsNumber)({}, { message: 'y deve ser numérico.' }),
    (0, class_validator_1.Min)(0, { message: 'y deve estar entre 0 e 1.' }),
    (0, class_validator_1.Max)(1, { message: 'y deve estar entre 0 e 1.' }),
    __metadata("design:type", Number)
], FieldDto.prototype, "y", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.3 }),
    (0, class_validator_1.IsNumber)({}, { message: 'width deve ser numérico.' }),
    (0, class_validator_1.Min)(0.01, { message: 'width deve ser maior que 0.' }),
    (0, class_validator_1.Max)(1, { message: 'width deve ser no máximo 1.' }),
    __metadata("design:type", Number)
], FieldDto.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0.08 }),
    (0, class_validator_1.IsNumber)({}, { message: 'height deve ser numérico.' }),
    (0, class_validator_1.Min)(0.01, { message: 'height deve ser maior que 0.' }),
    (0, class_validator_1.Max)(1, { message: 'height deve ser no máximo 1.' }),
    __metadata("design:type", Number)
], FieldDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'required deve ser verdadeiro ou falso.' }),
    __metadata("design:type", Boolean)
], FieldDto.prototype, "required", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RoleLabel, description: 'Se omitido, usa o papel do participante' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RoleLabel, { message: 'roleLabel deve ser CONTRATANTE, CONTRATADO ou TESTEMUNHA.' }),
    __metadata("design:type", String)
], FieldDto.prototype, "roleLabel", void 0);
class SetFieldsDto {
    fields;
}
exports.SetFieldsDto = SetFieldsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FieldDto], description: 'Substitui todos os campos do documento' }),
    (0, class_validator_1.IsArray)({ message: 'fields deve ser uma lista.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FieldDto),
    __metadata("design:type", Array)
], SetFieldsDto.prototype, "fields", void 0);
class ParticipantDto {
    signerId;
    roleLabel;
    required;
}
exports.ParticipantDto = ParticipantDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)('all', { message: 'signerId deve ser um ID válido.' }),
    __metadata("design:type", String)
], ParticipantDto.prototype, "signerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RoleLabel }),
    (0, class_validator_1.IsEnum)(client_1.RoleLabel, { message: 'roleLabel deve ser CONTRATANTE, CONTRATADO ou TESTEMUNHA.' }),
    __metadata("design:type", String)
], ParticipantDto.prototype, "roleLabel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true, description: 'Signatário obrigatório para concluir' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'required deve ser verdadeiro ou falso.' }),
    __metadata("design:type", Boolean)
], ParticipantDto.prototype, "required", void 0);
class SetParticipantsDto {
    participantes;
}
exports.SetParticipantsDto = SetParticipantsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ParticipantDto] }),
    (0, class_validator_1.IsArray)({ message: 'participantes deve ser uma lista.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ParticipantDto),
    __metadata("design:type", Array)
], SetParticipantsDto.prototype, "participantes", void 0);
class SendDto {
    mensagem;
    participantes;
    fields;
}
exports.SendDto = SendDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Olá! Segue o contrato para sua assinatura.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'A mensagem deve ser um texto.' }),
    (0, class_validator_1.MaxLength)(2000, { message: 'A mensagem deve ter no máximo 2000 caracteres.' }),
    __metadata("design:type", String)
], SendDto.prototype, "mensagem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ParticipantDto], description: 'Opcional: define/substitui os participantes no momento do envio' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'participantes deve ser uma lista.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ParticipantDto),
    __metadata("design:type", Array)
], SendDto.prototype, "participantes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [FieldDto], description: 'Opcional: define/substitui os campos no momento do envio' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'fields deve ser uma lista.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FieldDto),
    __metadata("design:type", Array)
], SendDto.prototype, "fields", void 0);
class SignDto {
    assinaturaImagemBase64;
    gestureMetadata;
}
exports.SignDto = SignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Imagem PNG do traço em base64 (com ou sem prefixo data:image/png;base64,)' }),
    (0, class_validator_1.IsString)({ message: 'A imagem da assinatura deve ser um texto base64.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'A imagem da assinatura é obrigatória.' }),
    __metadata("design:type", String)
], SignDto.prototype, "assinaturaImagemBase64", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Metadados do gesto: pontos, pressaoMedia, pressaoMaxima, velocidadeMedia, duracaoMs, dispositivo, biometriaVerificada etc.',
        example: { pressaoMedia: 0.52, pressaoMaxima: 0.91, velocidadeMedia: 1.3, duracaoMs: 2100, totalPontos: 180, dispositivo: 'Pixel 8', biometriaVerificada: true },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'gestureMetadata deve ser um objeto.' }),
    __metadata("design:type", Object)
], SignDto.prototype, "gestureMetadata", void 0);
class RejectDto {
    motivo;
}
exports.RejectDto = RejectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cláusula 3 incorreta' }),
    (0, class_validator_1.IsString)({ message: 'O motivo deve ser um texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Informe o motivo da recusa.' }),
    __metadata("design:type", String)
], RejectDto.prototype, "motivo", void 0);
class TitleDto {
    titulo;
}
exports.TitleDto = TitleDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)({ message: 'O título deve ser um texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'O título do documento é obrigatório.' }),
    (0, class_validator_1.MaxLength)(200, { message: 'O título deve ter no máximo 200 caracteres.' }),
    __metadata("design:type", String)
], TitleDto.prototype, "titulo", void 0);
//# sourceMappingURL=dto.js.map