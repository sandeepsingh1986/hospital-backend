const jwt = require('jsonwebtoken');

function authJwt(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Token missing' });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  jwt.verify(token, 'SECRET_KEY', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded; // { userId, role }
    next();
  });
}

module.exports = authJwt;
