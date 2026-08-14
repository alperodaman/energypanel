function createConflictError(message) {
  const error = new Error(message);
  error.code = 'CONFLICT';
  return error;
}

function createUnauthorizedError(message) {
  const error = new Error(message);
  error.code = 'UNAUTHORIZED';
  return error;
}

export { createConflictError, createUnauthorizedError };
