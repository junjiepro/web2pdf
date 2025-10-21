export type ErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'bad_request'
  | 'timeout'
  | 'invalid_config'
  | 'url_blocked'
  | 'not_found'

export class AppError extends Error {
  statusCode: number
  code: ErrorCode
  details?: Record<string, unknown>

  constructor(message: string, statusCode: number, code: ErrorCode, details?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace?.(this, this.constructor)
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'unauthorized')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'forbidden')
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: Record<string, unknown>) {
    super(message, 400, 'bad_request', details)
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request Timeout') {
    super(message, 504, 'timeout')
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid configuration', details?: Record<string, unknown>) {
    super(message, 400, 'invalid_config', details)
  }
}

export class UrlBlockedError extends AppError {
  constructor(message = 'URL blocked by policy', details?: Record<string, unknown>) {
    super(message, 400, 'url_blocked', details)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404, 'not_found')
  }
}

export function toErrorResponse(err: unknown): { statusCode: number; body: { error: { code: ErrorCode; message: string; details?: Record<string, unknown> } } } {
  if (err instanceof AppError) {
    const { statusCode, code, message, details } = err
    return {
      statusCode,
      body: { error: { code, message, ...(details ? { details } : {}) } },
    }
  }
  return {
    statusCode: 500,
    body: { error: { code: 'bad_request', message: 'Internal Server Error' } },
  }
}
