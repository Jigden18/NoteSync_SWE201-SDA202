const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

const SEVEN_DAYS = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = [];

    if (req.user.role === 'lecturer') {
      const modules = await prisma.module.findMany({
        where: { lecturerId: req.user.id },
        include: { notes: { select: { id: true } } },
      });
      const noteIds = modules.flatMap((m) => m.notes.map((n) => n.id));

      const [proposals, comments] = await Promise.all([
        prisma.editProposal.findMany({
          where: { noteId: { in: noteIds }, status: 'pending' },
          include: {
            proposer: { select: { fullName: true } },
            note: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.comment.findMany({
          where: {
            noteId: { in: noteIds },
            authorId: { not: req.user.id },
            createdAt: { gte: SEVEN_DAYS },
          },
          include: {
            author: { select: { fullName: true } },
            note: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
      ]);

      notifications.push(
        ...proposals.map((p) => ({
          id: `proposal-${p.id}`,
          type: 'proposal_submitted',
          title: 'New edit proposed',
          body: `${p.proposer.fullName} proposed a change to "${p.note.title}"`,
          noteId: p.note.id,
          initialTab: 'proposals',
          createdAt: p.createdAt,
        })),
        ...comments.map((c) => ({
          id: `comment-${c.id}`,
          type: 'comment',
          title: 'New comment',
          body: `${c.author.fullName} commented on "${c.note.title}"`,
          noteId: c.note.id,
          initialTab: 'comments',
          createdAt: c.createdAt,
        }))
      );
    } else {
      const [proposals, enrolments] = await Promise.all([
        prisma.editProposal.findMany({
          where: { proposedBy: req.user.id, status: { in: ['approved', 'rejected'] } },
          include: { note: { select: { id: true, title: true } } },
          orderBy: { reviewedAt: 'desc' },
          take: 50,
        }),
        prisma.enrolment.findMany({
          where: { studentId: req.user.id },
          include: { module: { include: { notes: { select: { id: true } } } } },
        }),
      ]);

      const noteIds = enrolments.flatMap((e) => e.module.notes.map((n) => n.id));

      const comments = await prisma.comment.findMany({
        where: {
          noteId: { in: noteIds },
          authorId: { not: req.user.id },
          createdAt: { gte: SEVEN_DAYS },
        },
        include: {
          author: { select: { fullName: true } },
          note: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      notifications.push(
        ...proposals.map((p) => ({
          id: `proposal-${p.id}`,
          type: p.status === 'approved' ? 'proposal_approved' : 'proposal_rejected',
          title: p.status === 'approved' ? 'Proposal Approved' : 'Proposal Rejected',
          body:
            p.status === 'approved'
              ? `Your edit to "${p.note.title}" was approved`
              : `Your edit to "${p.note.title}" was not approved${p.rejectionReason ? `: ${p.rejectionReason}` : ''}`,
          noteId: p.note.id,
          initialTab: 'proposals',
          createdAt: p.reviewedAt || p.createdAt,
        })),
        ...comments.map((c) => ({
          id: `comment-${c.id}`,
          type: 'comment',
          title: 'New comment',
          body: `${c.author.fullName} commented on "${c.note.title}"`,
          noteId: c.note.id,
          initialTab: 'comments',
          createdAt: c.createdAt,
        }))
      );
    }

    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json(notifications.slice(0, 50));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
