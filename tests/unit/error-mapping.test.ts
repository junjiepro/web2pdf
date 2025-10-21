import { toErrorResponse, TimeoutError, ValidationError } from '../../src/errors'

describe('Error mapping', () => {
  it('maps AppError subclasses to code and status', () => {
    const { statusCode, body } = toErrorResponse(new TimeoutError('Timed out'))
    expect(statusCode).toBe(504)
    expect(body).toEqual({ error: { code: 'timeout', message: 'Timed out' } })
  })

  it('maps unknown errors to 500', () => {
    const { statusCode, body } = toErrorResponse(new Error('boom'))
    expect(statusCode).toBe(500)
    expect(body.error.code).toBe('bad_request')
  })

  it('includes details when provided', () => {
    const { body } = toErrorResponse(new ValidationError('bad', { field: 'x' }))
    expect(body.error.details).toEqual({ field: 'x' })
  })
})
