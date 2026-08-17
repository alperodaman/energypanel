import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import { prisma } from '../../src/db.js';
import { hashPassword } from '../../src/lib/password.js';
import { login } from '../../src/services/authService.js';

describe('authService.login timing-safety', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls bcrypt.compare when the user does not exist', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    const compareSpy = jest.spyOn(bcrypt, 'compare');

    await expect(login({ email: 'nouser@test.local', password: 'whatever' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'invalid_credentials',
    });
    expect(compareSpy).toHaveBeenCalledTimes(1);
  });

  it('calls bcrypt.compare when the password is wrong', async () => {
    const passwordHash = await hashPassword('correct-password');
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-1',
      email: 'user@test.local',
      passwordHash,
    });
    const compareSpy = jest.spyOn(bcrypt, 'compare');

    await expect(login({ email: 'user@test.local', password: 'wrong-password' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'invalid_credentials',
    });
    expect(compareSpy).toHaveBeenCalledTimes(1);
  });
});
