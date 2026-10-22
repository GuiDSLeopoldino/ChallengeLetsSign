import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { RoleLabel } from '@prisma/client';

export class FieldDto {
  @ApiProperty({ description: 'ID do signatário (participante) dono do campo' })
  @IsUUID('all', { message: 'signerId deve ser um ID válido.' })
  signerId!: string;

  @ApiProperty({ example: 1, description: 'Página (começa em 1)' })
  @IsInt({ message: 'A página deve ser um número inteiro.' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1.' })
  page!: number;

  @ApiProperty({ example: 0.1, description: 'X normalizado (0..1) a partir da esquerda' })
  @IsNumber({}, { message: 'x deve ser numérico.' }) @Min(0, { message: 'x deve estar entre 0 e 1.' }) @Max(1, { message: 'x deve estar entre 0 e 1.' })
  x!: number;

  @ApiProperty({ example: 0.8, description: 'Y normalizado (0..1) a partir do topo' })
  @IsNumber({}, { message: 'y deve ser numérico.' }) @Min(0, { message: 'y deve estar entre 0 e 1.' }) @Max(1, { message: 'y deve estar entre 0 e 1.' })
  y!: number;

  @ApiProperty({ example: 0.3 })
  @IsNumber({}, { message: 'width deve ser numérico.' }) @Min(0.01, { message: 'width deve ser maior que 0.' }) @Max(1, { message: 'width deve ser no máximo 1.' })
  width!: number;

  @ApiProperty({ example: 0.08 })
  @IsNumber({}, { message: 'height deve ser numérico.' }) @Min(0.01, { message: 'height deve ser maior que 0.' }) @Max(1, { message: 'height deve ser no máximo 1.' })
  height!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean({ message: 'required deve ser verdadeiro ou falso.' })
  required?: boolean;

  @ApiPropertyOptional({ enum: RoleLabel, description: 'Se omitido, usa o papel do participante' })
  @IsOptional() @IsEnum(RoleLabel, { message: 'roleLabel deve ser CONTRATANTE, CONTRATADO ou TESTEMUNHA.' })
  roleLabel?: RoleLabel;
}

export class SetFieldsDto {
  @ApiProperty({ type: [FieldDto], description: 'Substitui todos os campos do documento' })
  @IsArray({ message: 'fields deve ser uma lista.' })
  @ValidateNested({ each: true }) @Type(() => FieldDto)
  fields!: FieldDto[];
}

export class ParticipantDto {
  @ApiProperty() @IsUUID('all', { message: 'signerId deve ser um ID válido.' })
  signerId!: string;

  @ApiProperty({ enum: RoleLabel })
  @IsEnum(RoleLabel, { message: 'roleLabel deve ser CONTRATANTE, CONTRATADO ou TESTEMUNHA.' })
  roleLabel!: RoleLabel;

  @ApiPropertyOptional({ default: true, description: 'Signatário obrigatório para concluir' })
  @IsOptional() @IsBoolean({ message: 'required deve ser verdadeiro ou falso.' })
  required?: boolean;
}

export class SetParticipantsDto {
  @ApiProperty({ type: [ParticipantDto] })
  @IsArray({ message: 'participantes deve ser uma lista.' })
  @ValidateNested({ each: true }) @Type(() => ParticipantDto)
  participantes!: ParticipantDto[];
}

export class SendDto {
  @ApiPropertyOptional({ example: 'Olá! Segue o contrato para sua assinatura.' })
  @IsOptional() @IsString({ message: 'A mensagem deve ser um texto.' }) @MaxLength(2000, { message: 'A mensagem deve ter no máximo 2000 caracteres.' })
  mensagem?: string;

  @ApiPropertyOptional({ type: [ParticipantDto], description: 'Opcional: define/substitui os participantes no momento do envio' })
  @IsOptional() @IsArray({ message: 'participantes deve ser uma lista.' })
  @ValidateNested({ each: true }) @Type(() => ParticipantDto)
  participantes?: ParticipantDto[];

  @ApiPropertyOptional({ type: [FieldDto], description: 'Opcional: define/substitui os campos no momento do envio' })
  @IsOptional() @IsArray({ message: 'fields deve ser uma lista.' })
  @ValidateNested({ each: true }) @Type(() => FieldDto)
  fields?: FieldDto[];
}

export class SignDto {
  @ApiProperty({ description: 'Imagem PNG do traço em base64 (com ou sem prefixo data:image/png;base64,)' })
  @IsString({ message: 'A imagem da assinatura deve ser um texto base64.' })
  @IsNotEmpty({ message: 'A imagem da assinatura é obrigatória.' })
  assinaturaImagemBase64!: string;

  @ApiPropertyOptional({
    description: 'Metadados do gesto: pontos, pressaoMedia, pressaoMaxima, velocidadeMedia, duracaoMs, dispositivo, biometriaVerificada etc.',
    example: { pressaoMedia: 0.52, pressaoMaxima: 0.91, velocidadeMedia: 1.3, duracaoMs: 2100, totalPontos: 180, dispositivo: 'Pixel 8', biometriaVerificada: true },
  })
  @IsOptional() @IsObject({ message: 'gestureMetadata deve ser um objeto.' })
  gestureMetadata?: Record<string, unknown>;
}

export class RejectDto {
  @ApiProperty({ example: 'Cláusula 3 incorreta' })
  @IsString({ message: 'O motivo deve ser um texto.' }) @IsNotEmpty({ message: 'Informe o motivo da recusa.' })
  motivo!: string;
}

export class TitleDto {
  @ApiProperty() @IsString({ message: 'O título deve ser um texto.' }) @IsNotEmpty({ message: 'O título do documento é obrigatório.' })
  @MaxLength(200, { message: 'O título deve ter no máximo 200 caracteres.' })
  titulo!: string;
}

export { ArrayMinSize };
