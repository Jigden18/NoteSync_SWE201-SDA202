const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireLecturer } = require('../middleware/auth');

// PATCH /api/versions/:id/pin (Lecturer only)
router.patch('/:id/pin', authenticate, requireLecturer, async (req, res) => {
  const { id } = req.params;
  const { isPinned } = req.body;
  if (isPinned === undefined) return res.status(400).json({ error: 'isPinned is required' });

  try {
    const version = await prisma.noteVersion.findUnique({
      where: { id },
      include: { note: { include: { module: true } } },
    });
    if (!version) return res.status(404).json({ error: 'Version not found' });
    if (version.note.module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.noteVersion.update({
      where: { id },
      data: { isPinned },
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
