import crypto from 'node:crypto';

function createInternalAuthMiddleware({ secret }) {
  const secretBuffer = Buffer.from(secret);

  return function internalAuthenticate(req, res, next) {
    const provided = req.headers['x-internal-secret'];
    if (!provided) {
      return res.status(401).json({ error: 'invalid_internal_secret' });
    }

    const providedBuffer = Buffer.from(provided);
    if (
      providedBuffer.length !== secretBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, secretBuffer)
    ) {
      return res.status(401).json({ error: 'invalid_internal_secret' });
    }

    return next();
  };
}

export { createInternalAuthMiddleware };
