const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { email, studentId, fullName, role, password } = req.body;
  if (!fullName || !role || !password || (!email && !studentId)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName,
        email: email || null,
        studentId: studentId || null,
        role,
        passwordHash: hash,
      },
    });
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    const { passwordHash, ...userResponse } = user;
    return res.json({ token, user: userResponse });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email or Student ID already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password required' });
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { studentId: identifier }],
      },
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    const { passwordHash, ...userResponse } = user;
    return res.json({ token, user: userResponse });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Refresh
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user.id, role: req.user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    const { passwordHash, ...userResponse } = req.user;
    return res.json({ token, user: userResponse });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Push Token
router.patch('/push-token', authenticate, async (req, res) => {
  const { token } = req.body;
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { expoPushToken: token },
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Profile
router.patch('/profile', authenticate, async (req, res) => {
  const { fullName, email, studentId } = req.body;
  try {
    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (email !== undefined) data.email = email || null;
    if (studentId !== undefined) data.studentId = studentId || null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });
    const { passwordHash, ...userResponse } = user;
    return res.json(userResponse);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email or Student ID already exists' });
    }
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
