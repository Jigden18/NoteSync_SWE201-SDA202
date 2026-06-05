const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireLecturer } = require('../middleware/auth');

// DELETE /api/annotations/:id (Lecturer only)
router.delete('/:id', authenticate, requireLecturer, async (req, res) => {
  const { id } = req.params;
  try {
    const annotation = await prisma.noteAnnotation.findUnique({
      where: { id },
      include: { note: { include: { module: true } } },
    });
    if (!annotation) return res.status(404).json({ error: 'Annotation not found' });
    if (annotation.note.module.lecturerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.noteAnnotation.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
