const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'lecturer') {
      const modules = await prisma.module.findMany({
        where: { lecturerId: req.user.id },
        include: { notes: { select: { id: true } } },
      });
      const noteIds = modules.flatMap((m) => m.notes.map((n) => n.id));

      const proposals = await prisma.editProposal.findMany({
        where: { noteId: { in: noteIds }, status: 'pending' },
        include: {
          proposer: { select: { fullName: true } },
          note: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.json(
        proposals.map((p) => ({
          id: p.id,
          type: 'proposal_submitted',
          title: 'New edit proposed',
          body: `${p.proposer.fullName} proposed a change to "${p.note.title}"`,
          noteId: p.note.id,
          initialTab: 'proposals',
          createdAt: p.createdAt,
        }))
      );
    } else {
      const proposals = await prisma.editProposal.findMany({
        where: {
          proposedBy: req.user.id,
          status: { in: ['approved', 'rejected'] },
        },
        include: {
          note: { select: { id: true, title: true } },
        },
        orderBy: { reviewedAt: 'desc' },
        take: 50,
      });

      return res.json(
        proposals.map((p) => ({
          id: p.id,
          type: p.status === 'approved' ? 'proposal_approved' : 'proposal_rejected',
          title: p.status === 'approved' ? 'Proposal Approved' : 'Proposal Rejected',
          body:
            p.status === 'approved'
              ? `Your edit to "${p.note.title}" was approved`
              : `Your edit to "${p.note.title}" was not approved${p.rejectionReason ? `: ${p.rejectionReason}` : ''}`,
          noteId: p.note.id,
          initialTab: 'proposals',
          createdAt: p.reviewedAt || p.createdAt,
        }))
      );
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
