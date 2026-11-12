// Pour transformer proprement nos erreurs métier en réponses HTTP standardisées (RFC 9457)

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from './domain.error.js';

const statusByCode: Record<string, number> = {
  EMAIL_ALREADY_EXISTS: 409,
  PHONE_ALREADY_EXISTS: 409,
  INVALID_CREDENTIALS: 401,
  ACCOUNT_LOCKED: 429,
  ACCOUNT_SUSPENDED: 403,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const status = statusByCode[error.code] ?? 400;

    response.status(status).json({
      type: `https://taskd.example{error.code.toLowerCase().replaceAll('_', '-')}`,
      title: error.message,
      status,
      instance: request.url,
    });
  }
}
