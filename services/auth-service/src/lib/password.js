import bcrypt from 'bcrypt';

const BCRYPT_COST_FACTOR = 12;

// Precomputed bcrypt hash (cost 12) of an arbitrary password, used to run
// bcrypt.compare against a non-existent user so login takes the same time
// as a wrong-password attempt and doesn't leak which emails are registered.
const DUMMY_PASSWORD_HASH = '$2b$12$ZjW5LmysLkpNuY3v5rTfHO7brm8Szr2Klv.1ZfZW.4eGRWC1qMxS.';

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export { hashPassword, verifyPassword, BCRYPT_COST_FACTOR, DUMMY_PASSWORD_HASH };
