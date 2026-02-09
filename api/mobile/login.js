const express = require('express');
const router = express.Router();
const db = require('../../database');
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get(
    `SELECT id, role FROM users WHERE email = ? AND password = ?`,
    [email, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'DB error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        'SECRET_KEY',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        role: user.role
      });
    }
  );
});

module.exports = router;
