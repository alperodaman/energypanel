import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticateSocket } from '../../src/middleware/authenticateSocket.js';

describe('authenticateSocket', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  function mockSocket(token) {
    return {
      handshake: { auth: { token } },
      data: {},
      disconnect: jest.fn(),
    };
  }

  it('accepts a validly signed token', () => {
    const token = jwt.sign({ userId: 'u1', email: 'a@test.local' }, process.env.JWT_SECRET);
    const socket = mockSocket(token);
    const next = jest.fn();

    authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect(socket.data.userId).toBe('u1');
  });

  it('rejects a token signed with alg "none"', () => {
    const token = jwt.sign({ userId: 'u1' }, undefined, { algorithm: 'none' });
    const socket = mockSocket(token);
    const next = jest.fn();

    authenticateSocket(socket, next);

    expect(socket.disconnect).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
