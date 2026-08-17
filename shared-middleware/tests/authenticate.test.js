import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { createAuthenticateMiddleware } from '../src/authenticate.js';

describe('authenticate middleware', () => {
  const jwtSecret = 'test-secret';
  const authenticate = createAuthenticateMiddleware({ jwtSecret });

  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  it('accepts a validly signed token', () => {
    const token = jwt.sign({ userId: 'u1' }, jwtSecret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ userId: 'u1' });
  });

  it('rejects a token signed with alg "none"', () => {
    const token = jwt.sign({ userId: 'u1' }, undefined, { algorithm: 'none' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
