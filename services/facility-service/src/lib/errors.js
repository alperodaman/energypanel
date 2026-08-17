function createNotFoundError(message) {
  const error = new Error(message);
  error.code = 'NOT_FOUND';
  return error;
}

function createConflictError(message) {
  const error = new Error(message);
  error.code = 'CONFLICT';
  return error;
}

export { createNotFoundError, createConflictError };
