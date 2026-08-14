import bcrypt from 'bcrypt';

const BCRYPT_COST_FACTOR = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export { hashPassword, verifyPassword, BCRYPT_COST_FACTOR };
