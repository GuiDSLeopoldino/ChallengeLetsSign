import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthUser, CurrentUser, Roles } from '../common/auth';
import { Role } from '@prisma/client';

class TestEmailDto {
  email!: string;
  template?: 'invite' | 'signed' | 'completed' | 'rejected' | 'cancelled' | 'new-version' | 'reminder' | 'welcome' | 'password-reset';
}

@ApiTags('Notificações')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('test')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Envia e-mail de teste (apenas admin)' })
  async testEmail(@CurrentUser() user: AuthUser, @Body() dto: TestEmailDto) {
    const template = dto.template || 'welcome';
    const baseContext = {
      nomeDestinatario: 'Usuário Teste',
      tituloDocumento: 'Documento de Teste',
      linkDocumento: 'doc-123',
      nomeRemetente: user.nome,
    };

    switch (template) {
      case 'invite':
        await this.notifications.sendDocumentInvite(dto.email, { ...baseContext, mensagem: 'Mensagem de teste' });
        break;
      case 'signed':
        await this.notifications.sendDocumentSigned(dto.email, { ...baseContext, nomeRemetente: 'Signatário Teste' });
        break;
      case 'completed':
        await this.notifications.sendDocumentCompleted(dto.email, { ...baseContext, dataConclusao: new Date() });
        break;
      case 'rejected':
        await this.notifications.sendDocumentRejected(dto.email, { ...baseContext, motivoRecusa: 'Motivo de teste' });
        break;
      case 'cancelled':
        await this.notifications.sendDocumentCancelled(dto.email, { ...baseContext, motivoRecusa: 'Cancelado pelo admin' });
        break;
      case 'new-version':
        await this.notifications.sendNewVersion(dto.email, baseContext);
        break;
      case 'reminder':
        await this.notifications.sendReminder(dto.email, baseContext);
        break;
      case 'welcome':
        await this.notifications.sendWelcome(dto.email, 'Usuário Teste');
        break;
      case 'password-reset':
        await this.notifications.sendPasswordReset(dto.email, 'Usuário Teste', 'token-teste-123');
        break;
    }
    return { mensagem: `E-mail de teste (${template}) enviado para ${dto.email}` };
  }
}