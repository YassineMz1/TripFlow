import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = res;
    } else if (exception && (exception as any).status && (exception as any).message) {
      status = (exception as any).status;
      message = (exception as any).message;
    }

    // Ensure message is serializable
    try {
      this.logger.error(`HTTP ${status} - ${JSON.stringify(message)}`);
    } catch (e) {
      this.logger.error('HTTP error', exception as any);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: typeof message === 'string' ? message : (message as any),
    });
  }
}
