import jwt from 'jsonwebtoken';

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    socket.disconnect();
    return next(new Error('unauthorized'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    socket.data.userId = decoded.userId;
    socket.data.email = decoded.email;
    return next();
  } catch {
    socket.disconnect();
    return next(new Error('unauthorized'));
  }
}

export { authenticateSocket };
