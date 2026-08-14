import { hashPassword, verifyPassword } from '../../src/lib/password.js';

describe('hashPassword / verifyPassword', () => {
  it('hashes the password to a different value than the plaintext', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
  });

  it('verifies a matching password', async () => {
    const hash = await hashPassword('password123');
    expect(await verifyPassword('password123', hash)).toBe(true);
  });

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('password123');
    expect(await verifyPassword('wrongpassword', hash)).toBe(false);
  });
});
