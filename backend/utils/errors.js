export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function badRequest(message, details = null) {
  return new AppError(400, message, details);
}

export function unauthorized(message = 'Unauthorized.') {
  return new AppError(401, message);
}

export function forbidden(message = 'Access denied.') {
  return new AppError(403, message);
}

export function notFound(message = 'Resource not found.') {
  return new AppError(404, message);
}

export function mapDatabaseError(error) {
  if (!error?.code) return null;

  if (error.code === '23505') {
    const isRegistrationIdnoConflict = error.constraint?.includes('registrations_idno_key');
    const isSubmissionIdnoConflict = error.constraint?.includes('agent_submissions_idno_key');
    const isEmailConflict = error.constraint?.includes('users_email_key');

    let message = 'Duplicate value violates unique constraint.';
    if (isRegistrationIdnoConflict) message = 'A registration with this IDNO already exists.';
    if (isSubmissionIdnoConflict) message = 'This IDNO has already been submitted by another agent.';
    if (isEmailConflict) message = 'This email is already registered.';

    return new AppError(409, message, {
      constraint: error.constraint,
      detail: error.detail
    });
  }

  if (error.code === '23503') {
    return new AppError(400, 'Related resource does not exist.', {
      constraint: error.constraint,
      detail: error.detail
    });
  }

  if (error.code === '23514') {
    return new AppError(400, 'Data failed business constraint validation.', {
      constraint: error.constraint,
      detail: error.detail
    });
  }

  if (error.code === '22P02') {
    return new AppError(400, 'Invalid input format.', { detail: error.detail });
  }

  return null;
}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
