import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';

/** Trường nhạy cảm — không log raw, thay bằng `***`. */
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'pass',
  'pwd',
  'authorization',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'client_secret',
  'private_key',
  'service_account',
  'firebase_service_account',
]);

const MAX_BODY_LEN = 1500;
const MAX_RES_LEN = 1500;

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 12) return '[deep]';
  if (Array.isArray(value)) {
    // Mảng không tính 1 cấp depth (chỉ object mới tính).
    return value.slice(0, 50).map((v) => redact(v, depth));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '***';
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

function shortJson(value: unknown, max: number): string {
  if (value === null || value === undefined) return '';
  let str: string;
  try {
    str = typeof value === 'string' ? value : JSON.stringify(redact(value));
  } catch {
    str = String(value);
  }
  if (str.length > max) {
    return str.slice(0, max) + `…(${str.length - max} more chars)`;
  }
  return str;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctxType = context.getType();
    if (ctxType !== 'http') {
      return next.handle();
    }
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: { sub?: number | string; username?: string } }>();
    const res = http.getResponse<Response>();

    const method = req.method;
    const url = req.originalUrl || req.url;
    const startedAt = Date.now();

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const user = req.user;
    const userPart = user ? ` user=${user.username ?? user.sub ?? '?'}` : '';

    const hasBody =
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
      req.body &&
      typeof req.body === 'object' &&
      Object.keys(req.body as object).length > 0;
    const queryStr =
      req.query && Object.keys(req.query).length
        ? ` query=${shortJson(req.query, 300)}`
        : '';
    const bodyStr = hasBody ? ` body=${shortJson(req.body, MAX_BODY_LEN)}` : '';

    this.logger.log(`→ ${method} ${url} ip=${ip}${userPart}${queryStr}${bodyStr}`);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const elapsed = Date.now() - startedAt;
          const status = res.statusCode;
          this.logger.log(
            `← ${method} ${url} ${status} ${elapsed}ms body=${shortJson(data, MAX_RES_LEN)}`,
          );
        },
        error: (err) => {
          const elapsed = Date.now() - startedAt;
          const status = err?.status || res.statusCode || 500;
          const msg = err?.message || String(err);
          this.logger.error(
            `✗ ${method} ${url} ${status} ${elapsed}ms err="${msg}"`,
          );
        },
      }),
    );
  }
}
