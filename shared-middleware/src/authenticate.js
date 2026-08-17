import jwt from 'jsonwebtoken';

function createAuthenticateMiddleware({ jwtSecret }) {
  return function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'missing_token' });
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      req.user = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      return next();
    } catch {
      return res.status(401).json({ error: 'invalid_token' });
    }
  };
}

export { createAuthenticateMiddleware };
