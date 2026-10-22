import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensagem: string | string[] = 'Erro interno do servidor. Tente novamente mais tarde.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body: any = exception.getResponse();
      mensagem = typeof body === 'string' ? body : body.message ?? exception.message;
      if (status === 404 && typeof mensagem === 'string' && mensagem.startsWith('Cannot ')) mensagem = 'Rota não encontrada.';
      if (status === 413) mensagem = 'Arquivo ou requisição muito grande.';
      if (status === 400 && mensagem === 'Bad Request') mensagem = 'Requisição inválida.';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = 409;
        mensagem = 'Registro já existente (valor duplicado).';
      } else if (exception.code === 'P2025') {
        status = 404;
        mensagem = 'Registro não encontrado.';
      }
    } else if ((exception as any)?.type === 'entity.too.large') {
      status = 413;
      mensagem = 'Requisição muito grande.';
    } else if ((exception as any)?.type === 'entity.parse.failed') {
      status = 400;
      mensagem = 'JSON inválido no corpo da requisição.';
    }

    if (status >= 500) this.logger.error(`${req.method} ${req.url}`, (exception as any)?.stack);
    else this.logger.warn(`${req.method} ${req.url} -> ${status} ${JSON.stringify(mensagem)}`);

    const lista = Array.isArray(mensagem) ? mensagem : [mensagem];
    res.status(status).json({
      statusCode: status,
      mensagem: lista[0],
      erros: lista,
      caminho: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
