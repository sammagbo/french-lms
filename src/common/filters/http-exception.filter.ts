import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
      private readonly logger = new Logger(HttpExceptionFilter.name);

      catch(exception: unknown, host: ArgumentsHost) {
            const ctx = host.switchToHttp();
            const response = ctx.getResponse<Response>();
            const request = ctx.getRequest<Request>();

            const status =
                  exception instanceof HttpException
                        ? exception.getStatus()
                        : HttpStatus.INTERNAL_SERVER_ERROR;

            const message =
                  exception instanceof HttpException
                        ? exception.getResponse()
                        : 'Internal server error';

            const userId = (request as any).user?.id || 'Anonymous';

            // Log do erro real no servidor
            this.logger.error(
                  `HTTP ${status} Error: ${JSON.stringify(message)}`,
                  (exception as any).stack,
                  `Request by: ${userId} on ${request.url}`
            );

            // Resposta limpa para o cliente
            response.status(status).json({
                  statusCode: status,
                  // Se for string, usa ela. Se for objeto (validation pipe), usa ele.
                  message: typeof message === 'string' ? message : (message as any).message || message,
                  timestamp: new Date().toISOString(),
                  path: request.url,
            });
      }
}
