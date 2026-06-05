const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

// DELETE /api/comments/:id (Author or Lecturer only)
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { note: { include: { module: true } } },
    });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isAuthor = comment.authorId === req.user.id;
    const isLecturer = comment.note.module.lecturerId === req.user.id;

    if (!isAuthor && !isLecturer) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.comment.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
