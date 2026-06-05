const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireLecturer(req, res, next) {
  if (!req.user || req.user.role !== 'lecturer') {
    return res.status(403).json({ error: 'Lecturer role required' });
  }
  next();
}

async function verifyEnrolment(userId, moduleId) {
  const e = await prisma.enrolment.findUnique({
    where: {
      moduleId_studentId: {
        moduleId,
        studentId: userId,
      },
    },
  });
  return !!e;
}

module.exports = {
  authenticate,
  requireLecturer,
  verifyEnrolment,
};
